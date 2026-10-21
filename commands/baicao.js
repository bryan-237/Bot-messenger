const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");

function deal() {
  const d = [];
  for (let r = 1; r <= 13; r++) for (let k = 0; k < 4; k++) d.push([r, k]);
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
function score(cards) {
  const max = Math.max(...cards.map((c) => c[0]));
  if (cards.every((c) => c[0] >= 11)) return { pts: 10, max, label: "BA TIÊN" };
  return { pts: cards.reduce((s, c) => s + (c[0] >= 10 ? 0 : c[0]), 0) % 10, max, label: null };
}

function draw(o) {
  const W = 1000, H = 760;
  const { canvas, ctx } = C.base(W, H, "#140a2d", "#3b1d8f", null, 8);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 46px sans-serif";
  ctx.fillText("BÀI CÀO", 500, 58);
  const row = (cards, y, label, sc) => {
    ctx.textAlign = "center";
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "26px sans-serif";
    ctx.fillText(label + "  •  " + (sc.label || sc.pts + " points"), 500, y);
    cards.forEach((c, i) => C.playingCard(ctx, 245 + i * 180, y + 15, 150, 210, c[0], c[1]));
  };
  row(o.bot, 105, "BOT", o.sb);
  row(o.me, 375, o.name.toUpperCase(), o.sp);
  ctx.textAlign = "center";
  ctx.fillStyle = o.color;
  ctx.font = "bold 50px sans-serif";
  ctx.fillText(o.title, 500, 675);
  ctx.fillStyle = "#e9e5ff";
  ctx.font = "24px sans-serif";
  ctx.fillText("Mise : " + C.fmt(o.bet) + "   •   Solde : " + C.fmt(o.coins), 500, 720);
  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "baicao",
  run: async (api, event) => {
    const tid = event.threadID;
    const id = String(event.senderID);
    const coins = eco.get(id).coins;
    const bet = eco.parseBet((event.body || "").trim().split(/\s+/)[1], coins);
    if (!bet || bet < 10) return api.sendMessage("Mise minimum : 10 pièces. Exemple : .baicao 100", tid);
    if (bet > coins) return api.sendMessage("❌ Pas assez de pièces (" + coins + "). Tape .daily pour en gagner.", tid);
    const d = deal();
    const me = d.slice(0, 3), bot = d.slice(3, 6);
    const sp = score(me), sb = score(bot);
    const cmp = sp.pts !== sb.pts ? sp.pts - sb.pts : sp.max - sb.max;
    let delta = 0, title = "ÉGALITÉ", color = "#c4b5fd";
    if (cmp > 0) { delta = sp.label ? bet * 2 : bet; title = "VICTOIRE  +" + delta; color = "#7CFC9A"; }
    else if (cmp < 0) { delta = -bet; title = "DÉFAITE  -" + bet; color = "#ff6b6b"; }
    const n = eco.update(id, (u) => { u.coins += delta; });
    const ui = await L.ask((cb) => api.getUserInfo(id, cb));
    const name = L.short(L.clean(ui && ui[id] && ui[id].name) || "Joueur", 20);
    L.sendCard(api, tid, draw({ me, bot, sp, sb, name, title, color, bet, coins: n.coins }), "🃏 " + title + " | Solde : " + n.coins);
  },
};
