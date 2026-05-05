import { ApplicationCommandOptionType } from "discord.js"
/**
 * @type {import("discord.js").ApplicationCommandDataResolvable[]}
 */
const commandlist = [
    {
        name:"pl",
        description: "プレイヤーリストを表示します。",
    },
    {
        name: "auieo",
        description: "auieo-dayo作MCBOT系コマンド",
        options: [
            {
                name: "option",
                description: "オプション",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {name:"再起動",value:"restart"},
                    {name:"チャット連携を一時停止",value:"chatPause"},
                    {name:"プレイヤーリストをリセット",value:"clearplayerlist"},
                ]
            }
        ]
    }
]
/**
 * 
 * @param {import("discord.js").Client} client 
 * @param {*} guildid 
 * @returns 
 */
async function setCommands(client,guildid) {
    const res = await client.application.commands.set(commandlist,String(guildid))
    return res
}
export {commandlist,setCommands}