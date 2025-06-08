import fetch from "node-fetch"
import util from "util"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, text }) => {
  if (!text) return m.reply("Awali *URL* dengan http:// atau https://")

  if (!/^https?:\/\//.test(text)) {
    return m.reply("Awali *URL* dengan http:// atau https://")
  }

  try {
    const response = await fetch(text)

    if (response.headers.get("content-length") > 100 * 1024 * 1024) {
      throw `Content-Length: ${response.headers.get("content-length")}`
    }

    const contentType = response.headers.get("content-type")

    if (contentType && contentType.startsWith("image/")) {
      return conn.sendMessage(m.key.remoteJid, { image: { url: text } }, { quoted: m })
    }

    if (contentType && contentType.startsWith("video/")) {
      return conn.sendMessage(m.key.remoteJid, { video: { url: text } }, { quoted: m })
    }

    if (contentType && contentType.startsWith("audio/")) {
      return conn.sendMessage(m.key.remoteJid, { audio: { url: text } }, { quoted: m })
    }

    const buffer = await response.buffer()
    let result = buffer.toString()

    try {
      result = util.format(JSON.parse(result))
    } catch (e) {
      result = buffer.toString()
    }

    return m.reply(result.slice(0, 65536))
  } catch (error) {
    console.error("Get command error:", error)
    m.reply(`Error: ${error.message}`)
  }
}

handler.help = ["get <url>"]
handler.tags = ["tools"]
handler.command = ["get"]

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
