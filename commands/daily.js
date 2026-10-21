const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");
module.exports = {
  name: "daily",
  run: async (api, event) => {
    const tid = event.threadID;
    const id = String(event.senderID);
    const now = Date.now();
    const ui = await L.ask((cb) => api.getUserInfo(id, cb));
    const p = ui && ui[id];
    const name = L.short(L.clean(p && p.name) || "Utilisateur", 40);
    const img = await L.getAvatar(id, p && p.thumbSrc);
    const u = eco.get(id);
    const wait = 24 * 3600000 - (now - u.last);
    if (u.last && wait > 0) {
      const h = Math.floor(wait / 3600000), m = Math.ceil((wait % 3600000) / 60000);
      return L.sendCard(api, tid, C.profile({
        img, name, title: "DÉJÀ RÉCUPÉRÉ", label: "PROCHAIN DAILY DANS", big: h + " h " + m + " min",
        color: "#ff9f6b", sub: "Solde : " + C.fmt(u.coins) + " pièces",
      }), "⏳ Reviens dans " + h + " h " + m + " min.");
    }
    const gain = 200 + Math.floor(Math.random() * 301);
    const n = eco.update(id, (x) => { x.coins += gain; x.last = now; });
    L.sendCard(api, tid, C.profile({
      img, name, title: "RÉCOMPENSE QUOTIDIENNE", label: "GAIN DU JOUR", big: "+" + gain + " pièces",
      color: "#7CFC9A", sub: "Nouveau solde : " + C.fmt(n.coins) + " pièces",
    }), "🎁 +" + gain + " pièces");
  },
};
