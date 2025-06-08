import { getUser, saveUser } from "../../src/myfunction.js"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

// Parse time string to milliseconds
const parseTimeString = (timeStr) => {
  if (!timeStr) return null

  const timeRegex = /^(\d+)\s*(menit?|minutes?|jam|hours?|hari|days?|minggu|weeks?|bulan|months?|tahun|years?)$/i
  const match = timeStr.match(timeRegex)

  if (!match) return null

  const amount = Number.parseInt(match[1])
  const unit = match[2].toLowerCase()

  const timeUnits = {
    menit: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    jam: 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    hari: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    minggu: 7 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    bulan: 30 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    tahun: 365 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000,
  }

  const multiplier = timeUnits[unit]
  return multiplier ? amount * multiplier : null
}

// Format duration for display
const formatDuration = (ms) => {
  const units = [
    { name: "tahun", value: 365 * 24 * 60 * 60 * 1000 },
    { name: "bulan", value: 30 * 24 * 60 * 60 * 1000 },
    { name: "minggu", value: 7 * 24 * 60 * 60 * 1000 },
    { name: "hari", value: 24 * 60 * 60 * 1000 },
    { name: "jam", value: 60 * 60 * 1000 },
    { name: "menit", value: 60 * 1000 },
  ]

  for (const unit of units) {
    const count = Math.floor(ms / unit.value)
    if (count > 0) {
      return `${count} ${unit.name}`
    }
  }
  return "kurang dari 1 menit"
}

const handler = async (m, { conn, args, participants, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!args[0]) {
    return m.reply(`
*Add Premium Usage*

Format: .addprem @user/number/@all <duration>

Duration examples:
• 30 menit / 30 minutes
• 2 jam / 2 hours  
• 7 hari / 7 days
• 1 minggu / 1 week
• 1 bulan / 1 month
• 1 tahun / 1 year

Examples:
• .addprem @user 30 hari
• .addprem 628123456789 1 bulan
• .addprem @all 7 hari
    `)
  }

  const now = Date.now()
  const timeStr = args.slice(1).join(" ")

  if (!timeStr) {
    return m.reply("Please specify the duration. Example: .addprem @user 30 hari")
  }

  const duration = parseTimeString(timeStr)
  if (!duration) {
    return m.reply(`
❌ Invalid time format!

Valid formats:
• Numbers + time unit (menit, jam, hari, minggu, bulan, tahun)
• English units also supported (minutes, hours, days, weeks, months, years)

Examples: "30 hari", "2 jam", "1 bulan"
    `)
  }

  const getJids = () => {
    if (args[0] === "@all" && m.isGroup) return participants.map((p) => p.id)
    if (m.mentionedJid?.length) return m.mentionedJid
    if (/\d{5,}/.test(args[0])) return [args[0].replace(/\D/g, "") + "@s.whatsapp.net"]
    return [m.sender]
  }

  const jids = getJids()
  const durationText = formatDuration(duration)

  for (const id of jids) {
    const user = getUser(id)
    if (user.premium && user.expired > now) {
      user.expired += duration
    } else {
      user.premium = true
      user.expired = now + duration
      // Set premium default limit
      user.limit = global.premiumDefaultLimit || 100
    }
    saveUser(user)
  }

  const expiryDate = new Date(now + duration).toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  m.reply(`✅ Successfully added ${durationText} premium to ${jids.length} user(s).
📅 Premium will expire on: ${expiryDate}`)
}

handler.help = ["addprem @user/number/@all <duration>"]
handler.tags = ["owner"]
handler.command = ["addprem"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
