// 必要情報を入力し終わった後、config.jsに変更してください

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
    discord: {
        // ディスコBOTのトークン
        token: "",
        // サーバーID
        guildId: "",
        channelId: "",
        // 管理者用コマンドを使えるようにするロールID
        roleId: ""
    }
}

export default config ;
