export default class PlayerManager {
    constructor() {
        this.list = new Map()
    }
    join(playername) {
        this.list.set(playername,Date.now())
    }
    leave(playername) {
        this.list.delete(playername)
    }
    getplayerlist() {
        return Array.from(this.list.keys())
    }
    isjoined(playername) {
        return this.list.get(playername)
    }
    getfulllist(){
        return this.list.entries()
    }
}