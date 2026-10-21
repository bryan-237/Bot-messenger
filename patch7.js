const fs = require("fs");
let s = fs.readFileSync("index.js", "utf8");
if (s.includes("reactions.js")) { console.log("deja fait"); process.exit(0); }
const a = 'require("./membres.js")(api, event);';
if (!s.includes(a)) { console.log("introuvable"); process.exit(1); }
s = s.replace(a, () => 'require("./reactions.js")(api, event); ' + a);
fs.writeFileSync("index.js", s);
console.log("ok");
