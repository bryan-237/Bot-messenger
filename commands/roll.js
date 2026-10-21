const F = require("../fonts.js");
module.exports = {
  name: "roll",
  run: (api, event) => {
    const m = parseInt((event.body || "").trim().split(/\s+/)[1], 10);
    const max = Number.isFinite(m) && m >= 2 ? Math.min(m, 1000000) : 100;
    const n = 1 + Math.floor(Math.random() * max);
    const pct = Math.round((n / max) * 100);
    const bar = Math.round(pct / 10);
    const lines = [
      "🔢 " + F.b("Résultat") + " : " + F.b(String(n)),
      "📊 " + F.bi("Entre 1 et " + max),
      "█".repeat(bar) + "░".repeat(10 - bar) + " " + pct + " %",
    ];
    if (n === max) lines.push("🔥 " + F.bi("Score maximum !"));
    else if (n === 1) lines.push("💀 " + F.bi("Score minimum..."));
    api.sendMessage(F.panel("🎲", "Tirage aléatoire", lines), event.threadID);
  },
};
