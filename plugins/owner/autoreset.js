import { fileURLToPath } from "url"
import fs from "fs"
import {
  setAutoResetStatus,
  setResetInterval,
  getAutoResetStatus,
  getResetIntervalHours,
  getTimeUntilNextReset,
  getLastGlobalReset,
  formatTimestamp,
  manualResetAllLimits,
} from "../../src/limitManager.js"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!args[0]) {
    const autoReset = getAutoResetStatus()
    const resetInterval = getResetIntervalHours()
    const timeUntil = getTimeUntilNextReset()
    const lastReset = formatTimestamp(getLastGlobalReset())

    return m.reply(`
*Auto Reset Limit Settings*

Status: ${autoReset ? "✅ Enabled" : "❌ Disabled"}
Interval: Every ${resetInterval} hours
Last Reset: ${lastReset}
Next Reset: ${timeUntil}

Usage:
• .autoreset on - Enable auto reset
• .autoreset off - Disable auto reset
• .autoreset interval <hours> - Set reset interval
• .autoreset now - Force reset all limits now
    `)
  }

  const option = args[0].toLowerCase()

  switch (option) {
    case "on":
      setAutoResetStatus(true)
      m.reply(`
✅ Auto reset limit has been enabled

Limits will be automatically reset every ${getResetIntervalHours()} hours
Next reset: ${getTimeUntilNextReset()}
      `)
      break

    case "off":
      setAutoResetStatus(false)
      m.reply(`
❌ Auto reset limit has been disabled

Limits will no longer be automatically reset
You can still manually reset using: .autoreset now
      `)
      break

    case "interval":
      if (!args[1] || isNaN(args[1]) || Number(args[1]) <= 0) {
        return m.reply("Please provide a valid positive number for hours")
      }

      const hours = Number(args[1])
      if (hours < 1 || hours > 168) {
        return m.reply("Interval must be between 1 and 168 hours (1 week)")
      }

      setResetInterval(hours)
      m.reply(`
⏱️ Reset interval has been set to ${hours} hours

Next reset: ${getTimeUntilNextReset()}
      `)
      break

    case "now":
      const result = manualResetAllLimits()
      if (result.success) {
        m.reply(`
✅ Successfully reset limits

Reset ${result.resetCount} users to default limit (${global.defaultLimit || 10})
Reset time: ${formatTimestamp(result.timestamp)}
Next auto reset: ${getTimeUntilNextReset()}
        `)
      } else {
        m.reply(`
❌ Failed to reset limits

Error: ${result.message}
        `)
      }
      break

    default:
      m.reply(`
Invalid option!

Available options:
• on - Enable auto reset
• off - Disable auto reset
• interval <hours> - Set reset interval
• now - Force reset all limits now
      `)
      break
  }
}

handler.help = ["autoreset [on/off/interval/now]"]
handler.tags = ["owner"]
handler.command = ["autoreset"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
