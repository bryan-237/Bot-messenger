const eco = require("../eco.js");
module.exports = { name: "travail", run: async (api, event) => {
  const id = String(event.senderID), tid = event.threadID;
  const CD = 60 * 60 * 1000;
  const last = eco.get(id).lastWork || 0;
  const rest = last + CD - Date.now();
  if (rest > 0) return api.sendMessage("⏳ Reviens dans " + Math.ceil(rest / 60000) + " min.", tid);
  const jobs = ["livreur", "développeur", "mécanicien", "streamer", "boulanger", "ninja"];
  const gain = 50 + Math.floor(Math.random() * 151);
  const n = eco.update(id, (u) => { u.coins += gain; u.lastWork = Date.now(); });
  api.sendMessage("💼 Tu as travaillé comme " + jobs[Math.floor(Math.random() * jobs.length)] + " : +" + gain + " pièces\n💰 Solde : " + n.coins, tid);
}};
