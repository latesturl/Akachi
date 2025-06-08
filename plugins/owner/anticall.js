import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)

let antiCallEnabled = false

const handler = async (m, { conn, args, isCreator }) => {
  if (!isCreator) return m.reply("This command can only be used by the bot owner")

  if (!args[0]) {
    return m.reply(`
*Anti-Call Settings*
Current status: ${antiCallEnabled ? "Enabled" : "Disabled"}

Usage: .anticall [on/off]
- on - Enable auto call rejection
- off - Disable auto call rejection
    `)
  }

  if (args[0].toLowerCase() === "on") {
    antiCallEnabled = true
    m.reply("✅ Anti-call has been enabled. All incoming calls will be automatically rejected.")
  } else if (args[0].toLowerCase() === "off") {
    antiCallEnabled = false
    m.reply("❌ Anti-call has been disabled. Incoming calls will not be rejected.")
  } else {
    m.reply("Invalid option. Use 'on' or 'off'")
  }
}

const handleIncomingCall = async (conn, callData) => {
  if (!antiCallEnabled) return

  try {
    if (Array.isArray(callData)) {
      for (const call of callData) {
        if (call.status === "offer") {
          await conn.rejectCall(call.id, call.from)

          const rejectMessage = `
🚫 *Call Rejected*

Your call has been automatically rejected because anti-call is enabled.

Please send a text message instead.
          `

          try {
            await conn.sendMessage(call.from, { text: rejectMessage })
          } catch (error) {
            console.log("Failed to send rejection message:", error.message)
          }

          console.log(`Call rejected from: ${call.from}`)
        }
      }
    } else if (callData.status === "offer") {
      await conn.rejectCall(callData.id, callData.from)

      const rejectMessage = `
🚫 *Call Rejected*

Your call has been automatically rejected because anti-call is enabled.

Please send a text message instead.
      `

      try {
        await conn.sendMessage(callData.from, { text: rejectMessage })
      } catch (error) {
        console.log("Failed to send rejection message:", error.message)
      }

      console.log(`Call rejected from: ${callData.from}`)
    }
  } catch (error) {
    console.error("Error rejecting call:", error.message)
  }
}

handler.help = ["anticall [on/off]"]
handler.tags = ["owner"]
handler.command = ["anticall"]
handler.owner = true

export default handler
export { antiCallEnabled, handleIncomingCall }

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Latest File Update ${file}`)
  delete global[file]
  import(`${file}?update=${Date.now()}`)
})
