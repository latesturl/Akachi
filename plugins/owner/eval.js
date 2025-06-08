import syntaxError from "syntax-error"
import util from "util"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

class CustomArray extends Array {
  constructor(...args) {
    if (typeof args[0] == "number") return super(Math.min(args[0], 10000))
    else return super(...args)
  }
}

const handler = async (m, _2) => {
  const { conn, args, body, isCreator, baileys } = _2
  if (!isCreator) return

  let _return
  let _syntax = ""
  const usedPrefix = body.startsWith("=>") ? "=>" : ">"
  const noPrefix = body.slice(usedPrefix.length).trim()
  const _text = (/^=/.test(usedPrefix) ? "return " : "") + noPrefix
  const old = m.exp * 1

  try {
    let i = 15
    const f = {
      exports: {},
    }
    const exec = new (async () => {}).constructor(
      "print",
      "m",
      "handler",
      "require",
      "conn",
      "Array",
      "process",
      "args",
      "module",
      "exports",
      "argument",
      _text,
    )
    _return = await exec.call(
      conn,
      (...args) => {
        if (--i < 1) return
        console.log(...args)
        return conn.sendMessage(m.key.remoteJid, { text: util.format(...args) }, { quoted: m })
      },
      m,
      handler,
      (await import("module")).createRequire(import.meta.url),
      conn,
      CustomArray,
      process,
      args,
      f,
      f.exports,
      [conn, _2],
    )
  } catch (e) {
    const err = syntaxError(_text, "Execution Function", {
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
    })
    if (err) _syntax = "```" + err + "```\n\n"
    _return = e
  } finally {
    m.reply(_syntax + util.format(_return))
    m.exp = old
  }
}

handler.help = ["> ", "=> "]
handler.tags = ["owner"]
handler.command = ["eval"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
