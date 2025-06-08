import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, text, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!text) return m.reply("Enter the group name")

  const participants = m.mentionedJid || []

  if (participants.length === 0) {
    if (m.isGroup) {
      participants.push(m.sender)
    } else {
      return m.reply("Tag at least one user to add to the group")
    }
  }

  try {
    const group = await conn.groupCreate(text, participants)
    const inviteCode = await conn.groupInviteCode(group.id)

    m.reply(`
*Group created successfully*
Name: ${text}
ID: ${group.id}
Invite Link: https://chat.whatsapp.com/${inviteCode}
Participants: ${participants.length}
    `)
  } catch (error) {
    m.reply(`Failed to create group: ${error}`)
  }
}

handler.help = ["creategroup <name> @user1 @user2..."]
handler.tags = ["group"]
handler.command = ["creategroup", "groupcreate", "gcreate"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
