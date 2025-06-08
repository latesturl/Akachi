import { fileURLToPath } from "url"
import fs from "fs"
import path from "path"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, isCreator }) => {
  // Load command limits
  const cmdLimitPath = path.resolve("./lib/database/cmdlimit.json")
  let cmdLimits = {}
  try {
    if (fs.existsSync(cmdLimitPath)) {
      cmdLimits = JSON.parse(fs.readFileSync(cmdLimitPath, "utf-8"))
    }
  } catch (error) {
    console.error("Error loading command limits:", error)
  }

  // Group commands by tags
  const commandsByTag = {}
  const allCommands = []

  for (const [cmd, handler] of conn.plugins.entries()) {
    if (!handler.tags || !handler.help) continue

    const tags = Array.isArray(handler.tags) ? handler.tags : [handler.tags]
    const help = Array.isArray(handler.help) ? handler.help : [handler.help]

    for (const tag of tags) {
      if (!commandsByTag[tag]) commandsByTag[tag] = []

      for (const helpText of help) {
        const cmdName = helpText.split(" ")[0]
        const limitAmount = cmdLimits[cmdName] || 1
        const limitInfo = limitAmount > 1 ? ` (${limitAmount} limit)` : ""

        commandsByTag[tag].push({
          command: cmdName,
          help: helpText,
          limit: handler.limit || false,
          limitAmount: limitAmount,
          limitInfo: limitInfo,
        })

        allCommands.push({
          command: cmdName,
          help: helpText,
          tag: tag,
          limit: handler.limit || false,
          limitAmount: limitAmount,
          limitInfo: limitInfo,
        })
      }
    }
  }

  // If specific command is requested
  if (args[0]) {
    const cmd = args[0].toLowerCase().replace(/^\./, "")
    const command = allCommands.find((c) => c.command === cmd)

    if (command) {
      const limitStatus = command.limit ? `${command.limitAmount} limit per use` : "Free (no limit)"

      return m.reply(`
*Command: .${command.command}*
Category: ${command.tag}
Usage: ${command.help}
Limit: ${limitStatus}

${command.limit ? "This command requires limit to use." : "This command is free to use."}
${command.limitAmount > 1 ? `Each use consumes ${command.limitAmount} limit.` : ""}
      `)
    } else {
      return m.reply(`Command .${args[0]} not found.`)
    }
  }

  // Generate help message
  let helpMessage = `
*${global.botName || "Bot"} Command List*

Use .help <command> for detailed info
Example: .help ping

`

  // Sort tags alphabetically
  const sortedTags = Object.keys(commandsByTag).sort()

  for (const tag of sortedTags) {
    helpMessage += `*${tag.toUpperCase()}*\n`

    // Sort commands within each tag
    const sortedCommands = commandsByTag[tag].sort((a, b) => a.command.localeCompare(b.command))

    for (const cmd of sortedCommands) {
      helpMessage += `• .${cmd.command}${cmd.limitInfo}\n`
    }

    helpMessage += "\n"
  }

  helpMessage += `
*LIMIT INFO*
• Regular commands use 1 limit
• Some commands use more limit (shown in brackets)
• Premium users have unlimited usage
• Your limit resets every 12 hours

Type .limit to check your limit
`

  m.reply(helpMessage)
}

handler.help = ["help", "help <command>"]
handler.tags = ["info"]
handler.command = ["help", "menu", "?"]

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
