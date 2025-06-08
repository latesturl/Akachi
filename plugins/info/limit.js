import { getUser, isPremium } from "../../src/myfunction.js"
import { fileURLToPath } from "url"
import fs from "fs"
import path from "path"
import {
  getTimeUntilNextReset,
  getAutoResetStatus,
  formatTimestamp,
  getLastGlobalReset,
} from "../../src/limitManager.js"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args }) => {
  let targetUser = m.sender

  // If user mentions someone or provides a number, check their limit (owner only)
  if (args[0] && m.isCreator) {
    if (m.mentionedJid?.length) {
      targetUser = m.mentionedJid[0]
    } else if (/\d{5,}/.test(args[0])) {
      targetUser = args[0].replace(/\D/g, "") + "@s.whatsapp.net"
    }
  }

  const user = getUser(targetUser)
  const premium = isPremium(targetUser)
  const now = Date.now()

  // Calculate time until next reset for non-premium users
  let resetInfo = ""
  if (!premium) {
    // Individual user reset (12 hours)
    const timeSinceLastReset = now - (user.lastReset || 0)
    const individualResetInterval = 12 * 60 * 60 * 1000 // 12 hours
    const timeLeftIndividual = individualResetInterval - timeSinceLastReset

    if (timeLeftIndividual > 0) {
      const hours = Math.floor(timeLeftIndividual / (60 * 60 * 1000))
      const minutes = Math.floor((timeLeftIndividual % (60 * 60 * 1000)) / (60 * 1000))
      resetInfo = `⏰ Individual Reset: ${hours}h ${minutes}m`
    } else {
      resetInfo = "⏰ Individual Reset: Ready"
    }

    // Global auto reset info
    const autoResetStatus = getAutoResetStatus()
    if (autoResetStatus) {
      const globalTimeUntil = getTimeUntilNextReset()
      resetInfo += `\n⏰ Global Reset: ${globalTimeUntil}`
    } else {
      resetInfo += `\n⏰ Global Reset: Disabled`
    }
  }

  // Premium expiry info
  let premiumInfo = ""
  if (premium) {
    const expiryDate = new Date(user.expired).toLocaleString("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    premiumInfo = `📅 Premium expires: ${expiryDate}`
  }

  // Load command limits for high-limit commands
  const cmdLimitPath = path.resolve("./lib/database/cmdlimit.json")
  let cmdLimits = {}
  try {
    if (fs.existsSync(cmdLimitPath)) {
      cmdLimits = JSON.parse(fs.readFileSync(cmdLimitPath, "utf-8"))
    }
  } catch (error) {
    console.error("Error loading command limits:", error)
  }

  // Get high-limit commands (more than 1 limit)
  const highLimitCommands = Object.entries(cmdLimits)
    .filter(([_, limit]) => limit > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Show top 5 highest limit commands

  let highLimitInfo = ""
  if (highLimitCommands.length > 0) {
    highLimitInfo =
      "\n\n*High Limit Commands:*\n" + highLimitCommands.map(([cmd, limit]) => `• .${cmd}: ${limit} limit`).join("\n")
  }

  // Auto reset info
  const autoResetStatus = getAutoResetStatus()
  const lastGlobalReset = formatTimestamp(getLastGlobalReset())

  const autoResetInfo = `
*Reset System Info:*
• Individual Reset: Every 12 hours (non-premium only)
• Global Auto Reset: ${autoResetStatus ? "✅ Enabled" : "❌ Disabled"}
• Last Global Reset: ${lastGlobalReset}
${autoResetStatus ? `• Next Global Reset: ${getTimeUntilNextReset()}` : ""}
`

  const isTargetingSelf = targetUser === m.sender
  const userName = isTargetingSelf ? "Your" : `@${targetUser.split("@")[0]}'s`

  const limitInfo = `
*${userName} Limit Information*

💎 Status: ${premium ? "Premium ⭐" : "Regular User"}
🎯 Current Limit: ${premium ? "∞ (Unlimited)" : user.limit}
${!premium ? resetInfo : ""}
${premiumInfo}

📊 Configuration:
• Default Limit: ${global.defaultLimit || 10}
• Premium Limit: ${global.premiumDefaultLimit || 100}
${highLimitInfo}

${autoResetInfo}

${!premium ? "💡 Upgrade to premium for unlimited usage!" : ""}
  `

  m.reply(limitInfo, null, {
    mentions: isTargetingSelf ? [] : [targetUser],
  })
}

handler.help = ["limit", "limit @user"]
handler.tags = ["info"]
handler.command = ["limit", "mylimit"]

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
