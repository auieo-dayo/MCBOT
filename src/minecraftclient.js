import { createClient } from 'bedrock-protocol';
import { eventBus } from './eventBus.js';

// メモ:
// this.client.profileにname,xuid,uuid

class client {
    constructor (config) {
        if (!config) return
        this.config = config
        this.client = createClient(this.config);
        this.client.on("start_game",(packet)=>{
            const position = packet.position ?? packet.Position ?? packet.Player_Position ?? packet.player_position
            this.world = {
            name: null,
            levelId: null
            };
            this.world.name = packet.world_name
            this.world.levelId = packet.level_id

            eventBus.emit(`mcLogedin`,{worldname:this.world.name})

            this.client.queue('spawn', {
                runtime_entity_id: this.client.entityId,
                position: position
            })
        })
    }
    on(event,handler) {
        this.client.on(event,handler)
    }
    disconnect() {
        this.client.close()
        eventBus.emit("mcDisconnect",{type:1})
        this.client = undefined
    }
    sendchat(msg,username) {
        if (!this.client) return 1
        let prefix = ""
        if (username) prefix=`§3${username}§r:`;
        if (msg || this.client) {
            this.client.queue('text', {
            type: 'chat',
            needs_translation: false,
            source_name: this.client.username,
            xuid: this.client.profile?.xuid ?? "",
            platform_chat_id: '', 
            filtered_message: undefined,
            category: 'authored',
            message: `${prefix}${msg}` ?? "Error"
            })
        }
    }
}

function buildConfig(type,server,username,authTitle,skipPing=false,version) {
    const base = {
        "username": username,
        "offline": false,
        "skipPing": skipPing,
        "connectTimeout": 50000,
        "flow": "live",
        "profilesFolder": "./auth",
        "authTitle": authTitle,
        "onMsaCode": (data)=>{
                console.log(`Please Login! \nhttp://microsoft.com/link?otc=${data.user_code}`);
        },

    }
    let config
    switch (type) {
        case 1 : {
            config =  {
                ...base,
                host:server.ip,
                port:server.port
            }
            break;
        }
        case 2 : {
            config =  {
                ...base,
                realms: {
                    pickRealm(realms) {
                        return realms.find(r => r.name === server.realmsName);
                    }
                }
            }
            break;
        }
        case 3 : {
            config = {
                ...base,
                realms: {
                    realmInvite: server.realmsInvite
                }
            }
            break;
        }
    }
    if (version) config.version = version;
    
    return config
}
export default {client,buildConfig};