import * as baileys from "@whiskeysockets/baileys"
import {
  makeWASocket,
  DisconnectReason,
  makeInMemoryStore,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  downloadMediaMessage,
  proto,
} from "@whiskeysockets/baileys"
import pino from "pino"
import { readdirSync, existsSync, mkdirSync, watchFile, unwatchFile, rmSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath, pathToFileURL } from "url"
import readline from "readline"
import chalk from "chalk"
import moment from "moment-timezone"
import qrcode from "qrcode-terminal"
import { handleIncomingCall } from "./plugins/owner/anticall.js"
import { handleCommand } from "./src/handler.js"
import { autoReactToStatus } from "./plugins/owner/randomstatusreact.js"
import { autoCheckAndClear } from "./src/sessionCleaner.js"
import { checkAndResetLimits } from "./src/limitManager.js"

const nodeVersion = Number.parseInt(process.versions.node.split(".")[0])

if (nodeVersion < 20) {
  console.error("\x1b[31m%s\x1b[0m", "╔════════════════════════════════════════════════════════╗")
  console.error("\x1b[31m%s\x1b[0m", "║                   ERROR: NODE.JS VERSION               ║")
  console.error("\x1b[31m%s\x1b[0m", "╚════════════════════════════════════════════════════════╝")
  console.error("\x1b[31m%s\x1b[0m", `[ERROR] You are using Node.js v${process.versions.node}`)
  console.error(
    "\x1b[31m%s\x1b[0m",
    `[ERROR] ${global.botName || "Bot"} requires Node.js v20 or higher to run properly`,
  )
  console.error("\x1b[31m%s\x1b[0m", "[ERROR] Please update your Node.js installation and try again")
  console.error("\x1b[31m%s\x1b[0m", "[ERROR] Visit https://nodejs.org to download the latest version")
  console.error("\x1b[31m%s\x1b[0m", "╔════════════════════════════════════════════════════════╗")
  console.error("\x1b[31m%s\x1b[0m", "║                  SHUTTING DOWN...                      ║")
  console.error("\x1b[31m%s\x1b[0m", "╚════════════════════════════════════════════════════════╝")
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
await import("./src/settings/config.js")
global.public = true

class WhatsAppBot {
  constructor() {
    this.plugins = new Map()
    this.conn = null
    this.logger = pino({ level: "silent" })
    this.rl = null
    this.phoneNumber = null
    this.isFirstConnection = true
    this.shouldRestart = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.isConnecting = false
    this.store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) })
    this.sessionCleanerInterval = null
    this.limitResetInterval = null
    this.loginMethod = null
    this.sessionPath = join(__dirname, global.sessionName || "session")
    this.usePairingCode = false
    this.pairingCodeRequested = false

    global.baileys = baileys
    global.conn = null
    global.store = this.store
  }

  createReadlineInterface() {
    if (this.rl) {
      this.rl.close()
    }
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  async askLoginMethod() {
    return new Promise((resolve) => {
      this.createReadlineInterface()
      console.log("\nChoose login method:")
      console.log("1. Pairing Code")
      console.log("2. QR Code")
      this.rl.question("Enter your choice (1/2): ", (answer) => {
        const choice = answer.trim()
        this.rl.close()
        if (choice === "1") {
          resolve("pairing")
        } else {
          resolve("qr")
        }
      })
    })
  }

  async getPhoneNumber() {
    return new Promise((resolve) => {
      this.createReadlineInterface()
      console.log("\n┌─────────────────────────────────────────────┐")
      console.log("│ Enter your WhatsApp phone number:           │")
      console.log("│ Format: 628xxxxxxxxxx (without + or spaces) │")
      console.log("└─────────────────────────────────────────────┘")
      this.rl.question("> ", (phoneNumber) => {
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, "")
        this.rl.close()
        resolve(cleanNumber)
      })
    })
  }

  logBotStartup() {
    try {
      const currentTime = moment().tz("Asia/Jakarta").format("HH:mm:ss")
      const ownerName = (global.ownerName || "Unknown").substring(0, 12)

      console.log(
        `${chalk.green("✓")} ${chalk.cyan("Bot Connected")} ${chalk.gray("|")} ${chalk.blue(currentTime)} ${chalk.gray("|")} ${chalk.magenta("v1.0.0")} ${chalk.gray("|")} ${chalk.yellow(ownerName)}`,
      )
    } catch (error) {
      console.error("Error logging startup:", error)
    }
  }

  logCommand(command, sender, success = true) {
    try {
      const status = success ? chalk.green("✓") : chalk.red("✗")
      const currentTime = moment().tz("Asia/Jakarta").format("HH:mm:ss")
      const fullSenderId = sender
      const shortCommand = command.length > 10 ? command.substring(0, 10) : command

      console.log(
        `${status} ${chalk.cyan("Command")} ${chalk.gray("|")} ${chalk.blue(currentTime)} ${chalk.gray("|")} ${chalk.yellow(`.${shortCommand}`)} ${chalk.gray("|")} ${chalk.green(fullSenderId)}`,
      )
    } catch (error) {
      console.error("Error logging command:", error)
    }
  }

  logConnectionError(error) {
    try {
      const currentTime = moment().tz("Asia/Jakarta").format("HH:mm:ss")

      console.log(
        `${chalk.red("⚠")} ${chalk.cyan("Connection Lost")} ${chalk.gray("|")} ${chalk.blue(currentTime)} ${chalk.gray("|")} ${chalk.yellow("Reconnecting...")}`,
      )
    } catch (err) {
      console.error("Error logging connection error:", err)
    }
  }

  logSessionExpired() {
    try {
      const currentTime = moment().tz("Asia/Jakarta").format("HH:mm:ss")

      console.log(
        `${chalk.red("✗")} ${chalk.cyan("Session Expired")} ${chalk.gray("|")} ${chalk.blue(currentTime)} ${chalk.gray("|")} ${chalk.yellow("Please restart to reconnect")}`,
      )
    } catch (error) {
      console.error("Error logging session expired:", error)
    }
  }

  logSessionCleaning(result) {
    try {
      const currentTime = moment().tz("Asia/Jakarta").format("HH:mm:ss")

      if (result.success) {
        console.log(
          `${chalk.green("✓")} ${chalk.cyan("Session Cleaned")} ${chalk.gray("|")} ${chalk.blue(currentTime)} ${chalk.gray("|")} ${chalk.yellow(`${result.deletedCount} files cleared`)}`,
        )
      } else {
        console.log(
          `${chalk.red("✗")} ${chalk.cyan("Session Clean Failed")} ${chalk.gray("|")} ${chalk.blue(currentTime)} ${chalk.gray("|")} ${chalk.yellow(result.message)}`,
        )
      }
    } catch (error) {
      console.error("Error logging session cleaning:", error)
    }
  }

  logLimitReset(result) {
    try {
      const currentTime = moment().tz("Asia/Jakarta").format("HH:mm:ss")

      if (result.success) {
        console.log(
          `${chalk.green("✓")} ${chalk.cyan("Limits Reset")} ${chalk.gray("|")} ${chalk.blue(currentTime)} ${chalk.gray("|")} ${chalk.yellow(`${result.resetCount} users reset`)}`,
        )
      } else {
        console.log(
          `${chalk.red("✗")} ${chalk.cyan("Limit Reset Failed")} ${chalk.gray("|")} ${chalk.blue(currentTime)} ${chalk.gray("|")} ${chalk.yellow(result.message)}`,
        )
      }
    } catch (error) {
      console.error("Error logging limit reset:", error)
    }
  }

  startSessionCleaner() {
    this.sessionCleanerInterval = setInterval(
      () => {
        const sessionPath = join(__dirname, global.sessionName)
        const result = autoCheckAndClear(sessionPath)
        if (result) {
          this.logSessionCleaning(result)
        }
      },
      60 * 60 * 1000,
    )
  }

  startLimitResetChecker() {
    this.limitResetInterval = setInterval(() => {
      const result = checkAndResetLimits()
      if (result) {
        this.logLimitReset(result)
      }
    }, 60 * 1000)
  }

  stopSessionCleaner() {
    if (this.sessionCleanerInterval) {
      clearInterval(this.sessionCleanerInterval)
      this.sessionCleanerInterval = null
    }
  }

  stopLimitResetChecker() {
    if (this.limitResetInterval) {
      clearInterval(this.limitResetInterval)
      this.limitResetInterval = null
    }
  }

  deleteSession() {
    try {
      if (existsSync(this.sessionPath)) {
        rmSync(this.sessionPath, { recursive: true, force: true })
        console.log(chalk.green("✓ Session deleted successfully"))
        return true
      }
      return false
    } catch (error) {
      console.error("Error deleting session:", error.message)
      return false
    }
  }

  async loadPlugins() {
    const pluginsPath = join(__dirname, "plugins")

    if (!existsSync(pluginsPath)) {
      console.log("Plugins directory not found, creating...")
      mkdirSync(pluginsPath, { recursive: true })
      return
    }

    const scanDirectory = async (dir) => {
      const items = readdirSync(dir, { withFileTypes: true })

      for (const item of items) {
        const fullPath = join(dir, item.name)

        if (item.isDirectory()) {
          await scanDirectory(fullPath)
        } else if (item.isFile() && item.name.endsWith(".js")) {
          try {
            const pluginUrl = pathToFileURL(fullPath).href
            const plugin = await import(pluginUrl)
            const handler = plugin.default

            if (handler && handler.command) {
              for (const cmd of handler.command) {
                this.plugins.set(cmd, handler)
              }
              const relativePath = fullPath.replace(pluginsPath + "/", "")
              console.log(`Loaded plugin: ${relativePath}`)
            }
          } catch (error) {
            const relativePath = fullPath.replace(pluginsPath + "/", "")
            console.error(`Error loading plugin ${relativePath}:`, error.message)
          }
        }
      }
    }

    try {
      await scanDirectory(pluginsPath)
      console.log(`Total loaded: ${this.plugins.size} commands`)
    } catch (error) {
      console.error("Error loading plugins:", error.message)
    }
  }

  isOwner(jid) {
    if (!jid) return false
    const phoneNumber = jid.replace(/[^0-9]/g, "")
    return global.owner.some((owner) => phoneNumber.includes(owner))
  }

  getBotRuntime() {
    const uptime = process.uptime()
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    return `${minutes}m ${seconds}s`
  }

  async downloadMedia(message) {
    try {
      return await downloadMediaMessage(
        message,
        "buffer",
        {},
        {
          logger: this.logger,
          reuploadRequest: this.conn.updateMediaMessage,
        },
      )
    } catch (error) {
      console.error("Media download error:", error)
      return null
    }
  }

  async sendMedia(jid, media, type, caption = "", quoted = null, options = {}) {
    try {
      const messageType = {
        image: { image: media },
        video: { video: media },
        audio: { audio: media },
        document: { document: media },
        sticker: { sticker: media },
      }[type] || { document: media }

      if (caption) {
        messageType[type].caption = caption
      }

      if (type === "audio") {
        messageType.audio.ptt = options.ptt || false
      }

      return await this.conn.sendMessage(jid, messageType, {
        quoted,
        ...options,
      })
    } catch (error) {
      console.error("Media send error:", error)
      return null
    }
  }

  async handleMessage(m) {
    if (!m.message) return

    if (m.key && m.key.remoteJid === "status@broadcast") {
      await autoReactToStatus(this.conn, m)
    }

    const message = m.messages[0]
    if (!message) return

    const isCreator = message.key && message.key.remoteJid ? this.isOwner(message.key.remoteJid) : false

    if (m.type === "notify" && (!message.key.fromMe || isCreator)) {
      await handleCommand({
        m,
        conn: this.conn,
        plugins: this.plugins,
        baileys,
        logCommand: this.logCommand.bind(this),
        downloadMedia: this.downloadMedia.bind(this),
        sendMedia: this.sendMedia.bind(this),
        getBotRuntime: this.getBotRuntime.bind(this),
        isOwner: this.isOwner.bind(this),
      })
    }
  }

  async autoFollowNewsletter() {
    try {
      await this.conn.newsletterFollow("120363419985594744@newsletter")
    } catch (error) {}
  }

  async startBot() {
    if (this.isConnecting) return
    this.isConnecting = true

    this.pairingCodeRequested = false

    try {
      const sessionExists = existsSync(join(this.sessionPath, "creds.json"))

      if (!sessionExists) {
        this.loginMethod = await this.askLoginMethod()

        if (this.loginMethod === "pairing") {
          this.phoneNumber = await this.getPhoneNumber()
          this.usePairingCode = true
          console.log(`\nPhone number set: ${this.phoneNumber}`)
        } else {
          this.usePairingCode = false
        }
      } else {
        this.loginMethod = "session"
        this.usePairingCode = false
        console.log("Using existing session...")
      }

      const { version } = await fetchLatestBaileysVersion()
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath)

      const conn = makeWASocket({
        version,
        auth: state,
        logger: this.logger,
        printQRInTerminal: !this.usePairingCode,
        browser: Browsers.windows("Chrome"),
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
          const msg = await this.store.loadMessage(key.remoteJid, key.id)
          return msg?.message || proto.Message.fromObject({})
        },
      })

      global.conn = conn

      conn.ev.on("creds.update", saveCreds)

      conn.ev.on("messages.upsert", async (m) => {
        await this.handleMessage(m)
      })

      this.store.bind(conn.ev)

      conn.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr && !this.usePairingCode) {
          console.log("\n" + chalk.cyan("Scan QR Code:"))
          qrcode.generate(qr, { small: true })
          console.log(chalk.yellow("Scan the QR code above with WhatsApp\n"))
        }

        if (
          this.usePairingCode &&
          !this.pairingCodeRequested &&
          connection === "connecting" &&
          !conn.authState.creds.registered
        ) {
          this.pairingCodeRequested = true
          console.log(chalk.cyan("\nRequesting pairing code..."))

          setTimeout(async () => {
            try {
              const code = await conn.requestPairingCode(this.phoneNumber)
              console.log(chalk.green(`\nPairing Code: ${code}`))
              console.log(chalk.yellow("Enter this code in WhatsApp > Linked Devices > Link a Device\n"))
            } catch (error) {
              console.error(chalk.red("Failed to get pairing code:"), error.message)
              this.pairingCodeRequested = false
            }
          }, 3000)
        }

        if (connection === "close") {
          this.isConnecting = false
          this.pairingCodeRequested = false
          this.stopSessionCleaner()
          this.stopLimitResetChecker()

          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

          if (shouldReconnect) {
            this.logConnectionError(lastDisconnect?.error)
            setTimeout(() => this.startBot(), 3000)
          } else {
            this.logSessionExpired()
            console.log("\nBot has been logged out. Please restart to reconnect.")
            process.exit(1)
          }
        } else if (connection === "open") {
          this.isConnecting = false
          this.pairingCodeRequested = false
          this.reconnectAttempts = 0
          this.logBotStartup()

          this.startSessionCleaner()

          this.startLimitResetChecker()

          if (this.rl) {
            this.rl.close()
          }

          if (this.isFirstConnection) {
            setTimeout(async () => {
              await this.autoFollowNewsletter()
            }, 5000)
            this.isFirstConnection = false
          }
        }
      })

      conn.ev.on("call", async (callData) => {
        try {
          await handleIncomingCall(conn, callData)
        } catch (error) {
          console.error("Error handling call:", error.message)
        }
      })

      this.conn = conn
    } catch (error) {
      this.isConnecting = false
      this.pairingCodeRequested = false
      console.error("Error starting bot:", error.message)
      setTimeout(() => this.startBot(), 5000)
    }
  }

  async init() {
    console.log(chalk.cyan("╔════════════════════════════════════════════╗"))
    console.log(chalk.cyan("║            STARTING WHATSAPP BOT           ║"))
    console.log(chalk.cyan("╚════════════════════════════════════════════╝"))
    await this.loadPlugins()
    try {
      await this.startBot()
    } catch (error) {
      console.error("Error starting bot:", error)
    }
  }
}

const bot = new WhatsAppBot()
bot.init().catch(console.error)

process.on("SIGINT", () => {
  bot.stopSessionCleaner()
  bot.stopLimitResetChecker()
  process.exit(0)
})

process.on("SIGTERM", () => {
  bot.stopSessionCleaner()
  bot.stopLimitResetChecker()
  process.exit(0)
})

const file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.yellowBright(`Latest File Update ${file}`))
  process.exit(0)
})
