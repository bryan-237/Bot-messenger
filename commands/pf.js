const eco = require("../eco.js");
const F = require("../fonts.js");
const L = require("../lib.js");
const C = require("../cards.js");

function draw(o) {
  const W = 1000, H = 620;
  const { canvas, ctx } = C.base(W, H, "#0f0f1a", "#3b1d8f", null, 77);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 54px sans-serif";
  ctx.fillText("PILE OU FACE", 500, 80);
  C.coin(ctx, 500, 280, 140, o.flip);
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "28px sans-serif";
  ctx.fillText(o.name + " a choisi " + o.side.toUpperCase(), 500, 460);
  ctx.fillStyle = o.color;
  ctx.font = "bold 52px sans-serif";
  ctx.fillText(o.title, 500, 520);
  ctx.fillStyle = "#e9e5ff";
  ctx.font = "26px sans-serif";
  ctx.fillText("Mise : " + C.fmt(o.bet) + "   •   Solde : " + C.fmt(o.coins), 500, 565);
  ctx.fillStyle = "#8b7fc7";
  ctx.font = "20px sans-serif";
  ctx.fillText("BRYAN BOT", 500, 600);
  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "pf",
  run: async (api, event) => {
    const tid = event.threadID;
    const id = String(event.senderID);
    const t = (event.body || "").trim().split(/\s+/);
    const side = (t[1] || "").toLowerCase();
    if (side !== "pile" && side !== "face") return api.sendMessage(F.panel("💡", "Pile ou face", [F.b("Utilise") + " : .pf pile 100", F.bi("ou") + " : .pf face 100"]), tid);
    const coins = eco.get(id).coins;
    const bet = eco.parseBet(t[2], coins);
    if (!bet || bet < 10) return api.sendMessage(F.panel("💡", "Pile ou face", [F.b("Mise minimum") + " : 10 pièces", F.bi("Exemple") + " : .pf pile 100"]), tid);
    if (bet > coins) return api.sendMessage(F.panel("❌", "Pas assez de pièces", [F.b("Solde") + " : " + coins + " pièces", F.bi("Tape .daily pour en gagner")]), tid);
    const flip = Math.random() < 0.5 ? "pile" : "face";
    const win = flip === side;
    const n = eco.update(id, (u) => { u.coins += win ? bet : -bet; });
    const ui = await L.ask((cb) => api.getUserInfo(id, cb));
    const name = L.short(L.clean(ui && ui[id] && ui[id].name) || "Joueur", 25);
    L.sendCard(api, tid, draw({
      flip, side, name, bet, coins: n.coins,
      title: win ? "GAGNÉ  +" + bet : "PERDU  -" + bet,
      color: win ? "#7CFC9A" : "#ff6b6b",
    }), "🪙 " + flip.toUpperCase() + " | " + (win ? "Gagné" : "Perdu"));
  },
};
