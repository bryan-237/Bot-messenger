const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");
module.exports = {
  name: "bal",
  run: async (api, event) => {
    const tid = event.threadID;
    let id = String(event.senderID);
    if (event.messageReply && event.messageReply.senderID) id = String(event.messageReply.senderID);
    else if (event.mentions && Object.keys(event.mentions).length) id = Object.keys(event.mentions)[0];
    const ui = await L.ask((cb) => api.getUserInfo(id, cb));
    const p = ui && ui[id];
    const name = L.short(L.clean(p && p.name) || "Utilisateur", 40);
    const img = await L.getAvatar(id, p && p.thumbSrc);
    const coins = eco.get(id).coins;
    L.sendCard(api, tid, C.profile({
      img, name, title: "PORTEFEUILLE", label: "SOLDE", big: C.fmt(coins) + " pièces",
      color: "#ffd60a", sub: "Tape .daily pour gagner des pièces",
    }), "💰 " + name + " : " + coins + " pièces");
  },
};
