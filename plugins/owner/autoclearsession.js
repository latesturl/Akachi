import {
  loadSettings,
  saveSettings,
  clearSessionFiles,
  getTimeUntilNextClear,
  getSessionSize,
} from "../../src/sessionCleaner.js"
import { fileURLToPath } from "url"
import fs from "fs"
import path from "path"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  const settings = loadSettings()
  const sessionPath = path.resolve("./session")

  if (!args[0]) {
    const status = settings.autoClearSession ? "Enabled" : "Disabled"
    const nextClear = getTimeUntilNextClear()
    const sessionSize = getSessionSize(sessionPath)
    const lastClearDate = settings.lastClearTime
      ? new Date(settings.lastClearTime).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "Never"

    return m.reply(`
Auto Clear Session Settings

Status: ${status}
Session Size: ${sessionSize}
Last Clear: ${lastClearDate}
Next Clear: ${nextClear || "Disabled"}

Usage: .autoclearsession [option]
Options:
  on     Enable auto clear session
  off    Disable auto clear session
  clear  Manually clear session now
  info   Show detailed information

Note: Auto clear runs every 24 hours and preserves login credentials
    `)
  }

  const option = args[0].toLowerCase()

  switch (option) {
    case "on":
      settings.autoClearSession = true
      if (!settings.lastClearTime) {
        settings.lastClearTime = Date.now()
      }
      saveSettings(settings)
      m.reply(`
Auto Clear Session Enabled

The session will be automatically cleared every 24 hours
Login credentials will be preserved to keep you connected
Next clear: ${getTimeUntilNextClear()}
      `)
      break

    case "off":
      settings.autoClearSession = false
      saveSettings(settings)
      m.reply(`
Auto Clear Session Disabled

Session files will no longer be automatically cleared
You can still manually clear using: .autoclearsession clear
      `)
      break

    case "clear":
      const result = clearSessionFiles(sessionPath)
      if (result.success) {
        settings.lastClearTime = Date.now()
        saveSettings(settings)
        const newSize = getSessionSize(sessionPath)
        m.reply(`
Session Cleared Successfully

Files cleared: ${result.deletedCount}
New session size: ${newSize}
Login credentials preserved

${result.errors ? `Warnings:\n${result.errors.join("\n")}` : ""}
        `)
      } else {
        m.reply(`
Session Clear Failed

Error: ${result.message}
        `)
      }
      break

    case "info":
      const sessionExists = fs.existsSync(sessionPath)
      const fileCount = sessionExists ? fs.readdirSync(sessionPath).length : 0
      const credsExists = sessionExists ? fs.existsSync(path.join(sessionPath, "creds.json")) : false

      m.reply(`
Session Information

Directory: ${sessionPath}
Exists: ${sessionExists ? "Yes" : "No"}
Total Files: ${fileCount}
Credentials: ${credsExists ? "Present" : "Missing"}
Size: ${getSessionSize(sessionPath)}

Auto Clear Status: ${settings.autoClearSession ? "Enabled" : "Disabled"}
Last Clear: ${
        settings.lastClearTime
          ? new Date(settings.lastClearTime).toLocaleString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "Never"
      }
Next Clear: ${getTimeUntilNextClear() || "Disabled"}

Files that will be preserved:
- creds.json (login credentials)

Files that will be cleared:
- All other session files and directories
      `)
      break

    default:
      m.reply(`
Invalid Option

Available options:
  on     Enable auto clear session
  off    Disable auto clear session
  clear  Manually clear session now
  info   Show detailed information
      `)
      break
  }
}

handler.help = ["autoclearsession [on/off/clear/info]"]
handler.tags = ["owner"]
handler.command = ["autoclearsession", "acs"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
