const sond = require("./sondage.js");
module.exports = { name: "vote", run: async (api, event) => {
  const tid = event.threadID, id = String(event.senderID);
  const s = (global.sondages || {})[tid];
  if (!s) return api.sendMessage("Aucun sondage en cours. Crée-en un : .sondage Question | a | b", tid);
  const n = parseInt((event.body || "").trim().split(/\s+/)[1]);
  if (!n || n < 1 || n > s.opts.length) return api.sendMessage("Choisis un numéro entre 1 et " + s.opts.length, tid);
  s.opts.forEach((o) => { o.v = o.v.filter((x) => x !== id); });
  s.opts[n - 1].v.push(id);
  api.sendMessage("✅ Vote enregistré !\n\n" + sond.affiche(s), tid);
}};
