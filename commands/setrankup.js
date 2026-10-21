const fs = require("fs");
const path = require("path");
const F = require("../fonts.js");
const U = require("../utils.js");
const FILE = path.join(__dirname, "..", "membres.json");
module.exports = {
  name: "setrankup",
  run: (api, event) => {
    const tid = event.threadID;
    const text = U.args(event).join(" ").trim();
    if (!text) return api.sendMessage(F.panel("💡", "Message de niveau", [F.b("Utilise") + " : .setrankup Bravo {name}, niveau {level} !", F.bi("ou") + " : .setrankup reset"]), tid);
    api.getThreadInfo(tid, (err, info) => {
      const admins = (!err && info.adminIDs ? info.adminIDs : []).map((a) => String(a.id || a));
      if (!admins.includes(String(event.senderID))) return api.sendMessage("⛔ Réservé aux admins du groupe.", tid);
      let s = {};
      try { s = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
      s[tid] = s[tid] || {};
      if (text.toLowerCase() === "reset") delete s[tid].rankupText; else s[tid].rankupText = text.slice(0, 80);
      fs.writeFileSync(FILE, JSON.stringify(s, null, 2));
      api.sendMessage(F.panel("✅", "Message de niveau", [text.toLowerCase() === "reset" ? "Message par défaut rétabli." : "Enregistré : " + text.slice(0, 80)]), tid);
    });
  },
};
