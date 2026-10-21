const fs = require("fs");
const now = new Date().toISOString();
const src = fs.readFileSync("cookies.txt", "utf8").trim();
let list;
if (src.startsWith("[")) {
  list = JSON.parse(src);
} else {
  list = src.split(";").map((p) => p.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf("=");
    return { key: p.slice(0, i), value: p.slice(i + 1) };
  });
}
const out = list.map((c) => ({
  key: c.key || c.name,
  value: c.value,
  domain: c.domain || "facebook.com",
  path: c.path || "/",
  hostOnly: false,
  creation: now,
  lastAccessed: now,
}));
if (!out.length || !out.every((c) => c.key && c.value)) { console.log("format non reconnu"); process.exit(1); }
const names = out.map((c) => c.key);
console.log("cookies lus :", out.length, "| c_user :", names.includes("c_user") ? "oui" : "NON", "| xs :", names.includes("xs") ? "oui" : "NON");
fs.writeFileSync("appstate.json", JSON.stringify(out, null, 2));
console.log("appstate.json créé");
