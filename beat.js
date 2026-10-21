const fs = require("fs");
const SR = 44100, BPM = 90, BARS = 4;
const beat = 60 / BPM;
const total = Math.floor(SR * beat * 4 * BARS);
const out = new Float32Array(total);

function add(start, a, gain) {
  const s = Math.floor(start * SR);
  for (let i = 0; i < a.length && s + i < total; i++) out[s + i] += a[i] * gain;
}
function kick() {
  const n = Math.floor(SR * 0.35), a = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (45 + 110 * Math.exp(-t * 28))) / SR;
    a[i] = Math.sin(ph) * Math.exp(-t * 9);
  }
  return a;
}
function snare() {
  const n = Math.floor(SR * 0.22), a = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    a[i] = ((Math.random() * 2 - 1) * 0.8 + Math.sin(2 * Math.PI * 190 * t) * 0.4) * Math.exp(-t * 20);
  }
  return a;
}
function hat() {
  const n = Math.floor(SR * 0.05), a = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 2 - 1;
    a[i] = (x - prev) * Math.exp(-(i / SR) * 70);
    prev = x;
  }
  return a;
}
function bass(f) {
  const n = Math.floor(SR * 0.45), a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = Math.sin(2 * Math.PI * f * (i / SR)) * Math.exp(-(i / SR) * 4);
  return a;
}

const K = kick(), S = snare(), H = hat();
for (let bar = 0; bar < BARS; bar++) {
  const b0 = bar * 4 * beat;
  const note = bar % 2 ? 49 : 55;
  [0, 2.5].forEach((p) => { add(b0 + p * beat, K, 0.9); add(b0 + p * beat, bass(note), 0.5); });
  if (bar % 2 === 1) add(b0 + 3.75 * beat, K, 0.6);
  [1, 3].forEach((p) => add(b0 + p * beat, S, 0.7));
  for (let h = 0; h < 8; h++) add(b0 + h * 0.5 * beat, H, h % 2 ? 0.25 : 0.4);
}
let peak = 0;
for (const v of out) peak = Math.max(peak, Math.abs(v));
const buf = Buffer.alloc(44 + total * 2);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + total * 2, 4); buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(total * 2, 40);
for (let i = 0; i < total; i++) buf.writeInt16LE(Math.round((out[i] / peak) * 0.9 * 32767), 44 + i * 2);
fs.writeFileSync("beat.wav", buf);
console.log("beat.wav créé");
