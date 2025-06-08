import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, text, command }) => {
  if (!m.isGroup) return m.reply("This command can only be used in groups")

  try {
    if (!m.isAdmins && !m.isCreator) {
      return m.reply("Only admins can use this command")
    }

    switch (command) {
      case "group":
        if (!args[0])
          return m.reply(`
*Group Settings*
Usage: .group [option]
Options:
- open - Allow everyone to send messages
- close - Only admins can send messages
- info - Show group information
        `)

        if (args[0] === "open") {
          if (!m.isBotAdmins) {
            return m.reply("Bot must be an admin to change group settings")
          }
          await conn.groupSettingUpdate(m.key.remoteJid, "not_announcement")
          m.reply("Group has been opened, all participants can send messages")
        } else if (args[0] === "close") {
          if (!m.isBotAdmins) {
            return m.reply("Bot must be an admin to change group settings")
          }
          await conn.groupSettingUpdate(m.key.remoteJid, "announcement")
          m.reply("Group has been closed, only admins can send messages")
        } else if (args[0] === "info") {
          const botIsAdmin = m.isBotAdmins ? "Yes" : "No"

          const info = `
*Group Information*
Name: ${m.groupName}
Description: ${m.groupMetadata?.desc?.toString() || "No description"}
ID: ${m.groupMetadata.id}
Created: ${new Date(m.groupMetadata.creation * 1000).toLocaleString()}
Owner: ${m.groupOwner ? "@" + m.groupOwner.split("@")[0] : "Unknown"}
Members: ${m.participants.length}
Admins: ${m.groupAdmins.length}
Bot is admin: ${botIsAdmin}
Group Settings: ${m.groupMetadata.announce ? "Only admins can send messages" : "All participants can send messages"}
Ephemeral: ${m.groupMetadata.ephemeralDuration ? `Enabled (${m.groupMetadata.ephemeralDuration / 86400} days)` : "Disabled"}
          `

          m.reply(info, null, {
            mentions: [...(m.groupOwner ? [m.groupOwner] : []), ...m.groupAdmins],
          })
        } else {
          m.reply("Invalid option. Use 'open', 'close', or 'info'")
        }
        break

      case "subject":
      case "rename":
        if (!text) return m.reply("Enter the new group name")

        if (!m.isBotAdmins) {
          return m.reply("Bot must be an admin to change group name")
        }

        await conn.groupUpdateSubject(m.key.remoteJid, text)
        m.reply(`Group name has been changed to "${text}"`)
        break

      case "desc":
      case "description":
        if (!text) return m.reply("Enter the new group description")

        if (!m.isBotAdmins) {
          return m.reply("Bot must be an admin to change group description")
        }

        await conn.groupUpdateDescription(m.key.remoteJid, text)
        m.reply("Group description has been updated")
        break

      case "ephemeral":
        if (!args[0])
          return m.reply(`
*Ephemeral Messages*
Usage: .ephemeral [option]
Options:
- off - Disable ephemeral messages
- 1d - Set messages to disappear after 1 day
- 7d - Set messages to disappear after 7 days
- 90d - Set messages to disappear after 90 days
        `)

        if (!m.isBotAdmins) {
          return m.reply("Bot must be an admin to change ephemeral settings")
        }

        let ephemeralTime = 0
        if (args[0] === "1d") ephemeralTime = 86400
        else if (args[0] === "7d") ephemeralTime = 604800
        else if (args[0] === "90d") ephemeralTime = 7776000
        else if (args[0] === "off") ephemeralTime = 0
        else return m.reply("Invalid option. Use 'off', '1d', '7d', or '90d'")

        await conn.groupToggleEphemeral(m.key.remoteJid, ephemeralTime)
        if (ephemeralTime) {
          m.reply(`Ephemeral messages enabled: Messages will disappear after ${args[0]}`)
        } else {
          m.reply("Ephemeral messages disabled")
        }
        break
    }
  } catch (error) {
    console.error("Group command error:", error)
    m.reply(`Error: ${error.message}`)
  }
}

handler.help = [
  "group [open/close/info]",
  "subject [text]",
  "rename [text]",
  "desc [text]",
  "description [text]",
  "ephemeral [off/1d/7d/90d]",
]
handler.tags = ["group"]
handler.command = ["group", "subject", "rename", "desc", "description", "ephemeral"]

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
