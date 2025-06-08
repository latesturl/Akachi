import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const limitSettingsPath = path.resolve("./lib/database/limitsettings.json")
const userDB = path.resolve("./lib/database/user.json")

const loadLimitSettings = () => {
  try {
    const dir = path.dirname(limitSettingsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (!fs.existsSync(limitSettingsPath)) {
      const defaultSettings = {
        autoReset: global.autoResetLimit || true,
        resetInterval: global.resetLimitInterval || 24 * 60 * 60 * 1000,
        lastGlobalReset: Date.now(),
      }
      fs.writeFileSync(limitSettingsPath, JSON.stringify(defaultSettings, null, 2))
      return defaultSettings
    }

    return JSON.parse(fs.readFileSync(limitSettingsPath, "utf-8"))
  } catch (error) {
    console.error("Error loading limit settings:", error)
    return {
      autoReset: global.autoResetLimit || true,
      resetInterval: global.resetLimitInterval || 24 * 60 * 60 * 1000,
      lastGlobalReset: Date.now(),
    }
  }
}

const saveLimitSettings = (settings) => {
  try {
    const dir = path.dirname(limitSettingsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(limitSettingsPath, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error("Error saving limit settings:", error)
  }
}

const shouldResetLimits = () => {
  const settings = loadLimitSettings()
  if (!settings.autoReset) return false

  const now = Date.now()
  const timeSinceLastReset = now - settings.lastGlobalReset
  return timeSinceLastReset >= settings.resetInterval
}

const resetAllLimits = () => {
  try {
    if (!fs.existsSync(userDB)) {
      return { success: false, message: "User database not found" }
    }

    const users = JSON.parse(fs.readFileSync(userDB, "utf-8"))
    let resetCount = 0

    for (const user of users) {
      if (!user.premium || (user.premium && Date.now() > user.expired)) {
        user.limit = global.defaultLimit || 10
        resetCount++
      }
    }

    fs.writeFileSync(userDB, JSON.stringify(users, null, 2))

    const settings = loadLimitSettings()
    settings.lastGlobalReset = Date.now()
    saveLimitSettings(settings)

    return {
      success: true,
      message: `Reset limit for ${resetCount} users`,
      resetCount,
      timestamp: settings.lastGlobalReset,
    }
  } catch (error) {
    console.error("Error resetting limits:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

const getTimeUntilNextReset = () => {
  const settings = loadLimitSettings()
  if (!settings.autoReset) return "Auto reset is disabled"

  const now = Date.now()
  const nextReset = settings.lastGlobalReset + settings.resetInterval
  const timeLeft = nextReset - now

  if (timeLeft <= 0) return "Ready to reset"

  const hours = Math.floor(timeLeft / (60 * 60 * 1000))
  const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))
  const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000)

  return `${hours}h ${minutes}m ${seconds}s`
}

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const checkAndResetLimits = () => {
  if (shouldResetLimits()) {
    const result = resetAllLimits()
    return result
  }
  return null
}

const setAutoResetStatus = (status) => {
  const settings = loadLimitSettings()
  settings.autoReset = status
  saveLimitSettings(settings)
  return settings
}

const setResetInterval = (hours) => {
  const settings = loadLimitSettings()
  settings.resetInterval = hours * 60 * 60 * 1000
  saveLimitSettings(settings)
  return settings
}

const getAutoResetStatus = () => {
  const settings = loadLimitSettings()
  return settings.autoReset
}

const getResetIntervalHours = () => {
  const settings = loadLimitSettings()
  return settings.resetInterval / (60 * 60 * 1000)
}

const getLastGlobalReset = () => {
  const settings = loadLimitSettings()
  return settings.lastGlobalReset
}

const manualResetAllLimits = () => {
  const result = resetAllLimits()
  return result
}

const shouldResetIndividualUser = (user) => {
  if (user.premium && Date.now() < user.expired) return false

  const now = Date.now()
  const timeSinceLastReset = now - (user.lastReset || 0)
  const individualResetInterval = 12 * 60 * 60 * 1000

  return timeSinceLastReset >= individualResetInterval
}

const resetIndividualUserLimit = (user) => {
  if (shouldResetIndividualUser(user)) {
    user.limit = global.defaultLimit || 10
    user.lastReset = Date.now()
    return true
  }
  return false
}

const checkAndResetIndividualUser = (id) => {
  try {
    if (!fs.existsSync(userDB)) return false

    const users = JSON.parse(fs.readFileSync(userDB, "utf-8"))
    const userIndex = users.findIndex((u) => u.id === id)

    if (userIndex === -1) return false

    const user = users[userIndex]
    const wasReset = resetIndividualUserLimit(user)

    if (wasReset) {
      users[userIndex] = user
      fs.writeFileSync(userDB, JSON.stringify(users, null, 2))
      return true
    }

    return false
  } catch (error) {
    console.error("Error checking individual user reset:", error)
    return false
  }
}

export {
  loadLimitSettings,
  saveLimitSettings,
  shouldResetLimits,
  resetAllLimits,
  getTimeUntilNextReset,
  formatTimestamp,
  checkAndResetLimits,
  setAutoResetStatus,
  setResetInterval,
  getAutoResetStatus,
  getResetIntervalHours,
  getLastGlobalReset,
  manualResetAllLimits,
  shouldResetIndividualUser,
  resetIndividualUserLimit,
  checkAndResetIndividualUser,
}
