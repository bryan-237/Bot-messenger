const fs = require("fs");
let s = fs.readFileSync("index.js", "utf8");
const target = 'if (name === "id")';
if (!s.includes(target)) { console.log("deja fait ou introuvable"); process.exit(0); }
s = s.replace(target, () => 'if (name === "id_old")');
fs.writeFileSync("index.js", s);
console.log("ok");
