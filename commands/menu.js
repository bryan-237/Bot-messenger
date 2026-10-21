const fs = require("fs");
const path = require("path");
const F = require("../fonts.js");
const U = require("../utils.js");

const PREFIX = ".";
const ROOT = path.join(__dirname, "..");
const BUILTIN = ["menu", "ping", "heure", "list", "reload"];
const CATS = [
  ["🎮", "Jeux", "jeux", [["ttt", "morpion contre le bot"], ["fast", "tape la phrase le plus vite"], ["dice", "duel de dés"], ["slots", "machine à sous"], ["pf", "pile ou face"], ["baicao", "cartes contre le bot"]]],
  ["💰", "Économie", "eco", [["daily", "récompense du jour"], ["bal", "ton solde de pièces"], ["pay", "envoyer des pièces"], ["work", "travailler pour gagner"], ["fishing", "pêcher"]]],
  ["📈", "Niveaux", "niveaux", [["rank", "ta carte de niveau"], ["checktt", "classement des messages"], ["rankup", "annonces de niveau on/off"], ["setrankup", "message de niveau"]]],
  ["🎨", "Créations", "creation", [["wanted", "avis de recherche"], ["citation", "citation avec portrait"], ["pin", "images Pinterest"], ["talk", "vidéo parlante"], ["qr", "créer un QR code"], ["say", "voix de synthèse"]]],
  ["🧠", "Infos & outils", "outils", [["ia", "poser une question à l'IA"], ["weather", "météo"], ["wiki", "Wikipédia"], ["math", "calculatrice"], ["sleep", "heure de coucher"], ["wake", "heure de réveil"], ["getlink", "lien d'un fichier"], ["choose", "faire un choix"], ["roll", "nombre aléatoire"]]],
  ["👥", "Groupe", "groupe", [["groupe", "infos du groupe"], ["id", "ta carte d'identité"], ["prefix", "afficher le préfixe"], ["welcome", "accueil on/off"], ["bye", "départs on/off"], ["antiout", "interdire de sortir"], ["kick", "retirer un membre"], ["setname", "changer un pseudo"], ["unsend", "retirer un message du bot"], ["notification", "annonce (admin du bot)"]]],
  ["⚙️", "Bot", "bot", [["list", "liste rapide"], ["uptime", "temps d'activité"], ["system", "infos système"], ["ping", "test du bot"], ["heure", "date et heure"], ["reload", "recharger (admin)"]]],
];
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function installed() {
  const set = new Set(BUILTIN);
  try { fs.readdirSync(__dirname).filter((f) => f.endsWith(".js")).forEach((f) => set.add(f.slice(0, -3))); } catch {}
  return set;
}

function overview(have) {
  const used = new Set();
  const lines = [];
  for (const [icon, title, , cmds] of CATS) {
    const names = cmds.map((c) => c[0]).filter((n) => have.has(n));
    names.forEach((n) => used.add(n));
    if (names.length) lines.push(icon + " " + F.b(title) + " (" + names.length + ") : " + names.map((n) => PREFIX + n).join("  "), "");
  }
  const rest = [...have].filter((n) => !used.has(n) && n !== "uid").sort();
  if (rest.length) lines.push("✨ " + F.b("Autres") + " (" + rest.length + ") : " + rest.map((n) => PREFIX + n).join("  "), "");
  return F.panel("🐐", "Menu — Bryan Bot", [
    "📌 " + F.bi("Préfixe") + " : " + PREFIX + "   •   🧩 " + have.size + " commandes",
    "",
    ...lines,
    "💡 " + F.bi("Détails") + " : " + PREFIX + "menu jeux  (ou eco, niveaux, creation, outils, groupe, bot)",
    "👑 " + F.bi("Maître") + " : Bryan",
  ]);
}

function detail(cat, have) {
  const [icon, title, , cmds] = cat;
  const lines = cmds.filter((c) => have.has(c[0])).map((c) => "▸ " + F.b(PREFIX + c[0]) + " — " + c[1]);
  return F.panel(icon, title, lines.length ? lines : ["Aucune commande installée dans cette catégorie."]);
}

module.exports = {
  name: "menu",
  run: (api, event) => {
    const tid = event.threadID;
    const arg = norm(U.args(event)[0]);
    const have = installed();
    if (arg) {
      const cat = CATS.find((c) => norm(c[2]) === arg || norm(c[1]) === arg);
      if (!cat) return api.sendMessage(F.panel("💡", "Menu", [F.b("Catégories") + " : jeux, eco, niveaux, creation, outils, groupe, bot"]), tid);
      return api.sendMessage(detail(cat, have), tid);
    }
    const video = path.join(ROOT, "menu.mp4");
    const msg = { body: overview(have) };
    if (fs.existsSync(video)) msg.attachment = fs.createReadStream(video);
    api.sendMessage(msg, tid);
  },
};
