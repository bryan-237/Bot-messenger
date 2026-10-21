const axios = require("axios");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const L = require("../lib.js");
const Q = "query($s:String,$t:MediaType){Media(search:$s,type:$t){title{romaji english} averageScore episodes chapters status genres description(asHtml:false) coverImage{large} siteUrl}}";
const ST = { FINISHED: "Terminé", RELEASING: "En cours", NOT_YET_RELEASED: "À venir", CANCELLED: "Annulé", HIATUS: "En pause" };
const last = {};
module.exports = { name: "anime", run: async (api, event) => {
  const tid = event.threadID, id = String(event.senderID);
  if (Date.now() - (last[id] || 0) < 4000) return;
  last[id] = Date.now();
  let p = (event.body || "").trim().split(/\s+/).slice(1);
  let type = "ANIME";
  if ((p[0] || "").toLowerCase() === "manga") { type = "MANGA"; p = p.slice(1); }
  const q = p.join(" ");
  if (!q) return api.sendMessage("Utilise : .anime Naruto\nou : .anime manga One Piece", tid);
  try {
    const r = await axios.post("https://graphql.anilist.co", { query: Q, variables: { s: q, t: type } }, { timeout: 20000 });
    const m = r.data.data.Media;
    const desc = (m.description || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const txt = "🎌 " + (m.title.english || m.title.romaji) + "\n" +
      "⭐ Note : " + (m.averageScore ? m.averageScore + "/100" : "?") + "\n" +
      (type === "ANIME" ? "📺 Épisodes : " + (m.episodes || "?") : "📖 Chapitres : " + (m.chapters || "?")) + "\n" +
      "📌 Statut : " + (ST[m.status] || m.status) + "\n" +
      "🏷️ " + (m.genres || []).slice(0, 4).join(", ") + "\n\n" +
      desc.slice(0, 350) + (desc.length > 350 ? "..." : "") + "\n\n(synopsis en anglais)";
    const img = await loadImage(Buffer.from((await axios.get(m.coverImage.large, { responseType: "arraybuffer" })).data));
    const c = createCanvas(img.width, img.height); c.getContext("2d").drawImage(img, 0, 0);
    await L.sendCard(api, tid, c.toBuffer("image/png"), txt);
  } catch (e) {
    console.error("anime:", e.message);
    api.sendMessage("❌ Introuvable (ou trop de requêtes, réessaie dans 1 minute).", tid);
  }
}};
