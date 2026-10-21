const fs = require("fs");
const path = require("path");
const dir = path.join(process.env.HOME, "miraiv2", "modules", "commands");
const skip = ["fs", "fs-extra", "path", "os"];
const rows = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".js")).sort()) {
  const src = fs.readFileSync(path.join(dir, f), "utf8");
  const name = (src.match(/name:\s*["'`]([^"'`]+)["'`]/) || [])[1] || f;
  const desc = ((src.match(/description:\s*["'`]([^"'`]{0,50})/) || [])[1] || "").replace(/\s+/g, " ");
  const deps = [...new Set([...src.matchAll(/require\(["'`]([^"'`./][^"'`]*)["'`]\)/g)].map((m) => m[1]))].filter((d) => !skip.includes(d));
  const hosts = [...new Set([...src.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1]))].slice(0, 2);
  const uses = ["Currencies", "Users", "Threads", "models"].filter((k) => src.includes(k));
  rows.push([name, desc, deps.join(","), hosts.join(","), uses.join(","), src.length].join(" | "));
}
fs.writeFileSync("analyse.txt", rows.join("\n"));
console.log(rows.length + " commandes analysées");
