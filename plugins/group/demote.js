import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, text }) => {
  if (!m.isGroup) return m.reply("This command can only be used in groups")

  try {
    if (!m.isBotAdmins) {
      return m.reply("Bot must be an admin to use this command")
    }

    if (!m.isAdmins && !m.isCreator) {
      return m.reply("Only admins can use this command")
    }

    let users = []

    // Check if there's a quoted message
    if (m.quoted && m.quoted.sender) {
      users = [m.quoted.sender]
    }
    // Check if there are mentioned users
    else if (m.mentionedJid && m.mentionedJid.length > 0) {
      users = m.mentionedJid
    }
    // Check if there's a number in the text
    else if (text) {
      const userNumber = text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
      users = [userNumber]
    } else {
      return m.reply("Tag users to demote, reply to their message, or enter their number")
    }

    await conn.groupParticipantsUpdate(m.key.remoteJid, users, "demote")
    m.reply(`Successfully demoted ${users.map((v) => "@" + v.split("@")[0]).join(", ")}`, null, { mentions: users })
  } catch (error) {
    console.error("Demote error:", error)
    m.reply(`Failed to demote: ${error.message}`)
  }
}

handler.help = ["demote @user/reply"]
handler.tags = ["group"]
handler.command = ["demote", "unadmin"]

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
