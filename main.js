import dotenv from 'dotenv'
dotenv.config()
import prismarineAuth from "prismarine-auth";


import config from "./config.js";
import { eventBus } from './src/eventBus.js';
import RawText from "./src/rawtext.js";
import Logger from "./src/logger.js";
import mineclient from './src/minecraftclient.js'
import dmsgs from "./src/deathMessage.js"
import Discord from './src/discord.js';
import PlayerManager from './src/playermanager.js';
import entityNameMap from './src/EntityNameMap.js';


import { fileURLToPath } from "url";
import { dirname } from "path";
import { EmbedBuilder, Events } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = __dirname;

const lm = new Logger(root);

// type,server,username,authTitle,skipPing=false,version

const mineclient_config = mineclient.buildConfig(
    config.minecraft.botType,
    config.minecraft.server,
    "BOT_AUIEO",
    prismarineAuth.Titles.MinecraftNintendoSwitch,
    true)



eventBus.on('mcLogedin', (data) => {
  lm.addlog("log",'Minecraft login success', {worldname:data.worldname});
});
eventBus.on('mcDisconnected', (data) => {
  lm.addlog("log",'Minecraft disconnected success', {type:data.type});
});

const pm = new PlayerManager()

// Events
const events = {
  // Chat
  chat: (packet)=>{
    if (packet.source_name == mc.client.username ?? "") return
    const {source_name,message} = packet
    lm.addlog("chat",`${source_name}:${message}`,{source_name,message,source:"Minecraft"})
    discord.send({content:`\`${source_name}\`:${message}`})
    if (!pm.isjoined(source_name)) pm.join(source_name)

  },
  // Join Leave
  joinleave: (packet,type=0)=>{
    if (0 <= type && type <= 1) return 1
    const name = packet.parameters?.[0] ?? 'Unknown';
    const types = ["ログイン","ログアウト"]
    console.log(`${name}が${types[type]}しました`);
    lm.addlog("chat",`${name}が${types[type]}しました`,{name,type})

    const embed =new EmbedBuilder()
      .setTitle(`${name}が${types[type]}しました`)
      .setDescription(`WorldName:${mc.world.name}`)
      .setColor([0x45a33d,0xba3232][type])
      .setTimestamp(new Date())
    discord.send({embeds:[embed]})

    if (type === 0) pm.join(name);
    if (type === 1) pm.leave(name); 
  },
  // Death 
  death: (packet)=>{
    const diedplayer = packet.parameters?.[0] ?? '???';
    // エンティティかdiedplayerがないならスキップ
    if (/^\%entity/.test(diedplayer) || !diedplayer) return
    // 死因
    const sourceKey = packet.parameters?.[1];
    const killer = entityNameMap[sourceKey] || sourceKey || "不明";
    const item = packet.parameters?.[2] || "不明";
    const template = dmsgs[packet.message] ?? "%diedplayer%は死んだ(%killer%,%item%)"
    const deathmsg = template 
      .replaceAll("%diedplayer%",diedplayer)
      .replaceAll("%killer%",killer)
      .replaceAll("%item%",item);
    
    lm.addlog("death",`${deathmsg}`,{diedplayer,sourceKey,killer,item})

    const embed =new EmbedBuilder()
      .setTitle(`${deathmsg}`)
      .setDescription(`WorldName:${mc.world.name}`)
      .setColor(0xd534eb)
      .setTimestamp(new Date())
    discord.send({embeds:[embed]})

    if (!pm.isjoined(diedplayer)) pm.join(diedplayer)
  }
}

const discord = new Discord()
await discord.login(config.disocrd.token,config.disocrd.channelId)

discord.on(Events.MessageCreate,((message)=>{
  if (message.channelId !== config.disocrd.channelId) return
  const {content} = message
  if (!content || message.author.bot) return

  if (content === "?pl" || content === "?playerslist") {
    const list = pm.getplayerlist()
    const embed = new EmbedBuilder()
    embed.setTitle("PlayersList")
    embed.setTimestamp(new Date())
    
    if (!list[0]) {
      embed.setDescription("<NonPlayer>")
      return discord.send({embeds:[embed]})
    }

    let md = "" 
    for (const p of list) {md+=`- ${p}\n`}
    return discord.send({embeds:[embed]})
  }

  mc.sendchat(content,`[D]${message.author.displayName}`)
  lm.addlog("chat",`[D}${message.author.displayName}:${message.content}`,{source_name:message.author.displayName,message:message.content,source:"Discord"})
}))


const mc = new mineclient.client(mineclient_config)


mc.on("text",(packet)=>{
  const msg = packet.message.replace(/§./g, '');

  // Chat
  if (packet.type === 'chat') events.chat(packet);

  // Join
  if (["%multiplayer.player.joined.realms","%multiplayer.player.joined"].includes(msg)) events.joinleave(packet,0);
  // Leave
  if (["%multiplayer.player.left","%multiplayer.player.left.realms"].includes(msg)) events.joinleave(packet,1);

  if (msg.startsWith('death.')) events.death(packet);

})
mc.on("spawn",async()=>{
  console.log("Spawned")
  const embed =new EmbedBuilder()
    .setTitle("ログインしました")
    .setDescription(`WorldName:${mc.world.name}`)
    .setColor(0x45a33d)
    .setTimestamp(new Date())
  discord.send({embeds:[embed]})
})

mc.on("disconnect",(p)=>{
  console.log(p)
  discord.destroy()
})


process.on("SIGINT",()=>{
    mc.disconnect()
})