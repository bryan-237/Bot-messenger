const eco = require("../eco.js");
const jour = () => new Date(Date.now() + 3600000).toISOString().slice(0, 10);
const j = (ts) => ts ? new Date(ts + 3600000).toISOString().slice(0, 10) : "";
module.exports = { name: "quete", run: async (api, event) => {
  const id = String(event.senderID), tid = event.threadID;
  const u = eco.get(id), today = jour();
  const q = [
    ["💼 Faire .travail", j(u.lastWork) === today],
    ["🥷 Tenter un .voler", j(u.lastSteal) === today],
    ["⚔️ Faire un .duel", u.lastDuel === today],
  ];
  const fini = q.every((x) => x[1]);
  const arg = (event.body || "").trim().toLowerCase().split(/\s+/)[1];
  if (arg === "reclamer") {
    if (u.questJour === today) return api.sendMessage("✅ Déjà réclamée aujourd'hui.", tid);
    if (!fini) return api.sendMessage("❌ Quêtes pas terminées. Tape .quete", tid);
    const n = eco.update(id, (x) => { x.coins += 300; x.questJour = today; });
    return api.sendMessage("🎁 Récompense : +300 pièces !\n💰 Solde : " + n.coins, tid);
  }
  api.sendMessage("📜 QUÊTES DU JOUR\n\n" + q.map((x) => (x[1] ? "✅ " : "⬜ ") + x[0]).join("\n") + "\n\n" + (fini ? "Tape .quete reclamer pour 300 💰" : "Termine les 3 pour gagner 300 💰"), tid);
}};
