const fs = require("fs");
const path = require("path");

async function findTrack(q) {
  try {
    const r = await fetch("https://api.deezer.com/search?limit=1&q=" + encodeURIComponent(q));
    const j = await r.json();
    const t = j.data && j.data[0];
    if (t && t.preview)
      return { title: t.title, artist: t.artist && t.artist.name, preview: t.preview, link: t.link };
  } catch {}
  try {
    const r = await fetch("https://itunes.apple.com/search?media=music&entity=song&limit=1&term=" + encodeURIComponent(q));
    const j = await r.json();
    const t = j.results && j.results[0];
    if (t && t.previewUrl)
      return { title: t.trackName, artist: t.artistName, preview: t.previewUrl, link: t.trackViewUrl };
  } catch {}
  return null;
}

module.exports = {
  name: "song",
  run: async (api, event) => {
    const tid = event.threadID;
    const q = (event.body || "").trim().split(/\s+/).slice(1).join(" ").trim();
    if (!q) return api.sendMessage("Utilise : .song titre ou artiste", tid);
    const t = await findTrack(q);
    if (!t) return api.sendMessage("❌ Aucun extrait trouvé pour : " + q, tid);
    const ext = t.preview.includes(".m4a") ? ".m4a" : ".mp3";
    const file = path.join(__dirname, "..", "tmp_song_" + Date.now() + ext);
    try {
      const r = await fetch(t.preview);
      if (!r.ok) throw new Error("HTTP " + r.status);
      fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      api.sendMessage(
        { body: "🎵 " + t.title + " – " + t.artist + "\n⏱️ Extrait de 30 s\n🔗 " + t.link, attachment: fs.createReadStream(file) },
        tid,
        () => fs.unlink(file, () => {})
      );
    } catch (e) {
      console.error(e);
      fs.unlink(file, () => {});
      api.sendMessage("❌ Impossible de récupérer l'extrait.", tid);
    }
  },
};
