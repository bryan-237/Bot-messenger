const eco = require("../eco.js");
const ITEMS = {
  ninja:    { nom: "🥷 Titre Ninja",    prix: 500 },
  samourai: { nom: "⚔️ Titre Samouraï", prix: 1500 },
  shogun:   { nom: "👑 Titre Shogun",   prix: 4000 },
  hokage:   { nom: "🔥 Titre Hokage",   prix: 10000 },
};
module.exports = { name: "shop", run: async (api, event) => {
  const id = String(event.senderID), tid = event.threadID;
  const u = eco.get(id), mes = u.items || [];
  let txt = "🛒 BOUTIQUE\n";
  for (const [k, v] of Object.entries(ITEMS)) txt += "\n" + v.nom + " : " + v.prix + " 💰 → .acheter " + k + (mes.includes(k) ? " ✅" : "");
  txt += "\n\n💰 Solde : " + u.coins + "\nÉquiper un titre : .acheter equiper ninja";
  api.sendMessage(txt, tid);
}};
