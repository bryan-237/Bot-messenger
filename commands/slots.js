const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");

function draw(o) {
  const W = 1000, H = 620;
  const { canvas, ctx } = C.base(W, H, "#1a0414", "#3b1d8f", null, 31);
  ctx.fillStyle = "#2a0f3d";
  L.rrect(ctx, 150, 50, 700, 470, 36);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#f5c542";
  ctx.stroke();
  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = i % 2 ? "#ffd60a" : "#ff4d6d";
    ctx.beginPath(); ctx.arc(190 + i * 45, 72, 7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 58px sans-serif";
  ctx.fillText("SLOTS", 500, 140);
  [200, 410, 620].forEach((x) => {
    ctx.fillStyle = "#fdf6e3";
    L.rrect(ctx, x, 170, 180, 200, 18);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#f5c542";
    ctx.stroke();
  });
  ctx.strokeStyle = "rgba(230,57,70,0.8)";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(185, 270); ctx.lineTo(815, 270); ctx.stroke();
  [200, 410, 620].forEach((x, i) => C.symbol(ctx, o.reels[i], x + 90, 270, 120));
  ctx.fillStyle = o.color;
  ctx.font = "bold 54px sans-serif";
  ctx.fillText(o.title, 500, 440);
  ctx.fillStyle = "#e9e5ff";
  ctx.font = "26px sans-serif";
  ctx.fillText("Mise : " + C.fmt(o.bet) + "   •   Solde : " + C.fmt(o.coins), 500, 490);
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "22px sans-serif";
  ctx.fillText(o.name + "  •  BRYAN BOT", 500, 585);
  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "slots",
  run: async (api, event) => {
    const tid = event.threadID;
    const id = String(event.senderID);
    const coins = eco.get(id).coins;
    const bet = eco.parseBet((event.body || "").trim().split(/\s+/)[1], coins);
    if (!bet || bet < 10) return api.sendMessage("Mise minimum : 10 pièces. Exemple : .slots 100", tid);
    if (bet > coins) return api.sendMessage("❌ Pas assez de pièces (" + coins + "). Tape .daily pour en gagner.", tid);
    const reels = [0, 1, 2].map(() => Math.floor(Math.random() * 6));
    const uniq = new Set(reels).size;
    let delta = -bet, title = "PERDU  -" + bet, color = "#ff6b6b";
    if (uniq === 1) { delta = bet * 4; title = "JACKPOT  +" + delta; color = "#ffd60a"; }
    else if (uniq === 2) { delta = bet; title = "PAIRE  +" + bet; color = "#7CFC9A"; }
    const n = eco.update(id, (u) => { u.coins += delta; });
    const ui = await L.ask((cb) => api.getUserInfo(id, cb));
    const name = L.short(L.clean(ui && ui[id] && ui[id].name) || "Joueur", 30);
    L.sendCard(api, tid, draw({ reels, title, color, bet, coins: n.coins, name }), "🎰 " + title + " | Solde : " + n.coins);
  },
};
