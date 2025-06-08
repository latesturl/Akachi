import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

// Character mapping for text styling
const xStr = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  " ",
]
const yStr = Object.freeze({
  1: [
    "🅐",
    "🅑",
    "🅒",
    "🅓",
    "🅔",
    "🅕",
    "🅖",
    "🅗",
    "🅘",
    "🅙",
    "🅚",
    "🅛",
    "🅜",
    "🅝",
    "🅞",
    "🅟",
    "🅠",
    "🅡",
    "🅢",
    "🅣",
    "🅤",
    "🅥",
    "🅦",
    "🅧",
    "🅨",
    "🅩",
    "➊",
    "➋",
    "➌",
    "➍",
    "➎",
    "➏",
    "➐",
    "➑",
    "➒",
    "⓿",
    "➖",
  ],
})

/**
 * Convert text to styled characters
 * @param {string} text - Text to convert
 * @param {number} style - Style number (default: 1)
 * @returns {string} - Styled text
 */
async function style(text, style = 1) {
  const replacer = []
  xStr.map((v, i) =>
    replacer.push({
      original: v,
      convert: yStr[style][i],
    }),
  )

  const str = text.toLowerCase().split("")
  const output = []

  str.map((v) => {
    const find = replacer.find((x) => x.original == v)
    find ? output.push(find.convert) : output.push(v)
  })

  return output.join("")
}

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply("Example usage: .reactch https://whatsapp.com/channel/xxx Hello")

  const args = text.split(" ")
  if (args.length < 2) return m.reply("Incorrect format! Example: .reactch https://whatsapp.com/channel/xxx Hello")

  const url = args[0]
  const rawText = args.slice(1).join(" ")
  const emoji = await style(rawText)

  if (!url.includes("https://whatsapp.com/channel/")) {
    return m.reply("Invalid URL! Please provide a valid WhatsApp channel URL")
  }

  try {
    const result = url.split("https://whatsapp.com/channel/")[1]
    const [id, code] = result.split("/")

    const res = await conn.newsletterMetadata("invite", id)

    await conn.newsletterReactMessage(res.id, code, emoji)
    m.reply(`Reaction successfully sent to ${res.name} with code ${code} and emoji: ${emoji}`)
  } catch (error) {
    console.error("React channel error:", error)
    m.reply(`Failed to send reaction: ${error.message}`)
  }
}

handler.help = ["reactch <channel_url> <text>"]
handler.tags = ["tools"]
handler.command = ["reactch", "rch"]

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
