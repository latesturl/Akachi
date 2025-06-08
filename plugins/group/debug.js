import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply("This command can only be used in groups")

  try {
    const adminList =
      m.groupAdmins && m.groupAdmins.length > 0 ? m.groupAdmins.map((id) => `- ${id}`).join("\n") : "No admins found"

    const senderSimple = m.sender ? m.sender.split("@")[0] : "Unknown"
    const botNumberSimple = m.botNumber ? m.botNumber.split("@")[0] : "Unknown"

    const debugInfo = `
*Debug Information*

Bot ID: ${m.botNumber || "Unknown"}
Bot Number: ${botNumberSimple}
Sender Full: ${m.sender || "Unknown"}
Sender Simple: ${senderSimple}
Is Bot Admin: ${m.isBotAdmins ? "Yes" : "No"}
Is Sender Admin: ${m.isAdmins ? "Yes" : "No"}
Group Name: ${m.groupName || "Unknown"}
Total Participants: ${m.participants ? m.participants.length : 0}
Total Admins: ${m.groupAdmins ? m.groupAdmins.length : 0}

*Admin List:*
${adminList}
    `

    m.reply(debugInfo)
  } catch (error) {
    console.error("Debug error:", error)
    m.reply(`Error: ${error.message}`)
  }
}

handler.help = ["debugadmin"]
handler.tags = ["group"]
handler.command = ["debugadmin"]

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
