const args = (event) => (event.body || "").trim().split(/\s+/).slice(1);
const targetId = (event) => {
  if (event.messageReply && event.messageReply.senderID) return String(event.messageReply.senderID);
  const m = event.mentions && Object.keys(event.mentions);
  return m && m.length ? m[0] : null;
};
function parseHM(t) {
  const m = /^(\d{1,2})\s*[:hH]\s*(\d{1,2})?$/.exec(String(t || "").trim());
  if (!m) return null;
  const h = +m[1], mi = +(m[2] || 0);
  return h > 23 || mi > 59 ? null : h * 60 + mi;
}
const fmtHM = (min) => { min = ((min % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"); };
const dur = (s) => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return (h ? h + " h " : "") + (h || m ? m + " min " : "") + (s % 60) + " s"; };
function wrap(ctx, text, maxW) {
  const lines = [];
  let cur = "";
  for (const w of text.split(" ")) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
module.exports = { args, targetId, parseHM, fmtHM, dur, wrap };
