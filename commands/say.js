const fs = require("fs");
const path = require("path");
const F = require("../fonts.js");
const U = require("../utils.js");
const LANGS = ["fr", "en", "es", "de", "it", "pt", "ar", "ja", "ko", "ru", "tr", "zh"];
module.exports = {
  name: "say",
  run: async (api, event) => {
    const tid = event.threadID;
    const t = U.args(event);
    let lang = "fr";
    if (t.length > 1 && LANGS.includes(t[0].toLowerCase())) lang = t.shift().toLowerCase();
    const text = t.join(" ").trim().slice(0, 200);
    if (!text) return api.sendMessage(F.panel("💡", "Synthèse vocale", [F.b("Utilise") + " : .say bonjour tout le monde", F.bi("Langue") + " : .say en hello (fr, en, es, de, it...)"]), tid);
    try {
      const r = await fetch("https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=" + lang + "&q=" + encodeURIComponent(text), { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) });
      const buf = Buffer.from(await r.arrayBuffer());
      if (!r.ok || buf.length < 500) throw new Error("HTTP " + r.status);
      const f = path.join(__dirname, "..", "tmp_say_" + Date.now() + ".mp3");
      fs.writeFileSync(f, buf);
      api.sendMessage({ attachment: fs.createReadStream(f) }, tid, () => fs.unlink(f, () => {}));
    } catch (e) {
      console.error(e.message);
      api.sendMessage(F.panel("❌", "Synthèse vocale", ["Service indisponible, réessaie plus tard."]), tid);
    }
  },
};
