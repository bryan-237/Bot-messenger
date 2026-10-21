const F = require("../fonts.js");
const U = require("../utils.js");
module.exports = {
  name: "kick",
  run: (api, event) => {
    const tid = event.threadID;
    const target = U.targetId(event);
    if (!target) return api.sendMessage(F.panel("💡", "Retirer un membre", [F.b("Utilise") + " : .kick @personne", F.bi("ou en répondant à son message")]), tid);
    api.getThreadInfo(tid, (err, info) => {
      const admins = (!err && info.adminIDs ? info.adminIDs : []).map((a) => String(a.id || a));
      if (!admins.includes(String(event.senderID))) return api.sendMessage("⛔ Réservé aux admins du groupe.", tid);
      if (target === String(api.getCurrentUserID())) return api.sendMessage(F.panel("😅", "Kick", ["Je ne vais pas me retirer moi-même !"]), tid);
      if (admins.includes(target)) return api.sendMessage(F.panel("❌", "Kick", ["Je ne peux pas retirer un admin."]), tid);
      api.removeUserFromGroup(target, tid, (e) => api.sendMessage(
        e ? F.panel("❌", "Kick", ["Impossible : je dois être admin du groupe.", F.bi("Si antiout est activé, il rajoute la personne : .antiout off")])
          : F.panel("🚪", "Membre retiré", ["C'est fait."]), tid));
    });
  },
};
