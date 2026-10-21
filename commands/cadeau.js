const eco = require("../eco.js");
module.exports = { name: "cadeau", run: async (api, event) => {
  const id = String(event.senderID), tid = event.threadID;
  const p = (event.body || "").trim().split(/\s+/);
  const cible = Object.keys(event.mentions || {})[0] || (event.messageReply && event.messageReply.senderID);
  const m = parseInt(p[p.length - 1]);
  if (!cible || !m) return api.sendMessage("Utilise : .cadeau @user 100", tid);
  const t = String(cible);
  if (t === id) return api.sendMessage("😅 Tu ne peux pas te faire un cadeau à toi-même.", tid);
  if (m < 10) return api.sendMessage("Minimum : 10 pièces.", tid);
  if (eco.get(id).coins < m) return api.sendMessage("❌ Tu n'as pas assez de pièces.", tid);
  eco.update(id, (u) => { u.coins -= m; });
  const n = eco.update(t, (u) => { u.coins += m; });
  api.sendMessage("🎁 Cadeau envoyé : " + m + " pièces !\n💰 Ton solde : " + eco.get(id).coins, tid);
}};
