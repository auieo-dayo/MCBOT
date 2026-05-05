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
import {setCommands} from "./src/setCmd.js"
import Server from "./src/server.js"


import { fileURLToPath } from "url";
import { dirname } from "path";
import { EmbedBuilder, Events, Message, MessageFlags } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = __dirname;

const lm = new Logger(root);

const flags = {
  ChatStop: false
}

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
eventBus.on('mcDisconnect', (data) => {
  lm.addlog("log",'Minecraft disconnected success', {type:data.type});
  if (!data.waitRestart) discord.destroy()
});

const pm = new PlayerManager()

// Events
const events = {
  // Chat
  chat: (packet)=>{
    if (packet.source_name == (mc.client.username ?? "")) return
    const {source_name,message} = packet
    lm.addlog("chat",`${source_name}:${message}`,{source_name,message,source:"Minecraft"})
    if (!pm.isjoined(source_name)) pm.join(source_name)
    eventBus.emit(`newChat`,{name:source_name,message,isMinecraft:true})
    if (flags.ChatStop) return
    discord.send({content:`\`${source_name}\`:${message}`})

  },
  // Join Leave
  joinleave: (packet,type=0)=>{
    const name = packet.parameters?.[0] ?? 'Unknown';
    const types = ["ログイン","ログアウト"]
    console.log(`${name}が${types[type]}しました`);
    lm.addlog("chat",`${name}が${types[type]}しました`,{name,type})
    
    if (type === 0) {
      eventBus.emit(`join`,{name,data:`${name}が${types[type]}しました`})
      pm.join(name);
    }
    if (type === 1) {
      eventBus.emit(`leave`,{name,data:`${name}が${types[type]}しました`})
      pm.leave(name);
    } 
    
    if (flags.ChatStop) return

    const embed =new EmbedBuilder()
      .setTitle(`${name}が${types[type]}しました`)
      .setDescription(`WorldName:${mc.world.name}`)
      .setColor([0x45a33d,0xba3232][type])
      .setTimestamp(new Date())
    discord.send({embeds:[embed]})

    
  },
  // Death 
  death: async(packet)=>{
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
    eventBus.emit(`death`,deathmsg,diedplayer,sourceKey,killer,item)
    if (!pm.isjoined(diedplayer)) pm.join(diedplayer)
    
    if (flags.ChatStop) return
    
    const embed =new EmbedBuilder()
      .setTitle(`${deathmsg}`)
      .setDescription(`WorldName:${mc.world.name}`)
      .setColor(0xd534eb)
      .setTimestamp(new Date());
    await discord.send({embeds:[embed]})

  },
  // PlayerList
  pl: async (message)=>{
    const list = pm.getplayerlist()
    const embed = new EmbedBuilder()
    embed.setTitle("PlayersList")
    embed.setTimestamp(new Date())

    if (!list[0]) {
      embed.setDescription("<NonPlayer>")
      return await message.reply({embeds:[embed]})
    }

    let md = "" 
    for (const p of list) {md+=`- ${p}\n`}
    embed.setDescription(md)
    return await message.reply({embeds:[embed]})
  },
  // チャット連携一時停止
  pauseChat: async(message)=>{
    flags.ChatStop = !flags.ChatStop
    const embed = new EmbedBuilder()
      .setTitle("チャット連携")
      .setDescription(`を${flags.ChatStop ? "ストップ" :"再開"}しました`)
      .setTimestamp(new Date())
      .setColor(0x6bd0ff)
    return await message.reply({embeds:[embed]})
  },
  // 再起動
  restart: async(message)=>{
    const embed = new EmbedBuilder()
      .setTitle("再起動")
      .setDescription(`を開始します...`)
      .setTimestamp(new Date())
      .setColor(0xff776b);
    await message.reply({embeds:[embed]})
    mc.disconnect(true)
    mc.connect()
  },
  /**
   * 
   * @param {Message} message 
   */
  clearPL: async(message) => {
    const embed = new EmbedBuilder()
      .setTitle("プレイヤーリストの")
      .setDescription(`初期化を開始します...`)
      .setTimestamp(new Date())
      .setColor(0xff776b);
    await message.reply({embeds:[embed],flags:MessageFlags.Ephemeral})
    const list = pm.getplayerlist()
    list.forEach((v)=>pm.leave(v))
  }
}

const discord = new Discord()
await discord.login(config.discord.token,config.discord.channelId)
// コマンドの設定
await setCommands(discord.client,config.discord.guildId)

discord.on(Events.MessageCreate,async(message)=>{
  if (message.channelId !== config.discord.channelId) return
  const {content} = message
  if (!content || message.author.bot) return

  if (content === "?pl" || content === "?playerslist") return await events.pl(message);

  lm.addlog("chat",`[D]${message.author.displayName}:${message.content}`,{source_name:message.author.displayName,message:message.content,source:"Discord"})
  eventBus.emit(`newChat`,{name:message.author.displayName,message:message.content,isMinecraft:false})
  if (flags.ChatStop) return
  
  mc.sendchat(content,`[D]${message.author.displayName}`)
})

discord.on(Events.InteractionCreate,(async(_ev)=>{
  /**
   * @type {import('discord.js').Interaction}
   */
  const interaction = _ev
  if (interaction.guildId != config.discord.guildId) return
  if (!interaction.isCommand()) return
  const {commandName} = interaction
  if (commandName == "pl") await events.pl(interaction);

  if (commandName == "auieo") {
    const member = await interaction.guild.members.fetch(interaction.user.id)
    if (!member.roles.cache.has(config.discord.roleId))  return;
    const option = interaction.options.getString("option")
    if (!option) return interaction.reply("オプションがありません")
    if (option == "chatPause") await events.pauseChat(interaction)
    if (option == "restart") await events.restart(interaction);
    if (option == "clearplayerlist") await events.clearPL(interaction);
  }
}))

const mc = new mineclient.client(mineclient_config)
mc.connect()

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
  await discord.send({embeds:[embed]})
})

mc.on("disconnect",(p)=>{
  console.log(p)
})

// WebServer
Server.start()


process.on("SIGINT",()=>{
  discord.destroy()
  mc.disconnect()
})