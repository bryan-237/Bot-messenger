const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "rappels.json");
const read = () => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return []; } };
const write = (a) => fs.writeFileSync(FILE, JSON.stringify(a));
const UNITS = { s: 1000, m: 60000, h: 3600000, j: 86400000, d: 86400000 };

function demarrer(api) {
  if (global.__rappelTimer) return;
  global.__rappelTimer = setInterval(() => {
    const all = read(), now = Date.now();
    const due = all.filter((r) => r.at <= now);
    if (!due.length) return;
    write(all.filter((r) => r.at > now));
    due.forEach((r) => api.sendMessage("⏰ Rappel : " + r.msg, r.tid));
  }, 15000);
}

module.exports = { name: "rappel", run: async (api, event) => {
  const tid = event.threadID, id = String(event.senderID);
  demarrer(api);
  const p = (event.body || "").trim().split(/\s+/);
  const m = /^(\d+)(s|m|h|j|d)$/i.exec(p[1] || "");
  const msg = p.slice(2).join(" ");
  if (!m || !msg) return api.sendMessage("Utilise : .rappel 10m acheter du pain\nUnités : s, m, h, j", tid);
  const ms = parseInt(m[1]) * UNITS[m[2].toLowerCase()];
  if (ms < 5000 || ms > 7 * 86400000) return api.sendMessage("Durée : entre 5 secondes et 7 jours.", tid);
  const all = read();
  if (all.filter((r) => r.id === id).length >= 5) return api.sendMessage("❌ Maximum 5 rappels actifs.", tid);
  all.push({ id, tid, msg, at: Date.now() + ms });
  write(all);
  api.sendMessage("✅ Je te rappelle dans " + m[1] + m[2] + " : " + msg, tid);
}};
