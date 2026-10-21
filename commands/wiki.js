const F = require("../fonts.js");
const U = require("../utils.js");
module.exports = {
  name: "wiki",
  run: async (api, event) => {
    const tid = event.threadID;
    const q = U.args(event).join(" ").trim();
    if (!q) return api.sendMessage(F.panel("💡", "Wikipédia", [F.b("Utilise") + " : .wiki Napoléon"]), tid);
    try {
      const url = "https://fr.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=1&prop=extracts&exintro=1&explaintext=1&exsentences=4&format=json&gsrsearch=" + encodeURIComponent(q);
      const r = await fetch(url, { headers: { "User-Agent": "BryanBot/1.0 (bot Messenger)" }, signal: AbortSignal.timeout(10000) });
      const j = await r.json();
      const pg = j.query && j.query.pages && Object.values(j.query.pages)[0];
      if (!pg || !pg.extract) return api.sendMessage(F.panel("❌", "Wikipédia", ["Aucun résultat pour : " + q]), tid);
      const txt = pg.extract.replace(/\s+/g, " ").trim();
      api.sendMessage(F.panel("📚", "Wikipédia", ["📖 " + F.b(pg.title), "", txt.slice(0, 700) + (txt.length > 700 ? "…" : ""), "", "🔗 https://fr.wikipedia.org/wiki/" + encodeURIComponent(pg.title.replace(/ /g, "_"))]), tid);
    } catch (e) {
      console.error(e.message);
      api.sendMessage(F.panel("❌", "Wikipédia", ["Service indisponible, réessaie plus tard."]), tid);
    }
  },
};
