import { exec } from "child_process"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

const handler = async (m, { conn, args, body, isCreator }) => {
  if (!isCreator) return

  const budy = body

  exec(budy.slice(1), (err, stdout) => {
    if (err) return m.reply(`${err}`)
    if (stdout) return m.reply(stdout)
  })
}

handler.help = ["$"]
handler.tags = ["owner"]
handler.command = ["exec"]
handler.owner = true

export default handler

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
