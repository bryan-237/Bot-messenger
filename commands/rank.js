const LV = require("../levels.js");
const L = require("../lib.js");
const C = require("../cards.js");
const U = require("../utils.js");

function draw(o) {
  const W = 1000, H = 420;
  const { canvas, ctx } = C.base(W, H, "#140a2d", "#3b1d8f", o.img, 606);
  C.avatar(ctx, o.img, 170, 210, 110);
  ctx.textAlign = "left";
  let size = 46;
  ctx.font = "bold " + size + "px sans-serif";
  while (ctx.measureText(o.name).width > 600 && size > 22) { size -= 2; ctx.font = "bold " + size + "px sans-serif"; }
  ctx.fillStyle = "#ffffff";
  ctx.fillText(o.name, 330, 100);
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "24px sans-serif";
  ctx.fillText("RANG #" + o.pos + " / " + o.total + "   •   " + o.msgs + " messages", 330, 145);
  ctx.fillStyle = "#ffd60a";
  ctx.font = "bold 60px sans-serif";
  ctx.fillText("NIVEAU " + o.lvl, 330, 225);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  L.rrect(ctx, 330, 250, 610, 36, 18);
  ctx.fill();
  if (o.pct > 0) { ctx.fillStyle = "#a78bfa"; L.rrect(ctx, 330, 250, Math.max(36, 610 * o.pct), 36, 18); ctx.fill(); }
  ctx.fillStyle = "#e9e5ff";
  ctx.font = "24px sans-serif";
  ctx.fillText(o.exp + " / " + o.next + " EXP", 330, 330);
  ctx.textAlign = "right";
  ctx.fillText(Math.round(o.pct * 100) + " %", 940, 330);
  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "rank",
  run: async (api, event) => {
    const tid = String(event.threadID);
    const id = U.targetId(event) || String(event.senderID);
    const s = LV.stats(tid, id);
    const lvl = LV.levelOf(s.exp), cur = LV.needFor(lvl), next = LV.needFor(lvl + 1);
    const list = LV.top(tid);
    const idx = list.findIndex((e) => e[0] === id);
    const ui = await L.ask((cb) => api.getUserInfo(id, cb));
    const p = ui && ui[id];
    const name = L.short(L.clean(p && p.name) || "Utilisateur", 40);
    const img = await L.getAvatar(id, p && p.thumbSrc);
    const buf = draw({
      img, name, lvl, exp: s.exp, next, msgs: s.msgs,
      pct: Math.max(0, Math.min(1, (s.exp - cur) / (next - cur))),
      pos: idx >= 0 ? idx + 1 : list.length + 1, total: Math.max(list.length, 1),
    });
    L.sendCard(api, event.threadID, buf, "Niveau " + lvl);
  },
};
