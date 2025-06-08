import { getUser, saveUser } from "../../src/myfunction.js"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, participants, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!args[0]) return m.reply("Usage: .delprem @user/number")

  const getJids = () => {
    if (args[0] === "@all" && m.isGroup) return participants.map((p) => p.id)
    if (m.mentionedJid?.length) return m.mentionedJid
    if (/\d{5,}/.test(args[0])) return [args[0].replace(/\D/g, "") + "@s.whatsapp.net"]
    return [m.sender]
  }

  const jids = getJids()
  for (const id of jids) {
    const user = getUser(id)
    user.premium = false
    user.expired = 0
    saveUser(user)
  }

  m.reply(`✅ Successfully removed premium from ${jids.length} user(s).`)
}

handler.help = ["delprem @user/number"]
handler.tags = ["owner"]
handler.command = ["delprem"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
