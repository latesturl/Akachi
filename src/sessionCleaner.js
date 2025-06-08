import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const settingsPath = path.resolve("./lib/database/settings.json")

const loadSettings = () => {
  try {
    const dir = path.dirname(settingsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (!fs.existsSync(settingsPath)) {
      const defaultSettings = {
        autoClearSession: false,
        lastClearTime: 0,
      }
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2))
      return defaultSettings
    }

    return JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
  } catch (error) {
    console.error("Error loading session cleaner settings:", error)
    return { autoClearSession: false, lastClearTime: 0 }
  }
}

const saveSettings = (settings) => {
  try {
    const dir = path.dirname(settingsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error("Error saving session cleaner settings:", error)
  }
}

const getAutoClearSessionStatus = () => {
  const settings = loadSettings()
  return settings.autoClearSession || false
}

const clearSessionFiles = (sessionPath) => {
  try {
    if (!fs.existsSync(sessionPath)) {
      return { success: false, message: "Session directory not found" }
    }

    const files = fs.readdirSync(sessionPath)
    let deletedCount = 0
    const errors = []

    for (const file of files) {
      if (file === "creds.json") continue

      const filePath = path.join(sessionPath, file)
      try {
        const stat = fs.statSync(filePath)
        if (stat.isFile()) {
          fs.unlinkSync(filePath)
          deletedCount++
        } else if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true })
          deletedCount++
        }
      } catch (error) {
        errors.push(`Failed to delete ${file}: ${error.message}`)
      }
    }

    return {
      success: true,
      deletedCount,
      errors: errors.length > 0 ? errors : null,
      message: `Successfully cleared ${deletedCount} session files`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Error clearing session: ${error.message}`,
    }
  }
}

const shouldClearSession = () => {
  const settings = loadSettings()
  if (!settings.autoClearSession) return false

  const now = Date.now()
  const lastClear = settings.lastClearTime || 0
  const twentyFourHours = 24 * 60 * 60 * 1000

  return now - lastClear >= twentyFourHours
}

const autoCheckAndClear = (sessionPath) => {
  if (!shouldClearSession()) return null

  const result = clearSessionFiles(sessionPath)
  if (result.success) {
    const settings = loadSettings()
    settings.lastClearTime = Date.now()
    saveSettings(settings)
  }

  return result
}

const getTimeUntilNextClear = () => {
  const settings = loadSettings()
  if (!settings.autoClearSession) return null

  const now = Date.now()
  const lastClear = settings.lastClearTime || 0
  const twentyFourHours = 24 * 60 * 60 * 1000
  const nextClear = lastClear + twentyFourHours

  if (now >= nextClear) return "Ready to clear"

  const remaining = nextClear - now
  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))

  return `${hours}h ${minutes}m`
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

const getSessionSize = (sessionPath) => {
  try {
    if (!fs.existsSync(sessionPath)) return "0 B"

    let totalSize = 0
    const files = fs.readdirSync(sessionPath)

    for (const file of files) {
      const filePath = path.join(sessionPath, file)
      const stat = fs.statSync(filePath)
      if (stat.isFile()) {
        totalSize += stat.size
      } else if (stat.isDirectory()) {
        const dirSize = getDirSize(filePath)
        totalSize += dirSize
      }
    }

    return formatFileSize(totalSize)
  } catch (error) {
    return "Unknown"
  }
}

const getDirSize = (dirPath) => {
  let size = 0
  try {
    const files = fs.readdirSync(dirPath)
    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const stat = fs.statSync(filePath)
      if (stat.isFile()) {
        size += stat.size
      } else if (stat.isDirectory()) {
        size += getDirSize(filePath)
      }
    }
  } catch (error) {}
  return size
}

export {
  loadSettings,
  saveSettings,
  getAutoClearSessionStatus,
  clearSessionFiles,
  shouldClearSession,
  autoCheckAndClear,
  getTimeUntilNextClear,
  getSessionSize,
}
