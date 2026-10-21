const fs = require("fs");
const path = require("path");
const OWNERS_FILE = path.join(__dirname, "..", "admins.json");
const pending = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const owners = () => { try { return JSON.parse(fs.readFileSync(OWNERS_FILE, "utf8")).map(String); } catch { return []; } };
const groups = (api) => new Promise((res) => api.getThreadList(100, null, ["INBOX"], (err, list) => res(err || !list ? [] : list.filter((t) => t.isGroup))));

module.exports = {
  name: "notification",
  run: async (api, event) => {
    const tid = event.threadID;
    const uid = String(event.senderID);
    if (!owners().includes(uid)) return api.sendMessage("⛔ Commande réservée à l'admin du bot.", tid);
    const text = (event.body || "").trim().split(/\s+/).slice(1).join(" ").trim();
    if (text.toLowerCase() === "oui") {
      const p = pending[uid];
      if (!p || Date.now() - p.t > 60000)
        return api.sendMessage("Aucun message en attente. Utilise : .notification ton message", tid);
      delete pending[uid];
      const list = (await groups(api)).slice(0, 50);
      api.sendMessage("📤 Envoi à " + list.length + " groupe(s)...", tid);
      let ok = 0;
      for (const g of list) {
        const done = await new Promise((res) => api.sendMessage("📢 Annonce de l'admin\n\n" + p.text, g.threadID, (e) => res(!e)));
        if (done) ok++;
        await sleep(3000 + Math.random() * 3000);
      }
      return api.sendMessage("✅ Envoyé dans " + ok + "/" + list.length + " groupe(s).", tid);
    }
    if (!text) return api.sendMessage("Utilise : .notification ton message", tid);
    pending[uid] = { text, t: Date.now() };
    const n = (await groups(api)).length;
    api.sendMessage("📢 Aperçu :\n\n" + text + "\n\nEnvoyer à " + n + " groupe(s) ? Tape .notification oui (valable 60 s).", tid);
  },
};
