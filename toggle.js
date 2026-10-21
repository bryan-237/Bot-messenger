const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "membres.json");
module.exports = (key, onMsg, offMsg, adminOnly) => ({
  name: key,
  run: (api, event) => {
    const tid = event.threadID;
    const arg = ((event.body || "").trim().split(/\s+/)[1] || "").toLowerCase();
    if (arg !== "on" && arg !== "off") return api.sendMessage("Utilise : ." + key + " on / off", tid);
    const save = () => {
      let s = {};
      try { s = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
      s[tid] = s[tid] || {};
      s[tid][key] = arg === "on";
      fs.writeFileSync(FILE, JSON.stringify(s, null, 2));
      api.sendMessage(arg === "on" ? onMsg : offMsg, tid);
    };
    if (!adminOnly) return save();
    api.getThreadInfo(tid, (err, info) => {
      const admins = (!err && info.adminIDs ? info.adminIDs : []).map((a) => String(a.id || a));
      if (!admins.includes(String(event.senderID))) return api.sendMessage("⛔ Réservé aux admins du groupe.", tid);
      save();
    });
  },
});
