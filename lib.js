const fs = require("fs");
const path = require("path");
const { loadImage } = require("@napi-rs/canvas");
const UA = "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

async function loadUrl(u) {
  try {
    const r = await fetch(u, { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    return await loadImage(Buffer.from(await r.arrayBuffer()));
  } catch { return null; }
}
async function getAvatar(id, thumb) {
  const a = await loadUrl("https://graph.facebook.com/" + id + "/picture?width=512&height=512&access_token=" + TOKEN);
  return a || (thumb ? await loadUrl(thumb) : null);
}
const ask = (fn) => new Promise((res) => fn((e, r) => res(e ? null : r)));
const clean = (s) => String(s || "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").trim();
const short = (s, n) => { s = String(s || "Membre"); n = n || 26; return s.length > n ? s.slice(0, n - 1) + "…" : s; };

function cover(ctx, img, x, y, w, h) {
  const ar = img.width / img.height, fr = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (ar > fr) { sw = img.height * fr; sx = (img.width - sw) / 2; } else { sh = img.width / fr; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}
function stars(ctx, W, H, seed) {
  let x = seed;
  const rnd = () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
  for (let i = 0; i < 80; i++) {
    ctx.globalAlpha = 0.2 + rnd() * 0.6;
    ctx.fillStyle = rnd() > 0.8 ? "#fbbf24" : "#ddd6fe";
    ctx.beginPath();
    ctx.arc(rnd() * W, rnd() * H, 1 + rnd() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function sendCard(api, tid, buf, fallback) {
  const file = path.join(__dirname, "tmp_card_" + Date.now() + ".png");
  try {
    fs.writeFileSync(file, buf);
    api.sendMessage({ attachment: fs.createReadStream(file) }, tid, () => fs.unlink(file, () => {}));
  } catch (e) { console.error(e); api.sendMessage(fallback, tid); }
}
module.exports = { loadUrl, getAvatar, ask, clean, short, cover, stars, rrect, sendCard };
