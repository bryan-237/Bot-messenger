const F = require("../fonts.js");
module.exports = {
  name: "unsend",
  run: (api, event) => {
    const r = event.messageReply;
    if (!r || String(r.senderID) !== String(api.getCurrentUserID()))
      return api.sendMessage(F.panel("💡", "Retirer un message", [F.b("Utilise") + " : réponds à un message du bot avec .unsend"]), event.threadID);
    api.unsendMessage(r.messageID, (e) => { if (e) api.sendMessage(F.panel("❌", "Retirer un message", ["Impossible de le retirer."]), event.threadID); });
  },
};
