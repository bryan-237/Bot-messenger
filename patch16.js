const fs = require("fs");
let s = fs.readFileSync("index.js", "utf8");
const a = 'require("./commands/carte.js").handle(api, event); } catch (e) {}';
if (!s.includes(a) || s.includes("duel.js")) { console.log("deja fait ou introuvable"); process.exit(0); }
s = s.replace(a, a + ' try { require("./commands/duel.js").handle(api, event); } catch (e) {}');
fs.writeFileSync("index.js", s);
console.log("ok");
