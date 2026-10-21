const { createCanvas } = require("@napi-rs/canvas");
const L = require("../lib.js");

function draw(o) {
  const W = 1000, H = 600, cx = 500, cy = 140, r = 85;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#140a2d");
  bg.addColorStop(1, "#3b1d8f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  if (o.img) { L.cover(ctx, o.img, 0, 0, W, H); ctx.fillStyle = "rgba(15,8,40,0.68)"; ctx.fillRect(0, 0, W, H); }
  L.stars(ctx, W, H, 4242);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (o.img) L.cover(ctx, o.img, cx - r, cy - r, r * 2, r * 2);
  else { ctx.fillStyle = "#4c1d95"; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
  ctx.restore();
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#a78bfa";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  let size = 54;
  ctx.font = "bold " + size + "px sans-serif";
  while (ctx.measureText(o.name).width > 900 && size > 24) { size -= 2; ctx.font = "bold " + size + "px sans-serif"; }
  ctx.fillText(o.name, cx, 290);
  [["MEMBRES", o.members], ["ADMINS", o.admins], ["MESSAGES", o.messages]].forEach((s, i) => {
    const x = 90 + i * 280, y = 330, w = 260, h = 110;
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    L.rrect(ctx, x, y, w, h, 22);
    ctx.fill();
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "20px sans-serif";
    ctx.fillText(s[0], x + w / 2, y + 38);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 46px sans-serif";
    ctx.fillText(String(s[1]), x + w / 2, y + 88);
  });
  ctx.fillStyle = "#e9e5ff";
  ctx.font = "26px sans-serif";
  ctx.fillText("Admins : " + o.adminNames, cx, 495);
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "20px sans-serif";
  ctx.fillText("ID : " + o.id + "  •  BRYAN BOT", cx, 560);
  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "groupe",
  run: async (api, event) => {
    const tid = event.threadID;
    try {
      const info = await L.ask((cb) => api.getThreadInfo(tid, cb));
      if (!info) return api.sendMessage("Impossible de lire les infos du groupe.", tid);
      const ids = (info.adminIDs || []).map((a) => String(a.id || a));
      const ui = ids.length ? await L.ask((cb) => api.getUserInfo(ids.slice(0, 3), cb)) : null;
      const names = ids.slice(0, 3).map((i) => L.clean(ui && ui[i] && ui[i].name) || "?").join(", ");
      const img = info.imageSrc ? await L.loadUrl(info.imageSrc) : null;
      const buf = draw({
        img,
        name: L.short(L.clean(info.threadName) || "Groupe", 60),
        members: info.participantIDs.length,
        admins: ids.length,
        messages: info.messageCount != null ? info.messageCount : "?",
        adminNames: L.short(names || "aucun", 60),
        id: tid,
      });
      L.sendCard(api, tid, buf, "Groupe : " + info.threadName + " • Membres : " + info.participantIDs.length);
    } catch (e) {
      console.error(e);
      api.sendMessage("❌ Impossible de créer la carte du groupe.", tid);
    }
  },
};
