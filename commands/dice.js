const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");

function draw(o) {
  const W = 1000, H = 600;
  const { canvas, ctx } = C.base(W, H, "#0f0f1a", "#3b1d8f", null, 55);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 54px sans-serif";
  ctx.fillText(o.solo ? "LANCER DE DÉ" : "DUEL DE DÉS", 500, 80);
  if (o.solo) {
    C.die(ctx, 390, 140, 220, o.a);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 50px sans-serif";
    ctx.fillText("Tu as fait " + o.a, 500, 440);
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "26px sans-serif";
    ctx.fillText("Pour jouer des pièces : .dice 100", 500, 500);
  } else {
    C.die(ctx, 150, 140, 220, o.a);
    C.die(ctx, 630, 140, 220, o.b, "#e9e5ff");
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px sans-serif";
    ctx.fillText("VS", 500, 270);
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "28px sans-serif";
    ctx.fillText(o.name, 260, 405);
    ctx.fillText("BOT", 740, 405);
    ctx.fillStyle = o.color;
    ctx.font = "bold 52px sans-serif";
    ctx.fillText(o.title, 500, 480);
    ctx.fillStyle = "#e9e5ff";
    ctx.font = "26px sans-serif";
    ctx.fillText("Mise : " + C.fmt(o.bet) + "   •   Solde : " + C.fmt(o.coins), 500, 535);
  }
  ctx.fillStyle = "#8b7fc7";
  ctx.font = "20px sans-serif";
  ctx.fillText("BRYAN BOT", 500, 580);
  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "dice",
  run: async (api, event) => {
    const tid = event.threadID;
    const id = String(event.senderID);
    const arg = (event.body || "").trim().split(/\s+/)[1];
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    if (!arg) return L.sendCard(api, tid, draw({ solo: true, a }), "🎲 Tu as fait " + a);
    const coins = eco.get(id).coins;
    const bet = eco.parseBet(arg, coins);
    if (!bet || bet < 10) return api.sendMessage("Mise minimum : 10 pièces. Exemple : .dice 100", tid);
    if (bet > coins) return api.sendMessage("❌ Pas assez de pièces (" + coins + "). Tape .daily pour en gagner.", tid);
    let delta = 0, title = "ÉGALITÉ", color = "#c4b5fd";
    if (a > b) { delta = bet; title = "VICTOIRE  +" + bet; color = "#7CFC9A"; }
    else if (a < b) { delta = -bet; title = "DÉFAITE  -" + bet; color = "#ff6b6b"; }
    const n = eco.update(id, (u) => { u.coins += delta; });
    const ui = await L.ask((cb) => api.getUserInfo(id, cb));
    const name = L.short(L.clean(ui && ui[id] && ui[id].name) || "Joueur", 20);
    L.sendCard(api, tid, draw({ a, b, name, title, color, bet, coins: n.coins }), "🎲 " + a + " vs " + b + " | " + title);
  },
};
