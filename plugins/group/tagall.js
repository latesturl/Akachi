import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, text, isCreator }) => {
  if (!m.isGroup) return m.reply("This command can only be used in groups")

  try {
    if (!m.isAdmins && !isCreator) {
      return m.reply("Only admins and bot owner can use this command")
    }

    const message = text ? text : "Hello everyone!"
    const mentions = m.participants.map((p) => p.id)

    const tagMessage = `
*${message}*

${m.participants.map((p, i) => `${i + 1}. @${p.id.split("@")[0]}`).join("\n")}
`

    await conn.sendMessage(m.key.remoteJid, { text: tagMessage, mentions })
  } catch (error) {
    console.error("Tagall error:", error)
    m.reply(`Error: ${error.message}`)
  }
}

handler.help = ["tagall [message]"]
handler.tags = ["group"]
handler.command = ["tagall", "everyone", "all"]

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
