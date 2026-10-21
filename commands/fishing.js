const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");
const CATCH = [["Vieille botte", 0, 20], ["Algue", 5, 20], ["Sardine", 25, 25], ["Poisson", 70, 18], ["Thon", 160, 10], ["Requin", 400, 4], ["Coffre au trésor", 900, 1]];
const COOLDOWN = 40000;
function pick() {
  let r = Math.random() * CATCH.reduce((s, c) => s + c[2], 0);
  for (const c of CATCH) { r -= c[2]; if (r <= 0) return c; }
  return CATCH[0];
}
module.exports = {
  name: "fishing",
  run: async (api, event) => {
    const id = String(event.senderID);
    const now = Date.now();
    const u = eco.get(id);
    const wait = COOLDOWN - (now - (u.lastFish || 0));
    if (wait > 0) return api.sendMessage("⏳ Les poissons se reposent ! Réessaie dans " + Math.ceil(wait / 1000) + " s.", event.threadID);
    const [name, value] = pick();
    const n = eco.update(id, (x) => { x.coins += value; x.lastFish = now; });
    const color = value >= 400 ? "#ffd60a" : value >= 70 ? "#7CFC9A" : value > 0 ? "#c4b5fd" : "#ff9f6b";
    const { buf } = await C.whoCard(api, id, {
      title: "PÊCHE", label: "TU AS PÊCHÉ", big: name, color,
      sub: "+" + value + " pièces  •  Solde : " + C.fmt(n.coins),
    });
    L.sendCard(api, event.threadID, buf, "🎣 " + name + " (+" + value + ")");
  },
};
