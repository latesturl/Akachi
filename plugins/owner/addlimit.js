import { getUser, saveUser } from "../../src/myfunction.js"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, participants, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!args[0] || !args[1]) return m.reply("Usage: .addlimit @user/number/@all <amount>")

  const amount = Number.parseInt(args[1])
  if (isNaN(amount) || amount <= 0) {
    return m.reply("Please enter a valid positive number for the limit amount")
  }

  if (amount > global.maxAddLimit) {
    return m.reply(`❌ Maximum limit that can be added at once is ${global.maxAddLimit}`)
  }

  const getJids = () => {
    if (args[0] === "@all" && m.isGroup) return participants.map((p) => p.id)
    if (m.mentionedJid?.length) return m.mentionedJid
    if (/\d{5,}/.test(args[0])) return [args[0].replace(/\D/g, "") + "@s.whatsapp.net"]
    return [m.sender]
  }

  const jids = getJids()
  for (const id of jids) {
    const user = getUser(id)
    user.limit += amount
    saveUser(user)
  }

  m.reply(`✅ Successfully added ${amount} limit to ${jids.length} user(s).`)
}

handler.help = ["addlimit @user/number/@all"]
handler.tags = ["owner"]
handler.command = ["addlimit"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
