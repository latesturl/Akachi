import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!args[0]) {
    return m.reply(`
*Limit Configuration*

Current Settings:
• Default Limit (Regular Users): ${global.defaultLimit || 10}
• Premium Default Limit: ${global.premiumDefaultLimit || 100}
• Max Add Limit: ${global.maxAddLimit || 100}

Usage: .premconfig [option] [value]

Options:
• defaultlimit <number> - Set default limit for regular users
• premiumlimit <number> - Set default limit for premium users
• maxaddlimit <number> - Set maximum limit that can be added at once
• info - Show current configuration

Examples:
• .premconfig defaultlimit 15
• .premconfig premiumlimit 200
• .premconfig maxaddlimit 50
    `)
  }

  const option = args[0].toLowerCase()
  const value = Number.parseInt(args[1])

  switch (option) {
    case "defaultlimit":
      if (isNaN(value) || value <= 0) {
        return m.reply("Please enter a valid positive number for default limit")
      }
      if (value > 100) {
        return m.reply("❌ Default limit for regular users cannot exceed 100")
      }

      global.defaultLimit = value
      m.reply(`✅ Default limit for regular users set to ${value}
      
📝 Note: This will apply to:
• New users
• Users when their limit resets (every 12 hours)
• Users when their premium expires`)
      break

    case "premiumlimit":
      if (isNaN(value) || value <= 0) {
        return m.reply("Please enter a valid positive number for premium limit")
      }
      if (value > 1000) {
        return m.reply("❌ Premium default limit cannot exceed 1000")
      }

      global.premiumDefaultLimit = value
      m.reply(`✅ Premium default limit set to ${value}
      
📝 Note: This will apply to new premium users`)
      break

    case "maxaddlimit":
      if (isNaN(value) || value <= 0) {
        return m.reply("Please enter a valid positive number for max add limit")
      }
      if (value > 500) {
        return m.reply("❌ Max add limit cannot exceed 500")
      }

      global.maxAddLimit = value
      m.reply(`✅ Maximum add limit set to ${value}
      
📝 Note: This limits how much limit can be added with .addlimit command`)
      break

    case "info":
      const info = `
*Limit Configuration Info*

🔧 Current Settings:
• Default Limit (Regular): ${global.defaultLimit || 10}
• Premium Default Limit: ${global.premiumDefaultLimit || 100}
• Max Add Limit: ${global.maxAddLimit || 100}

📝 Description:
• Default Limit: Limit given to regular users (resets every 12 hours)
• Premium Default Limit: Default limit given to new premium users
• Max Add Limit: Maximum limit that can be added with .addlimit command

⚙️ Limits:
• Default Limit: 1-100
• Premium Default Limit: 1-1000
• Max Add Limit: 1-500

🔄 Auto Reset:
• Regular users: Every 12 hours to Default Limit
• Premium users: No auto reset (unlimited until expired)
      `
      m.reply(info)
      break

    default:
      m.reply(`
❌ Invalid option!

Available options:
• defaultlimit <number> - For regular users
• premiumlimit <number> - For premium users
• maxaddlimit <number> - Max add limit
• info - Show configuration
      `)
      break
  }
}

handler.help = ["premconfig [option] [value]"]
handler.tags = ["owner"]
handler.command = ["premconfig", "premiumconfig", "limitconfig"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
