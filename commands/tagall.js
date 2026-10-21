module.exports = { name: "tagall", run: async (api, event) => {
  const tid = event.threadID;
  const info = await new Promise((r) => api.getThreadInfo(tid, (e, i) => r(i)));
  if (!info) return api.sendMessage("❌ Impossible de lire le groupe.", tid);
  const admins = (info.adminIDs || []).map((a) => String(a.id || a));
  if (!admins.includes(String(event.senderID))) return api.sendMessage("⛔ Réservé aux admins du groupe.", tid);
  const ids = (info.participantIDs || []).map(String);
  const ui = await new Promise((r) => api.getUserInfo(ids, (e, i) => r(i || {})));
  const msg = (event.body || "").trim().replace(/^\S+\s*/, "") || "Réveillez-vous !";
  let body = "📢 " + msg + "\n";
  const mentions = [];
  for (const id of ids) {
    const tag = "@" + ((ui[id] && ui[id].firstName) || "Membre");
    mentions.push({ tag, id, fromIndex: body.length });
    body += tag + " ";
  }
  api.sendMessage({ body, mentions }, tid);
}};
