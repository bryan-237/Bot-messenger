const F = require("../fonts.js");
const U = require("../utils.js");
const NAMES = ["sqrt", "sin", "cos", "tan", "log", "ln", "abs", "round", "floor", "ceil", "pi"];
module.exports = {
  name: "math",
  run: (api, event) => {
    const tid = event.threadID;
    const raw = U.args(event).join(" ").trim();
    if (!raw) return api.sendMessage(F.panel("💡", "Calculatrice", [F.b("Utilise") + " : .math 12*(3+4)", F.bi("Aussi") + " : sqrt(16), 2^10, pi, log, ln"]), tid);
    const expr = raw.toLowerCase().replace(/,/g, ".").replace(/×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
    let rest = expr;
    for (const n of NAMES) rest = rest.split(n).join("");
    if (!/^[0-9+\-*/%().\s]*$/.test(rest)) return api.sendMessage(F.panel("❌", "Calculatrice", ["Expression non autorisée."]), tid);
    const js = expr.replace(/\b(sqrt|sin|cos|tan|abs|round|floor|ceil)\b/g, "Math.$1").replace(/\blog\b/g, "Math.log10").replace(/\bln\b/g, "Math.log").replace(/\bpi\b/g, "Math.PI");
    let r;
    try { r = Function('"use strict"; return (' + js + ")")(); } catch { r = NaN; }
    if (typeof r !== "number" || !Number.isFinite(r)) return api.sendMessage(F.panel("❌", "Calculatrice", ["Calcul impossible : " + raw]), tid);
    api.sendMessage(F.panel("🧮", "Calculatrice", ["📝 " + raw, "✅ " + F.b("Résultat") + " : " + F.b(String(Math.round(r * 1e10) / 1e10))]), tid);
  },
};
