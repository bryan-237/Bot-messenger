const F = require("../fonts.js");
module.exports = {
  name: "getlink",
  run: (api, event) => {
    const att = event.messageReply && event.messageReply.attachments;
    if (!att || !att.length) return api.sendMessage(F.panel("💡", "Lien direct", [F.b("Utilise") + " : réponds à une image, vidéo ou audio avec .getlink"]), event.threadID);
    const lines = att.map((a, i) => (i + 1) + ". " + F.bi(a.type || "fichier") + " : " + (a.url || a.previewUrl || "indisponible"));
    api.sendMessage(F.panel("🔗", "Lien direct", lines), event.threadID);
  },
};
