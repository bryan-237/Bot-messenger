const F = require("../fonts.js");
module.exports = {
  name: "choose",
  run: (api, event) => {
    const tid = event.threadID;
    const txt = (event.body || "").trim().split(/\s+/).slice(1).join(" ");
    const opts = txt.split(/\s*[|,]\s*|\s+ou\s+/i).map((s) => s.trim()).filter(Boolean);
    if (opts.length < 2)
      return api.sendMessage(F.panel("💡", "Choix du bot", [F.b("Utilise") + " : .choose pizza | burger | tacos", F.bi("Sépare les choix avec |")]), tid);
    const pick = opts[Math.floor(Math.random() * opts.length)];
    api.sendMessage(F.panel("🎯", "Choix du bot", ["✨ " + F.b(pick), "", "📋 " + F.bi("Options") + " : " + opts.join(" • ")]), tid);
  },
};
