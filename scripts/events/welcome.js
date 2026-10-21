const {createCanvas,loadImage}=require("@napi-rs/canvas");
const fs=require("fs"),path=require("path");
module.exports={
 config:{name:"welcome",version:"5.0"},
 onStart:async({api,event,threadsData})=>{
  if(event.logMessageType!=="log:subscribe") return;
  const on=await threadsData.get(event.threadID,"data.welcome");
  if(!on) return;
  const ti=await api.getThreadInfo(event.threadID);
  const memberCount=ti.participantIDs.length;
  for(let u of event.logMessageData.addedParticipants){
   if(u.userFbId==api.getCurrentUserID()) continue;
   const W=800,H=400,C=createCanvas(W,H),ctx=C.getContext("2d");
   const grad=ctx.createLinearGradient(0,0,W,H);
   grad.addColorStop(0,"#1a1040");grad.addColorStop(1,"#4a2d8a");
   ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
   ctx.fillStyle="rgba(255,255,255,0.8)";
   for(let i=0;i<50;i++){ctx.beginPath();ctx.arc(Math.random()*W,Math.random()*H,Math.random()*1.5,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle="#2d1b69";ctx.beginPath();ctx.roundRect(20,20,W-40,H-40,25);ctx.fill();
   ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="Bold 36px sans-serif";ctx.fillText("BIENVENUE",W/2,75);
   try{
    const av=await loadImage(`https://graph.facebook.com/${u.userFbId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    ctx.save();ctx.beginPath();ctx.arc(W/2,180,65,0,Math.PI*2);ctx.clip();ctx.drawImage(av,W/2-65,115,130,130);ctx.restore();
    ctx.strokeStyle="#a78bfa";ctx.lineWidth=4;ctx.beginPath();ctx.arc(W/2,180,65,0,Math.PI*2);ctx.stroke();
   }catch{}
   ctx.fillStyle="#fff";ctx.font="Bold 20px sans-serif";ctx.fillText(`${u.fullName} a rejoint le groupe`,W/2,295);
   ctx.fillStyle="#c4b5fd";ctx.font="16px sans-serif";ctx.fillText(`Tu es le membre #${memberCount}`,W/2,325);
   const fp=path.join(__dirname,`../cmds/cache/wl_${Date.now()}.png`);fs.writeFileSync(fp,C.toBuffer("image/png"));
   api.sendMessage({attachment:fs.createReadStream(fp)},event.threadID,()=>{try{fs.unlinkSync(fp)}catch{}});
  }
 }
}
