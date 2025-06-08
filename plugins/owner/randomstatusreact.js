import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const settingsPath = path.resolve("./lib/database/settings.json")

// Load settings
const loadSettings = () => {
  try {
    const dir = path.dirname(settingsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (!fs.existsSync(settingsPath)) {
      const defaultSettings = {
        randomStatusReact: false,
      }
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2))
      return defaultSettings
    }

    return JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
  } catch (error) {
    console.error(`Error loading settings:`, error)
    return { randomStatusReact: false }
  }
}

// Save settings
const saveSettings = (settings) => {
  try {
    const dir = path.dirname(settingsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error(`Error saving settings:`, error)
  }
}

// Get current status
const getRandomStatusReactStatus = () => {
  const settings = loadSettings()
  return settings.randomStatusReact || false
}

// Auto react to status function
const autoReactToStatus = async (conn, message) => {
  const settings = loadSettings()

  if (!settings.randomStatusReact) return

  if (message.key && message.key.remoteJid === "status@broadcast") {
    try {
      const emoji = [
        // Basic Smileys
        "😀",
        "😃",
        "😄",
        "😁",
        "😆",
        "😅",
        "🤣",
        "😂",
        "🙂",
        "🙃",
        "😉",
        "😊",
        "😇",
        "🥰",
        "😍",
        "🤩",
        "😘",
        "😗",
        "😚",
        "😙",
        "😋",
        "😛",
        "😜",
        "🤪",
        "😝",
        "🤑",
        "🤗",
        "🤭",
        "🤫",
        "🤔",
        "🤐",
        "🤨",
        "😐",
        "😑",
        "😶",
        "😏",
        "😒",
        "🙄",
        "😬",
        "🤥",
        "😌",
        "😔",
        "😪",
        "🤤",
        "😴",
        "😷",
        "🤒",
        "🤕",
        "🤢",
        "🤮",
        "🤧",
        "🥵",
        "🥶",
        "🥴",
        "😵",
        "🤯",
        "🤠",
        "🥳",
        "😎",
        "🤓",
        "🧐",
        "😕",
        "😟",
        "🙁",
        "☹️",
        "😮",
        "😯",
        "😲",
        "😳",
        "🥺",
        "😦",
        "😧",
        "😨",
        "😰",
        "😥",
        "😢",
        "😭",
        "😱",
        "😖",
        "😣",
        "😞",
        "😓",
        "😩",
        "😫",
        "🥱",

        // Flags
        "🇮🇩",
        "🇵🇸",
        "🇺🇸",
        "🇬🇧",
        "🇯🇵",
        "🇰🇷",
        "🇨🇳",
        "🇮🇳",
        "🇫🇷",
        "🇩🇪",
        "🇮🇹",
        "🇪🇸",
        "🇷🇺",
        "🇧🇷",
        "🇲🇽",
        "🇦🇺",
        "🇨🇦",
        "🇸🇬",
        "🇲🇾",
        "🇹🇭",
        "🇵🇭",
        "🇻🇳",
        "🇳🇿",
        "🇿🇦",
        "🇦🇪",
        "🇸🇦",
        "🇶🇦",
        "🇪🇬",
        "🇹🇷",
        "🇮🇷",
        "🇵🇰",
        "🇦🇫",
        "🇳🇬",
        "🇰🇪",
        "🇦🇷",
        "🇨🇱",
        "🇵🇪",
        "🇨🇴",
        "🇻🇪",
        "🇸🇪",
        "🇳🇴",
        "🇫🇮",
        "🇩🇰",
        "🇵🇱",
        "🇭🇺",
        "🇨🇿",
        "🇦🇹",
        "🇨🇭",
        "🇧🇪",
        "🇳🇱",
        "🇵🇹",
        "🇬🇷",

        // Hearts and Love
        "❤️",
        "🧡",
        "💛",
        "💚",
        "💙",
        "💜",
        "🖤",
        "🤍",
        "🤎",
        "💔",
        "❣️",
        "💕",
        "💞",
        "💓",
        "💗",
        "💖",
        "💘",
        "💝",
        "💟",

        // Hand Gestures
        "👍",
        "👎",
        "👌",
        "🤌",
        "🤏",
        "✌️",
        "🤞",
        "🤟",
        "🤘",
        "🤙",
        "👈",
        "👉",
        "👆",
        "👇",
        "☝️",
        "👋",
        "🤚",
        "🖐️",
        "✋",
        "🖖",
        "👏",
        "🙌",
        "👐",
        "🤲",
        "🙏",
        "✍️",
        "💅",
        "🤳",

        // Nature and Weather
        "🌹",
        "🌺",
        "🌸",
        "🌼",
        "🌻",
        "🌷",
        "🌱",
        "🌲",
        "🌳",
        "🌴",
        "🌵",
        "🌾",
        "🌿",
        "☘️",
        "🍀",
        "🍁",
        "🍂",
        "🍃",
        "🌍",
        "🌎",
        "🌏",
        "🌑",
        "🌒",
        "🌓",
        "🌔",
        "🌕",
        "🌖",
        "🌗",
        "🌘",
        "🌙",
        "🌚",
        "🌛",
        "🌜",
        "☀️",
        "🌝",
        "🌞",
        "⭐",
        "🌟",
        "🌠",
        "☁️",
        "⛅",
        "⛈️",
        "🌤️",
        "🌥️",
        "🌦️",
        "🌧️",
        "🌨️",
        "🌩️",
        "🌪️",
        "🌫️",
        "🌬️",
        "🌈",
        "☔",
        "⚡",
        "❄️",
        "☃️",
        "⛄",
        "🔥",
        "💧",
        "🌊",

        // Food and Drink
        "🍎",
        "🍐",
        "🍊",
        "🍋",
        "🍌",
        "🍉",
        "🍇",
        "🍓",
        "🍈",
        "🍒",
        "🍑",
        "🥭",
        "🍍",
        "🥥",
        "🥝",
        "🍅",
        "🥑",
        "🍆",
        "🥔",
        "🥕",
        "🌽",
        "🌶️",
        "🥒",
        "🥬",
        "🥦",
        "🧄",
        "🧅",
        "🍄",
        "🥜",
        "🌰",
        "🍞",
        "🥐",
        "🥖",
        "🥨",
        "🥯",
        "🥞",
        "🧇",
        "🧀",
        "🍖",
        "🍗",
        "🥩",
        "🥓",
        "🍔",
        "🍟",
        "🍕",
        "🌭",
        "🥪",
        "🌮",
        "🌯",
        "🥙",
        "🧆",
        "🥚",
        "🍳",
        "🥘",
        "🍲",
        "🥣",
        "🥗",
        "🍿",
        "🧈",
        "🧂",
        "🥫",
        "🍱",
        "🍘",
        "🍙",
        "🍚",
        "🍛",
        "🍜",
        "🍝",
        "🍠",
        "🍢",
        "🍣",
        "🍤",
        "🍥",
        "🥮",
        "🍡",
        "🥟",
        "🥠",
        "🥡",
        "🦪",
        "🍦",
        "🍧",
        "🍨",
        "🍩",
        "🍪",
        "🎂",
        "🍰",
        "🧁",
        "🥧",
        "🍫",
        "🍬",
        "🍭",
        "🍮",
        "🍯",
        "🍼",
        "🥛",
        "☕",
        "🍵",
        "🍶",
        "🍾",
        "🍷",
        "🍸",
        "🍹",
        "🍺",
        "🍻",
        "🥂",
        "🥃",
        "🥤",
        "🧃",
        "🧉",
        "🧊",
      ]

      const randomEmoji = emoji[Math.floor(Math.random() * emoji.length)]

      // Read the status message
      await conn.readMessages([message.key])

      // React to the status
      await conn.sendMessage(
        "status@broadcast",
        { react: { text: randomEmoji, key: message.key } },
        { statusJidList: [message.key.participant] },
      )

      console.log(`Auto reacted to status from ${message.key.participant} with ${randomEmoji}`)
    } catch (error) {
      console.error("Error auto reacting to status:", error.message)
    }
  }
}

const handler = async (m, { conn, args, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  const settings = loadSettings()

  if (!args[0]) {
    return m.reply(`
*Random Status React Settings*
Current status: ${settings.randomStatusReact ? "✅ Enabled" : "❌ Disabled"}

Usage: .randomstatusreact [on/off]
- on - Enable auto reaction to status
- off - Disable auto reaction to status
    `)
  }

  if (args[0].toLowerCase() === "on") {
    settings.randomStatusReact = true
    saveSettings(settings)
    m.reply("✅ Random status react has been enabled. Bot will automatically react to status updates.")
  } else if (args[0].toLowerCase() === "off") {
    settings.randomStatusReact = false
    saveSettings(settings)
    m.reply("❌ Random status react has been disabled.")
  } else {
    m.reply("Invalid option. Use 'on' or 'off'")
  }
}

handler.help = ["randomstatusreact [on/off]"]
handler.tags = ["owner"]
handler.command = ["randomstatusreact", "autoreact"]
handler.owner = true

export default handler
export { getRandomStatusReactStatus, autoReactToStatus }

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
