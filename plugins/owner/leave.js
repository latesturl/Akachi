import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  let targetJid = m.key.remoteJid

  if (args[0]) {
    if (args[0].startsWith("120363")) {
      targetJid = args[0]
    } else {
      return m.reply("Invalid group ID format")
    }
  }

  if (!targetJid.endsWith("@g.us")) return m.reply("This command can only be used in groups")

  try {
    await m.reply("Goodbye! Bot is leaving this group.")
    await conn.groupLeave(targetJid)
  } catch (error) {
    m.reply(`Failed to leave group: ${error}`)
  }
}

handler.help = ["leave", "leave <group id>"]
handler.tags = ["owner"]
handler.command = ["leave"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
