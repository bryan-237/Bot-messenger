const axios = require("axios");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const L = require("../lib.js");
module.exports = { name: "sticker", run: async (api, event) => {
  const tid = event.threadID;
  const atts = [].concat((event.messageReply && event.messageReply.attachments) || [], event.attachments || []);
  const a = atts.find((x) => x.type === "photo");
  const url = a && (a.url || a.largePreviewUrl);
  if (!url) return api.sendMessage("Réponds à une photo avec .sticker", tid);
  try {
    const img = await loadImage(Buffer.from((await axios.get(url, { responseType: "arraybuffer" })).data));
    const S = 512, c = createCanvas(S, S), x = c.getContext("2d");
    x.beginPath();
    x.moveTo(60, 0); x.arcTo(S, 0, S, S, 60); x.arcTo(S, S, 0, S, 60); x.arcTo(0, S, 0, 0, 60); x.arcTo(0, 0, S, 0, 60);
    x.closePath(); x.clip();
    L.cover(x, img, 0, 0, S, S);
    await L.sendCard(api, tid, c.toBuffer("image/png"), "✨ Sticker");
  } catch (e) {
    console.error("sticker:", e.message);
    api.sendMessage("❌ Impossible de créer le sticker.", tid);
  }
}};
