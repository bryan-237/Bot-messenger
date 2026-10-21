const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "niveaux.json");
const CFG = path.join(__dirname, "membres.json");
const S = global.__levels || (global.__levels = { cache: null, timer: null, hook: false });
const read = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return {}; } };
const data = () => (S.cache = S.cache || read(FILE));
const flush = () => { try { if (S.cache) fs.writeFileSync(FILE, JSON.stringify(S.cache)); } catch {} };
function save() { clearTimeout(S.timer); S.timer = setTimeout(flush, 3000); }
if (!S.hook) { S.hook = true; process.on("SIGINT", () => { flush(); process.exit(0); }); }
const levelOf = (exp) => Math.floor(Math.sqrt(exp / 3));
const needFor = (lvl) => 3 * lvl * lvl;
const stats = (tid, uid) => (data()[tid] || {})[uid] || { msgs: 0, exp: 0 };
const top = (tid, key) => Object.entries(data()[tid] || {}).sort((a, b) => b[1][key || "exp"] - a[1][key || "exp"]);

function add(tid, uid) {
  const d = data();
  d[tid] = d[tid] || {};
  const u = d[tid][uid] || { msgs: 0, exp: 0, t: 0 };
  const before = levelOf(u.exp);
  u.msgs++;
  const now = Date.now();
  if (now - u.t > 5000) { u.exp++; u.t = now; }
  d[tid][uid] = u;
  save();
  const after = levelOf(u.exp);
  return after > before ? after : 0;
}

async function announce(api, event, level) {
  const tid = String(event.threadID), uid = String(event.senderID);
  const c = read(CFG)[tid] || {};
  if (!c.rankup) return;
  const C = require("./cards.js"), L = require("./lib.js");
  const ui = await L.ask((cb) => api.getUserInfo(uid, cb));
  const nm = L.short(L.clean(ui && ui[uid] && ui[uid].name) || "Membre", 25);
  const sub = L.short((c.rankupText || "Bravo {name} !").replace(/\{name\}/g, nm).replace(/\{level\}/g, String(level)), 50);
  const { buf } = await C.whoCard(api, uid, { title: "NIVEAU SUPÉRIEUR", label: "FÉLICITATIONS", big: "Niveau " + level, color: "#ffd60a", sub });
  L.sendCard(api, event.threadID, buf, "🎉 " + nm + " passe au niveau " + level + " !");
}
module.exports = { add, stats, top, levelOf, needFor, announce };
