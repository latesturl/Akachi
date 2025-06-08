import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, command }) => {
  if (!m.isGroup) return m.reply("This command can only be used in groups")

  try {
    if (!m.isBotAdmins) {
      return m.reply("Bot must be an admin to use this command")
    }

    if (command === "revoke") {
      if (!m.isAdmins && !m.isCreator) {
        return m.reply("Only admins can use this command")
      }

      await conn.groupRevokeInvite(m.key.remoteJid)
      m.reply("Group invite link has been revoked")
    } else {
      try {
        const code = await conn.groupInviteCode(m.key.remoteJid)
        const link = `https://chat.whatsapp.com/${code}`

        if (command === "link") {
          m.reply(`
*Group Link*
${m.groupName}

${link}
          `)
        } else if (command === "linkgc") {
          m.reply(link)
        }
      } catch (error) {
        m.reply(`Failed to get group link: ${error.message}`)
      }
    }
  } catch (error) {
    console.error("Link error:", error)
    m.reply(`Error: ${error.message}`)
  }
}

handler.help = ["link", "linkgc", "revoke"]
handler.tags = ["group"]
handler.command = ["link", "linkgc", "revoke"]

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
