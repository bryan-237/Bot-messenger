const F = require("../fonts.js");
const U = require("../utils.js");
module.exports = {
  name: "uptime",
  run: (api, event) => {
    const mem = process.memoryUsage().rss / 1048576;
    api.sendMessage(F.panel("⏱️", "Uptime", [
      "🤖 " + F.b("Actif depuis") + " : " + U.dur(process.uptime()),
      "🧠 " + F.bi("Mémoire du bot") + " : " + mem.toFixed(0) + " Mo",
      "🕒 " + F.bi("Heure") + " : " + new Date().toLocaleTimeString("fr-FR"),
    ]), event.threadID);
  },
};
