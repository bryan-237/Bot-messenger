const fs = require("fs");
const path = require("path");
const eco = require("../eco.js");
const data = () => (global.__levels && global.__levels.cache) || (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "niveaux.json"), "utf8")); } catch { return {}; } })();
const nom = (api, id) => new Promise((r) => api.getUserInfo(id, (e, i) => r((i && i[id] && i[id].name) || "Joueur")));
module.exports = { name: "classement", run: async (api, event) => {
  const tid = event.threadID;
  const rows = Object.keys(data()[tid] || {}).map((id) => { const u = eco.get(id); return [id, u.wins || 0, u.losses || 0]; })
    .filter((r) => r[1] + r[2] > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!rows.length) return api.sendMessage("Aucun duel joué pour l'instant. Lance-en un : .duel @user 100", tid);
  const names = await Promise.all(rows.map((r) => nom(api, r[0])));
  const med = ["🥇", "🥈", "🥉"];
  api.sendMessage("⚔️ CLASSEMENT DUELS\n\n" + rows.map((r, i) => (med[i] || (i + 1) + ".") + " " + names[i] + " : " + r[1] + " V / " + r[2] + " D").join("\n"), tid);
}};
