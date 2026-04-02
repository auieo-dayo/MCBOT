import discord from "discord.js"




export default class Discord {
    constructor() {
        try {
            this._channelgeted = ()=>{}

            this.client = new discord.Client({
                intents: [
                discord.GatewayIntentBits.Guilds, // サーバーに関するイベント
                discord.GatewayIntentBits.GuildMessages, // メッセージ関連
                discord.GatewayIntentBits.MessageContent, // メッセージの内容を取得（超重要！）
                ]
            });
            
        }catch(e){console.error(e.message)}
    }
    async login(token,channelid) {
        await this.client.login(token)
        console.log("Discord Ready")
        const channel = await this.client.channels.fetch(`${channelid}`,{force: true,allowUnknownGuild: true});
        if (typeof this._channelgeted == "function") this._channelgeted(channel)
        
        this.channel = channel
        return channel
    }
    async send(json) {
        await this.waitForGetChannel()
        await this.channel.send(json)
    }

    on(eventname,callback) {
        this.client.on(eventname,callback)
    }
    channelgeted(callback=()=>{}) {
        this._channelgeted = callback
    }

    async destroy() {
        await this.client.destroy()
    }

    waitForGetChannel() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
            if (this.channel) {
                clearInterval(interval);
                resolve(this.channel);
            }
            }, 50); // 50msごとにチェック
        });
    }
}