const fs = require("fs");
let s = fs.readFileSync("reactions.js", "utf8");
const a = "function run(api, event) {";
if (s.includes("[evt]")) { console.log("deja fait"); process.exit(0); }
s = s.replace(a, () => a + '\n  console.log("[evt]", event.type, String(event.body || "").slice(0, 30));');
fs.writeFileSync("reactions.js", s);
console.log("ok");
