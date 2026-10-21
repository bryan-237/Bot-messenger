const F = require("../fonts.js");
module.exports = {
  name: "setname",
  run: (api, event) => {
    const tid = event.threadID;
    let target = String(event.senderID);
    let text = (event.body || "").trim().split(/\s+/).slice(1).join(" ");
    if (event.messageReply && event.messageReply.senderID) target = String(event.messageReply.senderID);
    else if (event.mentions && Object.keys(event.mentions).length) {
      target = Object.keys(event.mentions)[0];
      for (const n of Object.values(event.mentions)) text = text.split(n).join("");
    }
    text = text.trim();
    if (!text) return api.sendMessage(F.panel("💡", "Pseudo", [F.b("Utilise") + " : .setname Mon pseudo", F.bi("Pour un autre") + " : .setname @personne Pseudo", F.bi("Effacer") + " : .setname reset"]), tid);
    api.changeNickname(text.toLowerCase() === "reset" ? "" : text, tid, target, (e) =>
      api.sendMessage(e ? F.panel("❌", "Pseudo", ["Impossible de changer le pseudo."]) : F.panel("✅", "Pseudo", [text.toLowerCase() === "reset" ? "Pseudo effacé." : "Nouveau pseudo : " + F.b(text)]), tid));
  },
};
