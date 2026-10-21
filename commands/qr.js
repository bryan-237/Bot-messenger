const fs = require("fs");
const path = require("path");
const F = require("../fonts.js");
const U = require("../utils.js");
module.exports = {
  name: "qr",
  run: async (api, event) => {
    const tid = event.threadID;
    const text = (U.args(event).join(" ").trim() || (event.messageReply && event.messageReply.body) || "").slice(0, 300);
    if (!text) return api.sendMessage(F.panel("💡", "QR code", [F.b("Utilise") + " : .qr https://exemple.com", F.bi("ou en répondant à un message")]), tid);
    try {
      const r = await fetch("https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=" + encodeURIComponent(text), { signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const f = path.join(__dirname, "..", "tmp_qr_" + Date.now() + ".png");
      fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
      api.sendMessage({ body: F.panel("📱", "QR code", ["🔗 " + text.slice(0, 80)]), attachment: fs.createReadStream(f) }, tid, () => fs.unlink(f, () => {}));
    } catch (e) {
      console.error(e.message);
      api.sendMessage(F.panel("❌", "QR code", ["Service indisponible, réessaie plus tard."]), tid);
    }
  },
};
