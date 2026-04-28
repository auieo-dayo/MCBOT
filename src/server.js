import http from "http"
import { WebSocketServer } from "ws"
import express from "express"

import { eventBus } from './eventBus.js';


const app = express()
const server = new http.Server(app)
const wss = new WebSocketServer({ noServer: true, path: "/ws" });

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit("connection", ws, req);
  });
});


eventBus.on('mcLogedin', (data) => {
    broadcast({type:"mcLogedin",data:data.worldname})
});
eventBus.on('mcDisconnect', (data) => {
  broadcast({type:"mcDisconnect",data:`Disconnected${data.waitRestart ? "For Restart" : "" }`})
});

eventBus.on('newChat', (data) => {
    const {name,message,isMinecraft} = data
    const pre = !isMinecraft ? "[D]" : ""
    broadcast({type:"newChat",data:`${pre}${name}:${message}`,name,message,isMinecraft})
});

eventBus.on("join",(data)=>{
    broadcast({type:"join",name:data.name,data:data.data})
})
eventBus.on("leave",(data)=>{
    const {name,data} = data
    broadcast({type:"leave",name:data.name,data:data.data})
})

eventBus.on("death",(deathmsg,diedplayer,sourceKey,killer,item)=>{
    broadcast({type:"death",data:{deathmsg,diedplayer,sourceKey,killer,item}})
})


function broadcast(json) {
    if (!wss) return
    wss.clients.forEach ((client) => {
        if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(json));
        }
    });
}

function start() {
    server.listen(8585,"0.0.0.0",()=>{
        console.log("[WS&HTTP Server]StartServer")
    })
}

export default {start}