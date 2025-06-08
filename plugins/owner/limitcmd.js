import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const limitPath = path.resolve("./lib/database/limitcmd.json")

const handler = async (m, { args, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!args[0] || !args[1]) return m.reply("Usage: .limitcmd <command> <true/false>")

  const cmd = args[0].toLowerCase()
  const on = args[1].toLowerCase() === "true"

  try {
    const dir = path.dirname(limitPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    let data = {}
    if (fs.existsSync(limitPath)) {
      data = JSON.parse(fs.readFileSync(limitPath, "utf-8"))
    }

    data[cmd] = on
    fs.writeFileSync(limitPath, JSON.stringify(data, null, 2))

    m.reply(`✅ Command '${cmd}' limit ${on ? "enabled" : "disabled"}.`)
  } catch (error) {
    m.reply(`❌ Error: ${error.message}`)
  }
}

handler.help = ["limitcmd <command> <true/false>"]
handler.tags = ["owner"]
handler.command = ["limitcmd"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
