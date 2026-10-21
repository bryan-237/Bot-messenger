const LV = require("../levels.js");
const L = require("../lib.js");
const F = require("../fonts.js");
module.exports = {
  name: "checktt",
  run: async (api, event) => {
    const tid = String(event.threadID), me = String(event.senderID);
    const list = LV.top(tid, "msgs");
    if (!list.length) return api.sendMessage(F.panel("📊", "Classement des messages", ["Le comptage démarre maintenant !"]), event.threadID);
    const ids = list.slice(0, 10).map((e) => e[0]);
    const ui = await L.ask((cb) => api.getUserInfo(ids, cb));
    const medals = ["🥇", "🥈", "🥉"];
    const lines = ids.map((id, i) => (medals[i] || (i + 1) + ".") + " " + F.b(L.short(L.clean(ui && ui[id] && ui[id].name) || "Membre", 22)) + " — " + list[i][1].msgs + " msg (niv. " + LV.levelOf(list[i][1].exp) + ")");
    const pos = list.findIndex((e) => e[0] === me) + 1;
    if (pos > 10) lines.push("", "📍 " + F.bi("Ton rang") + " : #" + pos);
    api.sendMessage(F.panel("📊", "Classement des messages", lines), event.threadID);
  },
};
