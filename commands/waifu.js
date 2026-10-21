const axios = require("axios");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const L = require("../lib.js");
const Q = "query($p:Int){Page(page:$p,perPage:25){characters(sort:FAVOURITES_DESC){name{full} gender image{large} media(perPage:1){nodes{title{romaji}}}}}}";
const last = {};
async function go(api, event, genre) {
  const tid = event.threadID, id = String(event.senderID);
  if (Date.now() - (last[id] || 0) < 5000) return;
  last[id] = Date.now();
  try {
    const page = 1 + Math.floor(Math.random() * 40);
    const r = await axios.post("https://graphql.anilist.co", { query: Q, variables: { p: page } }, { timeout: 20000 });
    const list = r.data.data.Page.characters.filter((c) => c.gender === genre && c.image && c.image.large);
    if (!list.length) return api.sendMessage("Réessaie.", tid);
    const c = list[Math.floor(Math.random() * list.length)];
    const src = c.media.nodes[0] && c.media.nodes[0].title.romaji;
    const img = await loadImage(Buffer.from((await axios.get(c.image.large, { responseType: "arraybuffer" })).data));
    const cv = createCanvas(img.width, img.height); cv.getContext("2d").drawImage(img, 0, 0);
    await L.sendCard(api, tid, cv.toBuffer("image/png"), (genre === "Female" ? "💖 Ta waifu : " : "💙 Ton husbando : ") + c.name.full + (src ? "\n📺 " + src : ""));
  } catch (e) { console.error("waifu:", e.message); api.sendMessage("❌ Erreur, réessaie dans 1 minute.", tid); }
}
module.exports = { name: "waifu", run: (api, event) => go(api, event, "Female"), go };
