import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

// Character mapping for text styling v3
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
    "🅰",
    "🅱",
    "🅲",
    "🅳",
    "🅴",
    "🅵",
    "🅶",
    "🅷",
    "🅸",
    "🅹",
    "🅺",
    "🅻",
    "🅼",
    "🅽",
    "🅾",
    "🅿",
    "🆀",
    "🆁",
    "🆂",
    "🆃",
    "🆄",
    "🆅",
    "🆆",
    "🆇",
    "🆈",
    "🆉",
    "①",
    "②",
    "③",
    "④",
    "⑤",
    "⑥",
    "⑦",
    "⑧",
    "⑨",
    "⓪",
    "➖",
  ],
})

/**
 * Convert text to styled characters v3
 * @param {string} text - Text to convert
 * @param {number} style - Style number (default: 1)
 * @returns {string} - Styled text
 */
async function styleV3(text, style = 1) {
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
  if (!text) return m.reply("Example usage: .reactchv3 https://whatsapp.com/channel/xxx Hello")

  const args = text.split(" ")
  if (args.length < 2) return m.reply("Incorrect format! Example: .reactchv3 https://whatsapp.com/channel/xxx Hello")

  const url = args[0]
  const rawText = args.slice(1).join(" ")
  const emoji = await styleV3(rawText)

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
    console.error("React channel v3 error:", error)
    m.reply(`Failed to send reaction: ${error.message}`)
  }
}

handler.help = ["reactchv3 <channel_url> <text>"]
handler.tags = ["tools"]
handler.command = ["reactchv3", "rchv3"]

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
