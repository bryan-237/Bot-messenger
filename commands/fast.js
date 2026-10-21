const G = require("../games.js");
const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");
const F = require("../fonts.js");
const U = require("../utils.js");
const SENT = [
  "le renard brun saute par dessus le chien paresseux",
  "chaque jour est une nouvelle chance",
  "qui ne tente rien na rien",
  "bryan bot est le meilleur bot du groupe",
  "petit a petit loiseau fait son nid",
  "la vie est belle quand on rit",
  "un bon ami vaut mieux que mille amis",
  "tout vient a point a qui sait attendre",
];
function drawText(text) {
  const W = 1000, H = 420;
  const { canvas, ctx } = C.base(W, H, "#140a2d", "#3b1d8f", null, 33);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 46px sans-serif";
  ctx.fillText("TAPE LA PHRASE !", 500, 75);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px sans-serif";
  U.wrap(ctx, text, 860).forEach((l, i) => ctx.fillText(l, 500, 170 + i * 56));
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "24px sans-serif";
  ctx.fillText("Le plus rapide gagne des pièces  •  40 secondes", 500, 380);
  return canvas.toBuffer("image/png");
}
module.exports = {
  name: "fast",
  run: (api, event) => {
    const tid = String(event.threadID);
    const text = SENT[Math.floor(Math.random() * SENT.length)];
    const start = Date.now();
    const w = G.add({
      tid, ttl: 40000,
      on: (api2, ev) => {
        if ((ev.body || "").trim().toLowerCase().replace(/\s+/g, " ") !== text) return false;
        G.remove(w);
        const uid = String(ev.senderID);
        const secs = ((Date.now() - start) / 1000).toFixed(2);
        const gain = Math.max(30, Math.round(150 - secs * 5));
        eco.update(uid, (u) => { u.coins += gain; });
        C.whoCard(api2, uid, { title: "LE PLUS RAPIDE", label: "TEMPS", big: secs + " s", color: "#7CFC9A", sub: "+" + gain + " pièces" })
          .then(({ buf }) => L.sendCard(api2, tid, buf, "🏆 " + secs + " s (+" + gain + ")"));
        return true;
      },
    });
    setTimeout(() => { if (G.remove(w)) api.sendMessage(F.panel("⌛", "Temps écoulé", ["Personne n'a trouvé.", F.bi("La phrase était") + " : " + text]), tid); }, 40000);
    L.sendCard(api, event.threadID, drawText(text), "Tape : " + text);
  },
};
