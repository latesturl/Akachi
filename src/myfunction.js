import { proto, getContentType } from "@whiskeysockets/baileys"
import chalk from "chalk"
import fs from "fs"
import axios from "axios"
import moment from "moment-timezone"
import { sizeFormatter } from "human-readable"
import util from "util"
import Jimp from "jimp"
import { fileURLToPath } from "url"
import path from "path"
import { checkAndResetIndividualUser } from "./limitManager.js"

const __filename = fileURLToPath(import.meta.url)

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000)

const generateMessageTag = (epoch) => {
  let tag = unixTimestampSeconds().toString()
  if (epoch) tag += ".--" + epoch
  return tag
}

const processTime = (timestamp, now) => {
  return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}

const getRandom = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`
}

const getBuffer = async (url, options) => {
  try {
    options = options || {}
    const res = await axios({
      method: "get",
      url,
      headers: {
        DNT: 1,
        "Upgrade-Insecure-Request": 1,
      },
      ...options,
      responseType: "arraybuffer",
    })
    return res.data
  } catch (err) {
    return err
  }
}

const fetchJson = async (url, options) => {
  try {
    options = options || {}
    const res = await axios({
      method: "GET",
      url,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
      },
      ...options,
    })
    return res.data
  } catch (err) {
    return err
  }
}

const runtime = (seconds) => {
  seconds = Number(seconds)
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : ""
  const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : ""
  const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : ""
  const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : ""
  return dDisplay + hDisplay + mDisplay + sDisplay
}

const clockString = (ms) => {
  const h = isNaN(ms) ? "--" : Math.floor(ms / 3600000)
  const m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60
  const s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60
  return [h, m, s].map((v) => v.toString().padStart(2, 0)).join(":")
}

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const isUrl = (url) => {
  return url.match(
    new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/,
      "gi",
    ),
  )
}

const getTime = (format, date) => {
  if (date) {
    return moment(date).locale("id").format(format)
  } else {
    return moment.tz("Asia/Jakarta").locale("id").format(format)
  }
}

const formatDate = (n, locale = "id") => {
  const d = new Date(n)
  return d.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  })
}

const tanggal = (numer) => {
  const myMonths = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]
  const myDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"]
  const tgl = new Date(numer)
  const day = tgl.getDate()
  const bulan = tgl.getMonth()
  const thisDay = myDays[tgl.getDay()]
  const yy = tgl.getYear()
  const year = yy < 1000 ? yy + 1900 : yy
  return `${thisDay}, ${day} - ${myMonths[bulan]} - ${year}`
}

const formatp = sizeFormatter({
  std: "JEDEC",
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
})

const jsonformat = (string) => {
  return JSON.stringify(string, null, 2)
}

const logic = (check, inp, out) => {
  if (inp.length !== out.length) throw new Error("Input and Output must have same length")
  for (const i in inp) {
    if (util.isDeepStrictEqual(check, inp[i])) return out[i]
  }
  return null
}

const generateProfilePicture = async (buffer) => {
  const jimp = await Jimp.read(buffer)
  const min = jimp.getWidth()
  const max = jimp.getHeight()
  const cropped = jimp.crop(0, 0, min, max)
  return {
    img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
    preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
  }
}

const bytesToSize = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

const getSizeMedia = (path) => {
  return new Promise((resolve, reject) => {
    if (/http/.test(path)) {
      axios.get(path).then((res) => {
        const length = Number.parseInt(res.headers["content-length"])
        const size = bytesToSize(length, 3)
        if (!isNaN(length)) resolve(size)
      })
    } else if (Buffer.isBuffer(path)) {
      const length = Buffer.byteLength(path)
      const size = bytesToSize(length, 3)
      if (!isNaN(length)) resolve(size)
    } else {
      reject("error gatau apah")
    }
  })
}

const parseMention = (text = "") => {
  return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + "@s.whatsapp.net")
}

const getGroupAdmins = (participants) => {
  const admins = []
  for (const i of participants) {
    if (i.admin === "superadmin" || i.admin === "admin") admins.push(i.id)
  }
  return admins
}

const smsg = (conn, m, store) => {
  if (!m) return m
  const M = proto.WebMessageInfo
  if (m.key) {
    m.id = m.key.id
    m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16
    m.chat = m.key.remoteJid
    m.fromMe = m.key.fromMe
    m.isGroup = m.chat.endsWith("@g.us")
    m.sender = conn.decodeJid((m.fromMe && conn.user.id) || m.participant || m.key.participant || m.chat || "")
    if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || ""
  }

  if (m.message) {
    m.mtype = getContentType(m.message)
    m.msg =
      m.mtype === "viewOnceMessage"
        ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
        : m.message[m.mtype]

    m.body =
      m.message.conversation ||
      m.msg?.caption ||
      m.msg?.text ||
      (m.mtype === "listResponseMessage" && m.msg?.singleSelectReply?.selectedRowId) ||
      (m.mtype === "buttonsResponseMessage" && m.msg?.selectedButtonId) ||
      (m.mtype === "viewOnceMessage" && m.msg?.caption) ||
      m.text

    const quoted = (m.quoted = m.msg?.contextInfo?.quotedMessage || null)
    m.mentionedJid = m.msg?.contextInfo?.mentionedJid || []

    if (m.quoted) {
      let type = Object.keys(m.quoted)[0]
      m.quoted = m.quoted[type]
      if (["productMessage"].includes(type)) {
        type = Object.keys(m.quoted)[0]
        m.quoted = m.quoted[type]
      }
      if (typeof m.quoted === "string") m.quoted = { text: m.quoted }
      m.quoted.mtype = type
      m.quoted.id = m.msg.contextInfo.stanzaId
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
      m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith("BAE5") && m.quoted.id.length === 16 : false
      m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant)
      m.quoted.fromMe = m.quoted.sender === conn.decodeJid(conn.user.id)
      m.quoted.text =
        m.quoted.text ||
        m.quoted.caption ||
        m.quoted.conversation ||
        m.quoted.contentText ||
        m.quoted.selectedDisplayText ||
        m.quoted.title ||
        ""
      m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []

      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return false
        const q = await store.loadMessage(m.chat, m.quoted.id, conn)
        return smsg(conn, q, store)
      }

      const vM = (m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id,
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {}),
      }))

      m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key })

      m.quoted.copyNForward = (jid, forceForward = false, options = {}) =>
        conn.copyNForward(jid, vM, forceForward, options)

      m.quoted.download = () => conn.downloadMediaMessage(m.quoted)
    }
  }

  if (m.msg?.url) m.download = () => conn.downloadMediaMessage(m.msg)

  m.text =
    m.msg?.text ||
    m.msg?.caption ||
    m.message?.conversation ||
    m.msg?.contentText ||
    m.msg?.selectedDisplayText ||
    m.msg?.title ||
    ""

  m.reply = (text, chatId = m.chat, options = {}) =>
    Buffer.isBuffer(text)
      ? conn.sendMedia(chatId, text, "file", "", m, { ...options })
      : conn.sendText(chatId, text, m, { ...options })

  m.copy = () => smsg(conn, M.fromObject(M.toObject(m)))

  m.copyNForward = (jid = m.chat, forceForward = false, options = {}) =>
    conn.copyNForward(jid, m, forceForward, options)

  return m
}

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${file}`))
})

const userDB = path.resolve("./lib/database/user.json")
const limitCmdDB = path.resolve("./lib/database/limitcmd.json")
const cmdLimitDB = path.resolve("./lib/database/cmdlimit.json")

const loadJSON = (file) => {
  try {
    if (!fs.existsSync(file)) {
      const dir = path.dirname(file)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      if (file.includes("user.json")) {
        fs.writeFileSync(file, "[]")
      } else if (file.includes("limitcmd.json") || file.includes("cmdlimit.json")) {
        fs.writeFileSync(file, "{}")
      }
    }
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch (error) {
    console.error(`Error loading ${file}:`, error)
    return file.includes("user.json") ? [] : {}
  }
}

const saveJSON = (file, data) => {
  try {
    const dir = path.dirname(file)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Error saving ${file}:`, error)
  }
}

const getUser = (id) => {
  const users = loadJSON(userDB)
  let user = users.find((u) => u.id === id)
  if (!user) {
    user = {
      id,
      premium: false,
      expired: 0,
      limit: global.defaultLimit || 10,
      lastReset: Date.now(),
      level: 1,
      exp: 0,
      money: 1000,
      health: 100,
      mana: 50,
      strength: 10,
      defense: 10,
      agility: 10,
      lastAdventure: 0,
      lastDaily: 0,
      inventory: {},
      equipment: {},
    }
    users.push(user)
    saveJSON(userDB, users)
  }

  const now = Date.now()

  if (user.premium && now > user.expired) {
    user.premium = false
    user.expired = 0
    user.limit = global.defaultLimit || 10
    user.lastReset = now
    saveJSON(userDB, users)
  }

  if (!user.premium || now > user.expired) {
    const wasReset = checkAndResetIndividualUser(id)
    if (wasReset) {
      const updatedUsers = loadJSON(userDB)
      user = updatedUsers.find((u) => u.id === id)
    }
  }

  return user
}

const saveUser = (user) => {
  const users = loadJSON(userDB)
  const idx = users.findIndex((u) => u.id === user.id)
  if (idx !== -1) {
    users[idx] = user
  } else {
    users.push(user)
  }
  saveJSON(userDB, users)
}

const isPremium = (id) => {
  const user = getUser(id)
  return user.premium && Date.now() < user.expired
}

const checkAndReduceLimit = (id, cmd) => {
  const users = loadJSON(userDB)
  const limitMap = loadJSON(limitCmdDB)
  const cmdLimits = loadJSON(cmdLimitDB)
  const user = getUser(id)
  const now = Date.now()

  if (user.premium && now > user.expired) {
    user.premium = false
    user.expired = 0
    user.limit = global.defaultLimit || 10
  }

  const premium = user.premium && now < user.expired
  saveUser(user)

  const shouldLimit = limitMap[cmd] === true
  if (!shouldLimit || premium) {
    return { ok: true, remaining: premium ? "∞" : user.limit, message: null }
  }

  const cmdLimitAmount = cmdLimits[cmd] || 1

  if (user.limit < cmdLimitAmount) {
    return {
      ok: false,
      remaining: user.limit,
      message: `Limit kamu tidak cukup. Command ini membutuhkan ${cmdLimitAmount} limit, tapi kamu hanya punya ${user.limit} limit.`,
    }
  }

  user.limit -= cmdLimitAmount
  saveUser(user)

  return {
    ok: true,
    remaining: user.limit,
    message:
      cmdLimitAmount > 1
        ? `Command ini menggunakan ${cmdLimitAmount} limit. Sisa limit kamu: ${user.limit}`
        : `Limit terpakai. Sisa limit kamu: ${user.limit}`,
  }
}

const addExp = (id, amount) => {
  const user = getUser(id)
  user.exp += amount

  const expNeeded = user.level * 100
  if (user.exp >= expNeeded) {
    user.level++
    user.exp -= expNeeded
    user.health += 10
    user.mana += 5
    user.strength += 2
    user.defense += 2
    user.agility += 1
    saveUser(user)
    return { levelUp: true, newLevel: user.level }
  }

  saveUser(user)
  return { levelUp: false }
}

const addMoney = (id, amount) => {
  const user = getUser(id)
  user.money += amount
  saveUser(user)
  return user.money
}

const reduceMoney = (id, amount) => {
  const user = getUser(id)
  if (user.money < amount) return false
  user.money -= amount
  saveUser(user)
  return true
}

const getCommandLimit = (cmd) => {
  try {
    const cmdLimits = loadJSON(cmdLimitDB)
    return cmdLimits[cmd] || 1
  } catch (error) {
    console.error("Error getting command limit:", error)
    return 1
  }
}

export {
  unixTimestampSeconds,
  generateMessageTag,
  processTime,
  getRandom,
  getBuffer,
  fetchJson,
  runtime,
  clockString,
  sleep,
  isUrl,
  getTime,
  formatDate,
  tanggal,
  formatp,
  jsonformat,
  logic,
  generateProfilePicture,
  bytesToSize,
  getSizeMedia,
  parseMention,
  getGroupAdmins,
  smsg,
  getUser,
  saveUser,
  isPremium,
  checkAndReduceLimit,
  addExp,
  addMoney,
  reduceMoney,
  getCommandLimit,
}
