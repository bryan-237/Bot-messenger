const F = require("../fonts.js");
const U = require("../utils.js");
module.exports = {
  name: "sleep",
  run: (api, event) => {
    const t = U.parseHM(U.args(event)[0]);
    if (t == null) return api.sendMessage(F.panel("💡", "Calculateur de sommeil", [F.b("Utilise") + " : .sleep 6:30", F.bi("= l'heure à laquelle tu veux te réveiller")]), event.threadID);
    const lines = [6, 5, 4, 3].map((c) => "🛏️ " + F.b(U.fmtHM(t - c * 90 - 15)) + "  →  " + c + " cycles (" + c * 1.5 + " h)");
    api.sendMessage(F.panel("😴", "Heure de coucher", ["⏰ " + F.bi("Réveil") + " : " + U.fmtHM(t), ...lines, F.bi("15 min pour s'endormir comprises")]), event.threadID);
  },
};
