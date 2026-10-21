const SETS = { b: [0x1D400, 0x1D41A, 0x1D7CE], bi: [0x1D468, 0x1D482, 0x1D7CE] };
function conv(text, kind) {
  const [up, lo, di] = SETS[kind];
  return [...String(text).normalize("NFD")].map((ch) => {
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90) return String.fromCodePoint(up + c - 65);
    if (c >= 97 && c <= 122) return String.fromCodePoint(lo + c - 97);
    if (c >= 48 && c <= 57) return String.fromCodePoint(di + c - 48);
    return ch;
  }).join("");
}
const b = (t) => conv(t, "b");
const bi = (t) => conv(t, "bi");
const LINE = "━━━━━━━━━━━━━━━";
function panel(icon, title, lines) {
  return icon + " " + bi(String(title).toUpperCase()) + "\n" + LINE + "\n" + lines.join("\n") + "\n" + LINE;
}
module.exports = { b, bi, panel, LINE };
