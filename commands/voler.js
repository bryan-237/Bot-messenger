const eco = require("../eco.js");
module.exports = { name: "voler", run: async (api, event) => {
  const id = String(event.senderID), tid = event.threadID;
  const cible = Object.keys(event.mentions || {})[0] || (event.messageReply && event.messageReply.senderID);
  if (!cible) return api.sendMessage("Mentionne quelqu'un ou réponds à son message : .voler @user", tid);
  const t = String(cible);
  if (t === id) return api.sendMessage("😅 Tu ne peux pas te voler toi-même.", tid);
  const CD = 10 * 60 * 1000;
  const rest = (eco.get(id).lastSteal || 0) + CD - Date.now();
  if (rest > 0) return api.sendMessage("⏳ La police te cherche. Attends " + Math.ceil(rest / 60000) + " min.", tid);
  const victime = eco.get(t).coins;
  if (victime < 100) return api.sendMessage("Il n'a presque rien dans son portefeuille.", tid);
  if (eco.get(id).coins < 50) return api.sendMessage("Il te faut au moins 50 pièces (amende en cas d'échec).", tid);
  if (Math.random() < 0.4) {
    const vol = Math.max(10, Math.floor(victime * (0.1 + Math.random() * 0.2)));
    eco.update(t, (u) => { u.coins -= vol; });
    const n = eco.update(id, (u) => { u.coins += vol; u.lastSteal = Date.now(); });
    api.sendMessage("🥷 Vol réussi : +" + vol + " pièces !\n💰 Solde : " + n.coins, tid);
  } else {
    const amende = Math.min(eco.get(id).coins, 50 + Math.floor(Math.random() * 100));
    const n = eco.update(id, (u) => { u.coins -= amende; u.lastSteal = Date.now(); });
    api.sendMessage("🚓 Tu t'es fait prendre ! Amende : -" + amende + "\n💰 Solde : " + n.coins, tid);
  }
}};
