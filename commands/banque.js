const eco = require("../eco.js");
module.exports = { name: "banque", run: async (api, event) => {
  const id = String(event.senderID), tid = event.threadID;
  const [, act, val] = (event.body || "").trim().split(/\s+/);
  const u = eco.get(id);
  const bank = u.bank || 0;
  if (!act) return api.sendMessage("🏦 Banque : " + bank + "\n💰 Portefeuille : " + u.coins + "\n\n.banque depot 100\n.banque retrait 100 (ou « tout »)", tid);
  const a = act.toLowerCase();
  if (!["depot", "retrait"].includes(a)) return api.sendMessage("Utilise : depot ou retrait", tid);
  const source = a === "depot" ? u.coins : bank;
  const m = /^(tout|all)$/i.test(val || "") ? source : parseInt(val);
  if (!m || m < 1) return api.sendMessage("Montant invalide.", tid);
  if (m > source) return api.sendMessage("❌ Pas assez de pièces.", tid);
  const n = eco.update(id, (x) => {
    x.bank = x.bank || 0;
    if (a === "depot") { x.coins -= m; x.bank += m; } else { x.bank -= m; x.coins += m; }
  });
  api.sendMessage("🏦 " + (a === "depot" ? "Déposé" : "Retiré") + " : " + m + "\nBanque : " + n.bank + " | Portefeuille : " + n.coins, tid);
}};
