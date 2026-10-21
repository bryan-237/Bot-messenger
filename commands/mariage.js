const eco = require("../eco.js");
global.mariages = global.mariages || {};
const nom = (api, id) => new Promise((r) => api.getUserInfo(id, (e, i) => r((i && i[id] && i[id].name) || "Quelqu'un")));
module.exports = { name: "mariage", run: async (api, event) => {
  const id = String(event.senderID), tid = event.threadID;
  const p = (event.body || "").trim().split(/\s+/);
  const act = (p[1] || "").toLowerCase();
  const u = eco.get(id);

  if (act === "divorce") {
    if (!u.epoux) return api.sendMessage("Tu n'es pas marié(e).", tid);
    const ex = u.epoux;
    eco.update(id, (x) => { x.epoux = null; });
    eco.update(ex, (x) => { x.epoux = null; });
    return api.sendMessage("💔 Divorce prononcé.", tid);
  }
  if (act === "accepter" || act === "refuser") {
    const key = tid + "_" + id, d = global.mariages[key];
    if (!d || Date.now() - d.t > 120000) { delete global.mariages[key]; return api.sendMessage("Aucune demande en attente.", tid); }
    delete global.mariages[key];
    if (act === "refuser") return api.sendMessage("💔 Demande refusée.", tid);
    if (eco.get(id).epoux || eco.get(d.from).epoux) return api.sendMessage("❌ L'un de vous est déjà marié(e).", tid);
    eco.update(id, (x) => { x.epoux = d.from; });
    eco.update(d.from, (x) => { x.epoux = id; });
    return api.sendMessage("💍 " + (await nom(api, d.from)) + " et " + (await nom(api, id)) + " sont maintenant mariés !", tid);
  }
  const cible = Object.keys(event.mentions || {})[0] || (event.messageReply && event.messageReply.senderID);
  if (!cible) {
    if (u.epoux) return api.sendMessage("💍 Tu es marié(e) avec " + (await nom(api, u.epoux)), tid);
    return api.sendMessage("Utilise : .mariage @user\nL'autre répond .mariage accepter\n.mariage divorce pour se séparer", tid);
  }
  const t = String(cible);
  if (t === id) return api.sendMessage("😅 Tu ne peux pas t'épouser toi-même.", tid);
  if (u.epoux) return api.sendMessage("❌ Tu es déjà marié(e).", tid);
  if (eco.get(t).epoux) return api.sendMessage("❌ Cette personne est déjà mariée.", tid);
  global.mariages[tid + "_" + t] = { from: id, t: Date.now() };
  api.sendMessage("💍 " + (await nom(api, id)) + " demande " + (await nom(api, t)) + " en mariage !\nRéponds : .mariage accepter ou .mariage refuser (2 min)", tid);
}};
