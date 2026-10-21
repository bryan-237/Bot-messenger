const {createCanvas,loadImage}=require("@napi-rs/canvas");
const fs=require("fs"),path=require("path");
module.exports={
 config:{name:"welcome",version:"4.0",author:"Bryan"},
 onStart:async({api,event,threadsData})=>{
  try{
   if(event.logMessageType!=="log:subscribe") return;
   const isOn=await threadsData.get(event.threadID,"data.welcome");
   if(!isOn) return;
   console.log("WELCOME IMAGE TRIGGERED");
   const threadInfo=await api.getThreadInfo(event.threadID);
   const groupName=threadInfo.threadName||"Rentrée en colère";
   const memberCount=threadInfo.participantIDs.length;
   const groupPic=threadInfo.imageSrc;
   for(let u of event.logMessageData.addedParticipants){
    if(u.userFbId==api.getCurrentUserID()) continue;
    const W=1024,H=576,C=createCanvas(W,H),ctx=C.getContext("2d");
    try{
     if(groupPic){const bg=await loadImage(groupPic);ctx.drawImage(bg,0,0,W,H);}
     else{ctx.fillStyle="#0f172a";ctx.fillRect(0,0,W,H);}
    }catch(e){ctx.fillStyle="#0f172a";ctx.fillRect(0,0,W,H);}
    ctx.fillStyle="rgba(0,0,0,0.35)";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(15,25,45,0.92)";ctx.beginPath();ctx.roundRect(18,350,W-36,210,16);ctx.fill();
    try{
     const av=await loadImage(`https://graph.facebook.com/${u.userFbId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
     ctx.save();ctx.beginPath();ctx.arc(85,435,45,0,Math.PI*2);ctx.clip();ctx.drawImage(av,40,390,90,90);ctx.restore();
     ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(85,435,45,0,Math.PI*2);ctx.stroke();
    }catch{}
    ctx.fillStyle="#fff";ctx.textAlign="left";ctx.font="Bold 22px sans-serif";ctx.fillText(`Bienvenue ${u.fullName} !`,150,415);
    ctx.font="18px sans-serif";ctx.fillText(`📍 Groupe : ${groupName} 😡`,150,442);ctx.fillText(`😠😤😲💨`,150,465);ctx.fillText(`👥 Membres : ${memberCount}`,150,492);
    const fp=path.join(__dirname,`../commands/cache/wl_${Date.now()}.png`);fs.writeFileSync(fp,C.toBuffer("image/png"));
    api.sendMessage({body:`🤖 BRYAN BOT`,attachment:fs.createReadStream(fp)},event.threadID,()=>{try{fs.unlinkSync(fp)}catch{}});
   }
  }catch(e){console.log("WELCOME IMG ERR:",e)}
 }
}
