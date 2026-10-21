const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "economie.json");
const read = () => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return {}; } };

function get(id) { const d = read(); return d[id] || { coins: 0, last: 0 }; }
function update(id, fn) {
  const d = read();
  const u = d[id] || { coins: 0, last: 0 };
  fn(u);
  u.coins = Math.max(0, Math.floor(u.coins));
  d[id] = u;
  fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
  return u;
}
function parseBet(arg, coins) {
  if (!arg) return null;
  if (/^(all|tout)$/i.test(arg)) return coins;
  const n = parseInt(arg, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
module.exports = { get, update, parseBet };
