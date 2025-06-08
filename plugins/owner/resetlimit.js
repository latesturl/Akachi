import { getUser, saveUser } from "../../src/myfunction.js"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, participants, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!args[0]) return m.reply("Usage: .resetlimit @user/number/@all")

  const getJids = () => {
    if (args[0] === "@all" && m.isGroup) return participants.map((p) => p.id)
    if (m.mentionedJid?.length) return m.mentionedJid
    if (/\d{5,}/.test(args[0])) return [args[0].replace(/\D/g, "") + "@s.whatsapp.net"]
    return [m.sender]
  }

  const jids = getJids()
  for (const id of jids) {
    const user = getUser(id)
    // Reset to appropriate default limit based on premium status
    if (user.premium && Date.now() < user.expired) {
      user.limit = global.premiumDefaultLimit || 100
    } else {
      user.limit = global.defaultLimit || 10
    }
    user.lastReset = Date.now()
    saveUser(user)
  }

  const defaultLimitUsed = global.defaultLimit || 10
  const premiumLimitUsed = global.premiumDefaultLimit || 100

  m.reply(`✅ Successfully reset limit for ${jids.length} user(s).

📊 Reset Details:
• Regular users: ${defaultLimitUsed} limit
• Premium users: ${premiumLimitUsed} limit`)
}

handler.help = ["resetlimit @user/number/@all"]
handler.tags = ["owner"]
handler.command = ["resetlimit"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
