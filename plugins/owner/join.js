import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, text, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!text) return m.reply("Enter the group invite link")

  const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
  const [_, code] = text.match(linkRegex) || []

  if (!code) return m.reply("Invalid invite link")

  try {
    const groupInfo = await conn.groupGetInviteInfo(code)

    m.reply(
      `
*Group Information*
Name: ${groupInfo.subject}
Owner: ${groupInfo.owner ? "@" + groupInfo.owner.split("@")[0] : "Unknown"}
Size: ${groupInfo.size} members
Creation: ${new Date(groupInfo.creation * 1000).toLocaleString()}

Joining group...
    `,
      null,
      { mentions: groupInfo.owner ? [groupInfo.owner] : [] },
    )

    const result = await conn.groupAcceptInvite(code)

    if (result) {
      m.reply("Successfully joined the group")
    } else {
      m.reply("Failed to join the group")
    }
  } catch (error) {
    m.reply(`Failed to join group: ${error}`)
  }
}

handler.help = ["join <group link>"]
handler.tags = ["owner"]
handler.command = ["join"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
