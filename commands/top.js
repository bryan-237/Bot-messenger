const fs = require("fs");
const path = require("path");
const eco = require("../eco.js");
const data = () => (global.__levels && global.__levels.cache) || (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "niveaux.json"), "utf8")); } catch { return {}; } })();
const levelOf = (exp) => Math.floor(Math.sqrt(exp / 3));
const nom = (api, id) => new Promise((r) => api.getUserInfo(id, (e, i) => r((i && i[id] && i[id].name) || "Joueur")));
const medals = ["🥇", "🥈", "🥉"];

module.exports = { name: "top", run: async (api, event) => {
  const tid = event.threadID;
  const mode = ((event.body || "").trim().split(/\s+/)[1] || "").toLowerCase();
  let rows, titre;

  if (["riches", "richesse", "pieces", "coins"].includes(mode)) {
    titre = "💰 TOP RICHESSE";
    const members = Object.keys(data()[tid] || {});
    rows = members.map((id) => { const u = eco.get(id); return [id, (u.coins || 0) + (u.bank || 0), "pièces"]; });
  } else if (["messages", "msgs"].includes(mode)) {
    titre = "💬 TOP MESSAGES";
    rows = Object.entries(data()[tid] || {}).map(([id, s]) => [id, s.msgs || 0, "msgs"]);
  } else {
    titre = "🏆 TOP NIVEAUX";
    rows = Object.entries(data()[tid] || {}).map(([id, s]) => [id, s.exp || 0, "exp", levelOf(s.exp || 0)]);
  }
  rows = rows.sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!rows.length) return api.sendMessage("Aucune donnée pour ce groupe.", tid);

  const names = await Promise.all(rows.map((r) => nom(api, r[0])));
  const txt = rows.map((r, i) => (medals[i] || (i + 1) + ".") + " " + names[i] + " : " + (r[3] !== undefined ? "Niv " + r[3] + " (" + r[1] + " exp)" : r[1] + " " + r[2])).join("\n");
  api.sendMessage(titre + "\n\n" + txt + "\n\n.top riches | .top messages", tid);
}};
