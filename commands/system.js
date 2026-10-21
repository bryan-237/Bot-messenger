const os = require("os");
const F = require("../fonts.js");
const U = require("../utils.js");
const gb = (b) => (b / 1073741824).toFixed(1) + " Go";
module.exports = {
  name: "system",
  run: (api, event) => {
    const cpu = os.cpus() || [];
    const total = os.totalmem(), free = os.freemem();
    api.sendMessage(F.panel("💻", "Système", [
      "🖥️ " + F.b("OS") + " : " + os.type() + " " + os.arch(),
      "⚙️ " + F.b("Processeur") + " : " + ((cpu[0] && cpu[0].model) || "?").trim() + " (" + cpu.length + " cœurs)",
      "🧠 " + F.b("RAM") + " : " + gb(total - free) + " / " + gb(total),
      "📈 " + F.b("Charge") + " : " + os.loadavg()[0].toFixed(2),
      "🟢 " + F.b("Node") + " : " + process.version,
      "⏱️ " + F.b("Machine active depuis") + " : " + U.dur(os.uptime()),
    ]), event.threadID);
  },
};
