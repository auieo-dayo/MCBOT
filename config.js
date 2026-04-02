
const config = {
    minecraft: {
        // 1:ServerIP and Port 
        // 2:RealmsName
        // 3:RealmsInvite
        botType: 1,
        server: {
            // Only botType=1
            ip: "127.0.0.1",
            port: 19132,
            // Only botType=2
            realmsName: "",
            // Only botType=3
            realmsInvite: ""
        }
    },
    disocrd: {
        // ディスコBOTのトークン
        token: "",
        // チャンネルID
        channelId: ""
    }
}

export default config ;