const fs=require("fs");const{makeCard}=require("../../lib/card.js");
module.exports={config:{name:"uid",version:"3.0",author:"bryan",role:0,category:"utility"},
onStart:async({api,message,event,args})=>{let id=event.senderID;if(event.messageReply)id=event.messageReply.senderID;else if(Object.keys(event.mentions).length>0)id=Object.keys(event.mentions)[0];else if(args[0])id=args[0];
try{const inf=await new Promise(r=>api.getUserInfo(id,(e,i)=>r(i?.[id]||{})));const name=inf.name||id;const file=await makeCard(api,id,{title:"UID INFO",name,big:id,lines:[`Nom: ${name}`]});return message.reply({body:"",attachment:fs.createReadStream(file)});}catch{return message.reply(`🆔 UID: ${id}`);}}};
