const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");
module.exports = {
  name: "pay",
  run: async (api, event) => {
    const tid = event.threadID;
    const from = String(event.senderID);
    let to = null;
    if (event.messageReply && event.messageReply.senderID) to = String(event.messageReply.senderID);
    else if (event.mentions && Object.keys(event.mentions).length) to = Object.keys(event.mentions)[0];
    const toks = (event.body || "").trim().split(/\s+/).slice(1);
    const amountTok = [...toks].reverse().find((t) => /^(\d+|all|tout)$/i.test(t));
    if (!to || !amountTok) return api.sendMessage("Utilise : .pay @personne 100 (ou .pay 100 en répondant à un message)", tid);
    if (to === from) return api.sendMessage("❌ Tu ne peux pas te payer toi-même.", tid);
    const coins = eco.get(from).coins;
    const amount = eco.parseBet(amountTok, coins);
    if (!amount) return api.sendMessage("❌ Montant invalide.", tid);
    if (amount > coins) return api.sendMessage("❌ Pas assez de pièces (" + coins + ").", tid);
    eco.update(to, (u) => { u.coins += amount; });
    const n = eco.update(from, (u) => { u.coins -= amount; });
    const ui = await L.ask((cb) => api.getUserInfo(to, cb));
    const toName = L.short(L.clean(ui && ui[to] && ui[to].name) || "Utilisateur", 28);
    const { buf } = await C.whoCard(api, from, {
      title: "TRANSFERT", label: "ENVOYÉ À " + toName.toUpperCase(), big: "-" + C.fmt(amount) + " pièces",
      color: "#ff9f6b", sub: "Nouveau solde : " + C.fmt(n.coins) + " pièces",
    });
    L.sendCard(api, tid, buf, "💸 " + amount + " pièces envoyées à " + toName);
  },
};
