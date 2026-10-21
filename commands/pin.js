const fs = require("fs");
const path = require("path");
const UA = "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";

async function search(q) {
  const data = { options: { query: q, scope: "pins", page_size: 100 }, context: {} };
  const url = "https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=" +
    encodeURIComponent("/search/pins/?q=" + q) + "&data=" + encodeURIComponent(JSON.stringify(data));
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "X-Pinterest-PWS-Handler": "www/search/[scope].js" } });
  if (!r.ok) throw new Error("Pinterest HTTP " + r.status);
  const j = await r.json();
  const results = (j.resource_response && j.resource_response.data && j.resource_response.data.results) || [];
  return results
    .map((p) => p.images && (p.images.orig || p.images["736x"] || p.images["564x"]))
    .filter(Boolean)
    .map((i) => i.url);
}

module.exports = {
  name: "pin",
  run: async (api, event) => {
    const tid = event.threadID;
    const tokens = (event.body || "").trim().split(/\s+/).slice(1);
    let n = 5;
    const last = tokens[tokens.length - 1] || "";
    if (/^-\d+$/.test(last)) { n = parseInt(last.slice(1), 10); tokens.pop(); }
    n = Math.max(1, Math.min(n, 10));
    if (/^(photo|photos|image|images)$/i.test(tokens[0] || "") && tokens.length > 1) tokens.shift();
    const q = tokens.join(" ").trim();
    if (!q) return api.sendMessage("Utilise : .pin photo naruto -6", tid);
    let files = [];
    try {
      const urls = (await search(q)).sort(() => Math.random() - 0.5).slice(0, n + 2);
      const got = await Promise.all(urls.map(async (u, i) => {
        try {
          const r = await fetch(u, { headers: { "User-Agent": UA } });
          if (!r.ok) return null;
          const f = path.join(__dirname, "..", "tmp_pin_" + Date.now() + "_" + i + ".jpg");
          fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
          return f;
        } catch { return null; }
      }));
      const ok = got.filter(Boolean);
      ok.slice(n).forEach((f) => fs.unlink(f, () => {}));
      files = ok.slice(0, n);
    } catch (e) { console.error(e); }
    if (!files.length) return api.sendMessage("❌ Aucune image trouvée pour : " + q, tid);
    api.sendMessage(
      { body: "📌 " + q + " • " + files.length + " image(s)", attachment: files.map((f) => fs.createReadStream(f)) },
      tid,
      () => files.forEach((f) => fs.unlink(f, () => {}))
    );
  },
};
