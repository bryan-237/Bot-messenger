const { createCanvas } = require("@napi-rs/canvas");
module.exports = {
 config: { name: "list", aliases: ["help","menu"], version: "2.1", role: 0 },
 onStart: async function({ message }) {
  const canvas = createCanvas(900,700);
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0,0,900,700);
  bg.addColorStop(0,"#140a2d"); bg.addColorStop(0.5,"#1e0b3a"); bg.addColorStop(1,"#2d1b69");
  ctx.fillStyle=bg; ctx.fillRect(0,0,900,700);
  ctx.fillStyle="#ffffff"; ctx.font="Bold 42px sans-serif";
  ctx.fillText("SONIC THE GOAT",80,60);
  ctx.fillText("BOT COMMANDS",80,105);
  ctx.font="16px sans-serif"; ctx.fillStyle="#a78bfa";
  ctx.fillText("Use . before each command - v2.1 - Goat Bot",80,135);
  ctx.strokeStyle="#7c3aed55"; ctx.lineWidth=2;
  ctx.strokeRect(40,170,400,480); ctx.strokeRect(460,170,400,480);
  ctx.fillStyle="#a78bfa"; ctx.font="Bold 16px sans-serif"; ctx.textAlign="center";
  ctx.fillText("CORE COMMANDS",240,200); ctx.fillText("INFO & MODERATION",660,200);
  ctx.textAlign="left"; ctx.fillStyle="#fff"; ctx.font="Bold 18px sans-serif";
  ctx.fillText("bal - Check balance",70,240);
  ctx.fillText("blague - Tell joke",70,300);
  ctx.fillText("daily - Daily reward",70,360);
  ctx.fillText("work - Earn coins",70,420);
  ctx.fillText("shop - Shop store",70,480);
  ctx.fillText("slap - Slap user",70,540);
  ctx.fillText("ai - Chat AI",490,240);
  ctx.fillText("rank - Leaderboard",490,300);
  ctx.fillText("uid - Get ID",490,360);
  ctx.fillText("welcome - Welcome msg",490,420);
  ctx.fillText("bye - Goodbye msg",490,480);
  ctx.fillText("groupe - Group settings",490,540);
  ctx.fillStyle="#8b5cf6"; ctx.font="14px sans-serif"; ctx.textAlign="center";
  ctx.fillText("SONIC THE GOAT BOT - Fast - Reliable - Fun",450,680);
  const buf=canvas.toBuffer("image/png");
  return message.reply({body:"📦 Menu SONIC THE GOAT", attachment:buf});
 }
}
