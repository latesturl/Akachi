const handler = async (m, { conn }) => {
  global.public = false
  m.reply("Successfully changed to Self Mode\nBot will only respond to owner")
}

handler.help = ["self"]
handler.tags = ["owner"]
handler.command = ["self"]
handler.owner = true

export default handler
