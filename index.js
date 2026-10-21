const login = require("@dongdev/fca-unofficial");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PREFIX = ".";
const ADMINS = ["61581453916589"];
const DIR = path.join(__dirname, "commands");
const DATA = path.join(__dirname, "data");
fs.mkdirSync(DIR, { recursive: true });
fs.mkdirSync(DATA, { recursive: true });

const MENU = `╭─────────────────╮
   🤖 MENU DU BOT
╰─────────────────╯

📌 Préfixe : ${PREFIX}

┌ 🛠 Commandes
│ ${PREFIX}menu  → affiche ce menu
│ ${PREFIX}ping  → teste le bot
│ ${PREFIX}heure → date et heure
│ ${PREFIX}id    → ton identifiant
│ ${PREFIX}list  → commandes installées
└──────────────`;

// ---------- Stockage (argent, niveaux...) ----------
function makeStore(file, defaults) {
  let data = {};
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
  let timer;
  const save = () => {
    clearTimeout(timer);
    timer = setTimeout(() => fs.writeFileSync(file, JSON.stringify(data, null, 2)), 500);
  };
  const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const setPath = (o, p, v) => {
    const ks = p.split("."); const last = ks.pop(); let c = o;
    for (const k of ks) { if (typeof c[k] !== "object" || c[k] === null) c[k] = {}; c = c[k]; }
    c[last] = v;
  };
  async function get(id, p, def) {
    id = String(id);
    if (!data[id]) { data[id] = defaults(id); save(); }
    if (!p) return data[id];
    const v = getPath(data[id], p);
    return v === undefined ? def : v;
  }
  async function set(id, value, p) {
    const rec = await get(id);
    if (p) setPath(rec, p, value); else Object.assign(rec, value);
    save(); return rec;
  }
  async function getAll() { return Object.values(data); }
  return { get, set, getAll };
}
const usersData = makeStore(path.join(DATA, "users.json"), (id) => ({
  userID: id, name: "Utilisateur", money: 0, exp: 0, data: {}, settings: {},
}));
const threadsData = makeStore(path.join(DATA, "threads.json"), (id) => ({
  threadID: id, threadName: "", data: {}, settings: {},
}));
usersData.getName = async (id) => (await usersData.get(id)).name;
usersData.addMoney = async (id, n) => {
  const u = await usersData.get(id); u.money = (u.money || 0) + n; return usersData.set(id, u);
};

// ---------- Outils globaux (fonts, formatMoney) ----------
const bold = (s) => String(s).replace(/[A-Za-z0-9]/g, (c) => {
  const x = c.charCodeAt(0);
  if (x >= 65 && x <= 90) return String.fromCodePoint(0x1d5d4 + x - 65);
  if (x >= 97 && x <= 122) return String.fromCodePoint(0x1d5ee + x - 97);
  return String.fromCodePoint(0x1d7ec + x - 48);
});
global.fonts = new Proxy({ bold }, { get: (t, k) => t[k] || ((s) => s) });
global.formatMoney = (n) => Number(n || 0).toLocaleString("fr-CA") + "$";

// ---------- Chargement des commandes ----------
const commands = new Map();
const nameOf = (c) => String(c.config ? c.config.name : c.name || "").toLowerCase();

function loadAll() {
  commands.clear();
  const failed = [];
  for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".js"))) {
    const p = path.join(DIR, f);
    try {
      delete require.cache[require.resolve(p)];
      const c = require(p);
      const run = c.config ? c.onStart : c.run;
      if (!nameOf(c) || typeof run !== "function") throw new Error("format non reconnu");
      commands.set(nameOf(c), c);
      if (c.config && Array.isArray(c.config.aliases))
        c.config.aliases.forEach((a) => commands.set(String(a).toLowerCase(), c));
    } catch (e) {
      failed.push(f);
      console.error("", f, "→", e.message.split("\n")[0]);
    }
  }
  const ok = new Set(commands.values()).size;
  console.log("Commandes chargées :", ok, "| échecs :", failed.length);
  return { ok, failed };
}
loadAll();

// ---------- Exécution ----------
async function runCommand(api, event, c, args, isAdmin) {
  const threadID = event.threadID;
  const send = (t) => api.sendMessage(t, threadID);
  if (!c.config) return c.run(api, event, args);

  const need = c.config.role || 0;
  if (need >= 2 && !isAdmin) return send("⛔ Réservé  l'admin du bot.");
  if (need === 1 && !isAdmin) {
    const info = await new Promise((r) => api.getThreadInfo(threadID, (e, i) => r(i)));
    const ids = ((info && info.adminIDs) || []).map((a) => String(a.id || a));
    if (!ids.includes(String(event.senderID))) return send("⛔ Réservé aux admins du groupe.");
  }

  // Nom du membre (pour usersData)
  const u = await usersData.get(event.senderID);
  if (u.name === "Utilisateur") {
    await new Promise((r) => api.getUserInfo(event.senderID, (e, info) => {
      if (!e && info && info[event.senderID]) u.name = info[event.senderID].name;
      r();
    }));
    await usersData.set(event.senderID, u);
  }

  const sendP = (body, tid, cb, replyTo) => new Promise((res) =>
    api.sendMessage(body, tid, (err, info) => { if (cb) cb(err, info); res(info); }, replyTo));
  const message = {
    reply: (body, cb) => sendP(body, threadID, cb, event.messageID),
    send: (body, tid, cb) => sendP(body, tid || threadID, cb),
    unsend: (id) => api.unsendMessage(id),
    reaction: (emoji, mid) => api.setMessageReaction(emoji, mid || event.messageID, () => {}, true),
    err: (e) => send(" " + (e && e.message ? e.message : e)),
  };
  const langs = c.langs || {};
  const dict = langs.fr || langs.en || Object.values(langs)[0] || {};
  const getLang = (key, ...a) => {
    let s = dict[key] !== undefined ? dict[key] : key;
    a.forEach((v, i) => { s = String(s).split("%" + (i + 1)).join(v); });
    return s;
  };

  await c.onStart({
    api, event, args, message, usersData, threadsData, getLang,
    role: isAdmin ? 2 : 0, commandName: nameOf(c), prefix: PREFIX,
    senderID: event.senderID, threadID, messageID: event.messageID,
  });
}

login({ appState: JSON.parse(fs.readFileSync("appstate.json", "utf8")) }, (err, api) => {
  if (err) return console.error(err);
  api.setOptions({ listenEvents: true, autoMarkRead: false, updatePresence: false });
  console.log("Bot connecté");

  api.listenMqtt(async (err, event) => {
  if (!err && event) { try { require("./reactions.js")(api, event); try { require("./commands/carte.js").handle(api, event); } catch (e) {} try { require("./commands/duel.js").handle(api, event); } catch (e) {} require("./membres.js")(api, event); } catch (e) { console.error(e); } }
    if (err) return console.error(err);
    if (event.type !== "message" || !event.body) return;
    const send = (t) => api.sendMessage(t, event.threadID);
    const [cmd, ...args] = event.body.trim().split(/\s+/);
    if (!cmd.startsWith(PREFIX)) return;
    const name = cmd.slice(1).toLowerCase();
    const isAdmin = ADMINS.includes(String(event.senderID));

    try {
      if (name === "menu_old")
        return api.sendMessage(
          { body: MENU, attachment: fs.createReadStream(__dirname + "/menu.mp4") },
          event.threadID
        );
      if (name === "ping") return send("pong 🏓");
      if (name === "heure") return send("🕒 " + new Date().toLocaleString("fr-CA"));
      if (name === "id_old") return send("🆔 " + event.senderID);
      if (name === "list") {
  const all = [...new Set([...commands.values()].map(nameOf))];
  const cats = [
    ["📈 Niveaux", ["rank", "rankup", "setrankup", "checktt"]],
    ["🎮 Fun", ["blague", "citation", "wanted", "pin", "ia", "dice", "slots", "pf", "choose", "roll", "ttt", "fast"]],
    ["💰 Économie", ["daily", "bal", "pay", "work", "fishing", "baicao"]],
    ["👥 Groupe", ["groupe", "welcome", "bye", "antiout", "notification", "kick", "setname"]],
    ["🛠️ Outils", ["id", "uid", "hello", "salut", "weather", "wiki", "math", "qr", "getlink", "unsend", "uptime", "system", "sleep", "wake", "say", "talk"]],
  ];
  const used = new Set();
  const lines = ["🤖 BRYAN BOT", ""];
  for (const [title, names] of cats) {
    const here = names.filter((n) => all.includes(n));
    here.forEach((n) => used.add(n));
    if (here.length) lines.push(title + " : " + here.join(", "));
  }
  const rest = all.filter((n) => !used.has(n));
  if (rest.length) lines.push("✨ Autres : " + rest.join(", "));
  lines.push("", "📌 " + all.length + " commandes • préfixe " + PREFIX);
  return send(lines.join("\n"));
}
if (name === "list_old")
        return send("📦 " + ([...new Set([...commands.values()].map(nameOf))].join(", ") || "aucune"));

      if (["install", "remove", "reload"].includes(name)) {
        if (!isAdmin) return send("⛔ Réservé  l'admin.");
        if (name === "reload") {
          const r = loadAll();
          return send(` ${r.ok} commandes chargées.` +
            (r.failed.length ? `\n checs : ${r.failed.join(", ")}` : ""));
        }
        const nom = (args[0] || "").toLowerCase();
        if (!/^[a-z0-9_-]+$/.test(nom)) return send("Nom invalide (lettres, chiffres, - et _).");
        const file = path.join(DIR, nom + ".js");
        if (name === "remove") {
          if (!fs.existsSync(file)) return send("Commande introuvable.");
          fs.unlinkSync(file); loadAll();
          return send(` ${nom} supprimée.`);
        }
        if (!args[1]) return send("Usage : .install nom lien");
        const res = await fetch(args[1]);
        if (!res.ok) return send(" Téléchargement impossible.");
        const code = await res.text();
        new vm.Script(code);
        fs.writeFileSync(file, code);
        loadAll();
        return send(` ${nom} installée.`);
      }

      const c = commands.get(name);
      if (c) await runCommand(api, event, c, args, isAdmin);
    } catch (e) {
      console.error(e);
      send(" Erreur : " + e.message);
    }
  });
})

