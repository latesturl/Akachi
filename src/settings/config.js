import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

global.owner = ["6283822021601"]
global.prefix = "."
global.gmail = "latesturltech@gmail.com"
global.botName = "Akachi"
global.sessionName = "session"
global.packname = "Akachi Bot"
global.author = "WhatsApp Bot"
global.ownerName = "LatestURL"

global.defaultLimit = 10
global.premiumDefaultLimit = 100
global.maxAddLimit = 100

global.autoResetLimit = true
global.resetLimitInterval = 24 * 60 * 60 * 1000

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log("\x1b[0;32m" + file + " \x1b[1;32mupdated!\x1b[0m")
  delete global.owner
  delete global.prefix
  delete global.gmail
  delete global.botName
  delete global.sessionName
  delete global.packname
  delete global.author
  delete global.ownerName
  delete global.defaultLimit
  delete global.premiumDefaultLimit
  delete global.maxAddLimit
  delete global.autoResetLimit
  delete global.resetLimitInterval
  import(`${file}?update=${Date.now()}`)
})
