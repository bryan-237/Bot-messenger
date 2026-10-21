const S = global.__gamesWaits || (global.__gamesWaits = []);
function add(w) { w.exp = Date.now() + (w.ttl || 300000); S.push(w); return w; }
function remove(w) { const i = S.indexOf(w); if (i < 0) return false; S.splice(i, 1); return true; }
function onMessage(api, event) {
  const now = Date.now();
  for (const w of [...S]) {
    if (w.exp < now) { remove(w); continue; }
    if (String(w.tid) !== String(event.threadID)) continue;
    if (w.uid && String(w.uid) !== String(event.senderID)) continue;
    try { if (w.on(api, event)) return; } catch (e) { console.error(e); }
  }
}
module.exports = { add, remove, onMessage };
