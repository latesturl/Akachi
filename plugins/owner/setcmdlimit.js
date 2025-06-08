import { fileURLToPath } from "url"
import fs from "fs"
import path from "path"

const __filename = fileURLToPath(import.meta.url)
const cmdLimitPath = path.resolve("./lib/database/cmdlimit.json")

const handler = async (m, { conn, args, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!args[0] || !args[1]) {
    return m.reply(`
*Command Limit Configuration*

Usage: .setcmdlimit <command> <limit_amount>

Examples:
• .setcmdlimit reactchv2 20 - Set .reactchv2 to use 20 limit
• .setcmdlimit sticker 5 - Set .sticker to use 5 limit
• .setcmdlimit ping 0 - Set .ping to use 0 limit (free)

To view all command limits:
• .setcmdlimit list

To reset a command limit:
• .setcmdlimit reset <command>
    `)
  }

  // Load command limit data
  let cmdLimits = {}
  try {
    const dir = path.dirname(cmdLimitPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (fs.existsSync(cmdLimitPath)) {
      cmdLimits = JSON.parse(fs.readFileSync(cmdLimitPath, "utf-8"))
    }
  } catch (error) {
    console.error("Error loading command limits:", error)
    return m.reply(`Error loading command limits: ${error.message}`)
  }

  // Handle list command
  if (args[0].toLowerCase() === "list") {
    const commands = Object.keys(cmdLimits)
    if (commands.length === 0) {
      return m.reply("No command limits have been set yet.")
    }

    const limitList = commands
      .sort((a, b) => cmdLimits[b] - cmdLimits[a])
      .map((cmd) => `• .${cmd}: ${cmdLimits[cmd]} limit`)
      .join("\n")

    return m.reply(`
*Command Limit List*

${limitList}

To set a command limit:
.setcmdlimit <command> <limit_amount>
    `)
  }

  // Handle reset command
  if (args[0].toLowerCase() === "reset") {
    if (!args[1]) return m.reply("Please specify which command to reset")

    const cmdName = args[1].toLowerCase().replace(/^\./, "")

    if (!cmdLimits[cmdName]) {
      return m.reply(`Command .${cmdName} doesn't have a custom limit set`)
    }

    delete cmdLimits[cmdName]

    try {
      fs.writeFileSync(cmdLimitPath, JSON.stringify(cmdLimits, null, 2))
      return m.reply(`✅ Limit for command .${cmdName} has been reset to default`)
    } catch (error) {
      console.error("Error saving command limits:", error)
      return m.reply(`Error saving command limits: ${error.message}`)
    }
  }

  // Set command limit
  const cmdName = args[0].toLowerCase().replace(/^\./, "")
  const limitAmount = Number.parseInt(args[1])

  if (isNaN(limitAmount) || limitAmount < 0) {
    return m.reply("Limit amount must be a valid non-negative number")
  }

  cmdLimits[cmdName] = limitAmount

  try {
    fs.writeFileSync(cmdLimitPath, JSON.stringify(cmdLimits, null, 2))

    if (limitAmount === 0) {
      m.reply(`✅ Command .${cmdName} has been set to free (0 limit)`)
    } else {
      m.reply(`✅ Command .${cmdName} will now use ${limitAmount} limit per use`)
    }
  } catch (error) {
    console.error("Error saving command limits:", error)
    m.reply(`Error saving command limits: ${error.message}`)
  }
}

handler.help = ["setcmdlimit <command> <limit_amount>"]
handler.tags = ["owner"]
handler.command = ["setcmdlimit", "cmdlimit"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
