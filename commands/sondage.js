global.sondages = global.sondages || {};
const affiche = (s) => {
  const tot = s.opts.reduce((a, o) => a + o.v.length, 0);
  return "📊 " + s.q + "\n\n" + s.opts.map((o, i) => (i + 1) + ". " + o.t + " : " + o.v.length + (tot ? " (" + Math.round(o.v.length * 100 / tot) + "%)" : "")).join("\n") + "\n\nVote : .vote 1";
};
module.exports = {
  name: "sondage",
  run: async (api, event) => {
    const tid = event.threadID;
    const txt = (event.body || "").trim().replace(/^\S+\s*/, "");
    const parts = txt.split("|").map((x) => x.trim()).filter(Boolean);
    if (parts.length < 3 || parts.length > 9) return api.sendMessage("Utilise : .sondage Question | choix 1 | choix 2 (2 à 8 choix)", tid);
    const s = { q: parts[0], opts: parts.slice(1).map((t) => ({ t, v: [] })) };
    global.sondages[tid] = s;
    api.sendMessage(affiche(s), tid);
  },
  affiche,
};
