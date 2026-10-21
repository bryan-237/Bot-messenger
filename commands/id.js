const { createCanvas } = require("@napi-rs/canvas");
const L = require("../lib.js");

function draw(o) {
  const W = 1000, H = 560, cx = 230, cy = 280, r = 130;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#140a2d";
  ctx.fillRect(0, 0, W, H);
  if (o.img) {
    const small = createCanvas(32, 32);
    L.cover(small.getContext("2d"), o.img, 0, 0, 32, 32);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(small, 0, 0, W, H);
  }
  ctx.fillStyle = "rgba(15,8,40,0.62)";
  ctx.fillRect(0, 0, W, H);
  L.stars(ctx, W, H, 2024);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  L.rrect(ctx, 400, 100, 560, 360, 26);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (o.img) L.cover(ctx, o.img, cx - r, cy - r, r * 2, r * 2);
  else { ctx.fillStyle = "#4c1d95"; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
  ctx.restore();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#a78bfa";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "22px sans-serif";
  ctx.fillText("CARTE D'IDENTITÉ", 430, 160);
  let size = 48;
  ctx.font = "bold " + size + "px sans-serif";
  while (ctx.measureText(o.name).width > 500 && size > 22) { size -= 2; ctx.font = "bold " + size + "px sans-serif"; }
  ctx.fillStyle = "#ffffff";
  ctx.fillText(o.name, 430, 230);
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "22px sans-serif";
  ctx.fillText("IDENTIFIANT", 430, 310);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px sans-serif";
  ctx.fillText(String(o.id), 430, 375);
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "20px sans-serif";
  ctx.fillText("BRYAN BOT", 430, 430);
  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "id",
  run: async (api, event) => {
    const tid = event.threadID;
    let id = String(event.senderID);
    if (event.messageReply && event.messageReply.senderID) id = String(event.messageReply.senderID);
    else if (event.mentions && Object.keys(event.mentions).length) id = Object.keys(event.mentions)[0];
    try {
      const ui = await L.ask((cb) => api.getUserInfo(id, cb));
      const p = ui && ui[id];
      const name = L.short(L.clean(p && p.name) || "Utilisateur", 40);
      const img = await L.getAvatar(id, p && p.thumbSrc);
      L.sendCard(api, tid, draw({ img, name, id }), "🆔 " + id);
    } catch (e) {
      console.error(e);
      api.sendMessage("🆔 " + id, tid);
    }
  },
};
