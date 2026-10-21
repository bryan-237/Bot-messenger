const {createCanvas,loadImage}=require("@napi-rs/canvas");
const fs=require("fs"),path=require("path");
module.exports={
 config:{name:"bye",version:"4.0"},
 onStart:async({api,event,threadsData})=>{
  try{
   if(event.logMessageType!=="log:unsubscribe") return;
   const isOn=await threadsData.get(event.threadID,"data.bye"); if(!isOn) return;
   const ti=await api.getThreadInfo(event.threadID);
   const groupName=ti.threadName||"le groupe"; const memberCount=ti.participantIDs.length; const groupPic=ti.imageSrc;
   const leftId=event.logMessageData.leftParticipantFbId;
   let name="Un membre"; try{const inf=await api.getUserInfo(leftId); name=inf[leftId]?.name||name;}catch{}
   const W=1024,H=576,C=createCanvas(W,H),ctx=C.getContext("2d");
   try{if(groupPic){const bg=await loadImage(groupPic);ctx.drawImage(bg,0,0,W,H);}else{ctx.fillStyle="#1a0a2e";ctx.fillRect(0,0,W,H);}}catch{ctx.fillStyle="#1a0a2e";ctx.fillRect(0,0,W,H);}
   ctx.fillStyle="rgba(0,0,0,0.5)";ctx.fillRect(0,0,W,H);
   ctx.fillStyle="rgba(30,10,10,0.88)";ctx.beginPath();ctx.roundRect(18,350,W-36,210,16);ctx.fill();
   try{const av=await loadImage(`https://graph.facebook.com/${leftId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);ctx.save();ctx.beginPath();ctx.arc(85,435,45,0,Math.PI*2);ctx.clip();ctx.drawImage(av,40,390,90,90);ctx.restore();}catch{}
   ctx.fillStyle="#fff";ctx.textAlign="left";ctx.font="Bold 22px sans-serif";ctx.fillText(`Au revoir ${name} !`,150,415);
   ctx.font="18px sans-serif";ctx.fillText(`📍 Groupe : ${groupName}`,150,442);ctx.fillText(`👥 Membres restants : ${memberCount}`,150,470);
   const fp=path.join(__dirname,`../commands/cache/bye_${Date.now()}.png`);fs.writeFileSync(fp,C.toBuffer("image/png"));
   api.sendMessage({attachment:fs.createReadStream(fp)},event.threadID,()=>{try{fs.unlinkSync(fp)}catch{}});
  }catch(e){console.log("BYE ERR",e)}
 }
}
