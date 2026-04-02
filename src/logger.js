import path from 'path';
import fs from 'fs-extra';
class Logger {
  constructor(root) {
    const date = new Date()
    this.folder = path.join(root,"log",`${date.getFullYear()}`,`${date.getMonth()+1}`,`${date.getDate()}`);
    this.filename = `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.jsonl`
    fs.ensureDirSync(this.folder)
    
    fs.ensureFileSync(path.join(this.folder,this.filename))
  }
  async addlog(type,log,note={}) {
    if ((note && typeof note != "object") || !type) return 1
    const time = Date.now()
    const json = {type,time,log,note}
    console.log(`${json.log}`)
    await fs.appendFile(path.join(this.folder,this.filename),`${JSON.stringify(json)}\n`)
    return 0
  }
}
export default Logger;