const handler = async (m, { conn }) => {
  global.public = true
  m.reply("Successfully changed to Public Mode\nBot will respond to everyone")
}

handler.help = ["public"]
handler.tags = ["owner"]
handler.command = ["public"]
handler.owner = true

export default handler
