const eco = require("../eco.js");
const ITEMS = { ninja: 500, samourai: 1500, shogun: 4000, hokage: 10000 };
module.exports = { name: "acheter", run: async (api, event) => {
  const id = String(event.senderID), tid = event.threadID;
  const p = (event.body || "").trim().toLowerCase().split(/\s+/);
  const equip = p[1] === "equiper";
  const k = equip ? p[2] : p[1];
  if (!k || !ITEMS[k]) return api.sendMessage("Objet inconnu. Tape .shop", tid);
  const u = eco.get(id);
  if (equip) {
    if (!(u.items || []).includes(k)) return api.sendMessage("❌ Tu ne possèdes pas ce titre.", tid);
    eco.update(id, (x) => { x.titre = k; });
    return api.sendMessage("✅ Titre équipé : " + k, tid);
  }
  if ((u.items || []).includes(k)) return api.sendMessage("Tu l'as déjà.", tid);
  if (u.coins < ITEMS[k]) return api.sendMessage("❌ Il te manque " + (ITEMS[k] - u.coins) + " pièces.", tid);
  const n = eco.update(id, (x) => { x.coins -= ITEMS[k]; x.items = (x.items || []).concat(k); x.titre = k; });
  api.sendMessage("🎉 Acheté : " + k + " (équipé)\n💰 Solde : " + n.coins, tid);
}};
