import { fileURLToPath } from "url"
import fs from "fs"
import { sleep } from "../../src/myfunction.js"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, isCreator }) => {
  if (!isCreator) return m.reply("❌ This command is only for the bot owner!")

  await m.reply("お疲れ様でした🖐")
  await sleep(3000)
  process.exit()
}

handler.help = ["shutdown"]
handler.tags = ["owner"]
handler.command = ["shutdown"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
