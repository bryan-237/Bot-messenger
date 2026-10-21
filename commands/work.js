const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");
const JOBS = [["Livreur", 80, 200], ["Cuisinier", 100, 250], ["Programmeur", 150, 350], ["Pêcheur", 60, 180], ["Mécanicien", 100, 260], ["Streamer", 50, 400], ["Jardinier", 70, 190], ["Chauffeur de taxi", 90, 230]];
const COOLDOWN = 30 * 60000;
module.exports = {
  name: "work",
  run: async (api, event) => {
    const id = String(event.senderID);
    const now = Date.now();
    const u = eco.get(id);
    const wait = COOLDOWN - (now - (u.lastWork || 0));
    if (wait > 0) return api.sendMessage("⏳ Tu es fatigué ! Reviens dans " + Math.ceil(wait / 60000) + " min.", event.threadID);
    const [job, min, max] = JOBS[Math.floor(Math.random() * JOBS.length)];
    const gain = min + Math.floor(Math.random() * (max - min + 1));
    const n = eco.update(id, (x) => { x.coins += gain; x.lastWork = now; });
    const { buf } = await C.whoCard(api, id, {
      title: "TRAVAIL", label: "MÉTIER DU JOUR : " + job.toUpperCase(), big: "+" + gain + " pièces",
      color: "#7CFC9A", sub: "Solde : " + C.fmt(n.coins) + " pièces",
    });
    L.sendCard(api, event.threadID, buf, "💼 " + job + " : +" + gain + " pièces");
  },
};
