const F = require("../fonts.js");
const U = require("../utils.js");
module.exports = {
  name: "wake",
  run: (api, event) => {
    const a = U.args(event)[0];
    const d = new Date();
    const t = a ? U.parseHM(a) : d.getHours() * 60 + d.getMinutes();
    if (t == null) return api.sendMessage(F.panel("💡", "Calculateur de réveil", [F.b("Utilise") + " : .wake 23:30", F.bi("ou .wake seul = si tu dors maintenant")]), event.threadID);
    const lines = [3, 4, 5, 6].map((c) => "⏰ " + F.b(U.fmtHM(t + 15 + c * 90)) + "  →  " + c + " cycles (" + c * 1.5 + " h)");
    api.sendMessage(F.panel("🌅", "Heure de réveil", ["🛏️ " + F.bi("Coucher") + " : " + U.fmtHM(t), ...lines, F.bi("15 min pour s'endormir comprises")]), event.threadID);
  },
};
