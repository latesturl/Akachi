import { getContentType } from "@whiskeysockets/baileys"
import { isPremium as checkPremium, checkAndReduceLimit, getCommandLimit } from "./myfunction.js"

export async function handleCommand(options) {
  const { m, conn, plugins, baileys, logCommand, downloadMedia, sendMedia, getBotRuntime, isOwner } = options

  if (!m || !m.message) return

  m.mtype = getContentType(m.message)
  const body = extractMessageContent(m)
  const budy = body
  const sender = m.key.participant || m.key.remoteJid

  m.isGroup = m.key.remoteJid.endsWith("@g.us")
  m.mentionedJid = m.message[m.mtype]?.contextInfo?.mentionedJid || []

  const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net"
  const groupMetadata = m.isGroup ? await conn.groupMetadata(m.key.remoteJid).catch(() => null) : null
  const groupName = groupMetadata?.subject || ""
  const participants = m.isGroup ? groupMetadata?.participants || [] : []
  const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : []
  const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
  const isAdmins = m.isGroup ? groupAdmins.includes(sender) : false
  const groupOwner = m.isGroup ? groupMetadata?.owner : ""
  const isGroupOwner = m.isGroup ? (groupOwner ? groupOwner === sender : groupAdmins.includes(sender)) : false

  m.botNumber = botNumber
  m.groupMetadata = groupMetadata
  m.groupName = groupName
  m.participants = participants
  m.groupAdmins = groupAdmins
  m.isBotAdmins = isBotAdmins
  m.isAdmins = isAdmins
  m.groupOwner = groupOwner
  m.isGroupOwner = isGroupOwner

  const quotedMsg = m.message[m.mtype]?.contextInfo?.quotedMessage
  if (quotedMsg) {
    m.quoted = m
    m.quoted.message = quotedMsg
    m.quoted.sender = m.message[m.mtype]?.contextInfo?.participant || ""
  } else {
    m.quoted = null
  }

  const mime = m.quoted ? m.quoted.message[getContentType(m.quoted.message)]?.mimetype || "" : ""
  const qmsg = m.quoted ? m.quoted.message : null
  const isMedia = m.quoted ? /image|video|sticker|audio/.test(mime) : false

  m.body = body
  m.budy = budy
  m.mime = mime
  m.qmsg = qmsg
  m.isMedia = isMedia

  global.conn = conn
  global.m = m

  const isCreatorUser = isOwner ? isOwner(sender) : false
  m.isCreator = isCreatorUser

  m.reply = async (teks) => {
    if (Buffer.isBuffer(teks)) {
      const fileSignatures = {
        ffd8ffe0: "image",
        ffd8ffe1: "image",
        "89504e47": "image",
        47494638: "image",
        52494646: "video",
        49443303: "audio",
        25504446: "document",
        "377abcaf": "sticker",
      }

      const hex = teks.toString("hex", 0, 4)
      let mediaType = "document"

      for (const [signature, type] of Object.entries(fileSignatures)) {
        if (hex.startsWith(signature)) {
          mediaType = type
          break
        }
      }

      return sendMedia(m.key.remoteJid, teks, mediaType, "", m)
    } else {
      const botRuntime = getBotRuntime()
      const messageOptions = {
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterName: `#AkachiBot`,
            newsletterJid: `120363419985594744@newsletter`,
          },
          externalAdReply: {
            showAdAttribution: true,
            title: `#AkachiBot`,
            body: `Runtime: ${botRuntime}`,
            thumbnailUrl: `https://raw.githubusercontent.com/latesturl/LatestX-CDN/refs/heads/main/logo.jpg`,
            thumbnail: "",
            sourceUrl: "https://whatsapp.com/channel/0029VbAi8n811ulGIozTyF3x",
          },
        },
        text: teks,
      }
      return conn.sendMessage(m.key.remoteJid, messageOptions, {
        quoted: m,
        ephemeralExpiration: 999,
      })
    }
  }

  m.download = async () => {
    return await downloadMedia(m)
  }

  global.Reply = m.reply
  global.reply = m.reply
  global.download = m.download

  if (!global.public) {
    if (!m.key.fromMe && !isCreatorUser) return
  }

  if (budy.startsWith("=>") || budy.startsWith(">")) {
    if (!isCreatorUser) return
    try {
      const evalPlugin = plugins.get("eval")
      if (evalPlugin) {
        await evalPlugin(m, {
          conn: conn,
          args: [],
          body,
          baileys,
          isCreator: isCreatorUser,
        })
      }
    } catch (error) {
      console.error("Eval error:", error)
      m.reply(String(error))
    }
    return
  }

  if (budy.startsWith("$")) {
    if (!isCreatorUser) return
    try {
      const execPlugin = plugins.get("exec")
      if (execPlugin) {
        await execPlugin(m, {
          conn: conn,
          args: [],
          body,
          baileys,
          isCreator: isCreatorUser,
        })
      }
    } catch (error) {
      console.error("Exec error:", error)
      m.reply(String(error))
    }
    return
  }

  if (!budy.startsWith(global.prefix)) return

  const args = budy.slice(1).split(" ")
  const command = args[0].toLowerCase()
  const text = args.slice(1).join(" ")

  const handler = plugins.get(command)
  if (handler) {
    try {
      const isPremium = checkPremium(sender)
      const limitStatus = checkAndReduceLimit(sender, command)

      if (handler.limit || limitStatus.message) {
        if (!limitStatus.ok) return m.reply(limitStatus.message)
        if (limitStatus.message) m.reply(limitStatus.message)
      }

      const cmdLimitAmount = getCommandLimit(command)

      const messageObj = {
        ...m,
        body: body,
        budy: budy,
        text: budy,
        mime: mime,
        qmsg: qmsg,
        isMedia: isMedia,
        reply: m.reply,
        download: m.download,
        baileys,
        isCreator: isCreatorUser,
        isPremium: isPremium,
      }

      await handler(messageObj, {
        conn: conn,
        args: args.slice(1),
        text: text,
        body,
        command,
        baileys,
        downloadMedia: downloadMedia,
        sendMedia: sendMedia,
        isCreator: isCreatorUser,
        isPremium: isPremium,
        participants: participants,
        cmdLimitAmount: cmdLimitAmount,
      })
      logCommand(command, sender || m.key.remoteJid, true)
    } catch (error) {
      console.error(`Error executing command ${command}:`, error.message)
      logCommand(command, sender || m.key.remoteJid, false)
      m.reply(`❌ Error executing command: ${error.message}`)
    }
  }
}

function extractMessageContent(m) {
  if (!m || !m.message) return ""

  try {
    const messageType = getContentType(m.message)
    const messageContent = m.message[messageType]

    switch (messageType) {
      case "conversation":
        return m.message.conversation || ""

      case "extendedTextMessage":
        return messageContent?.text || ""

      case "imageMessage":
        return messageContent?.caption || "Image"

      case "videoMessage":
        return messageContent?.caption || "Video"

      case "audioMessage":
        return "Audio"

      case "stickerMessage":
        return "Sticker"

      case "documentMessage":
        const fileName = messageContent?.fileName || "Document"
        const caption = messageContent?.caption
        return caption ? `${caption}` : fileName

      case "contactMessage":
        return messageContent?.displayName || "Contact"

      case "locationMessage":
        return "Location"

      case "reactionMessage":
        return `${messageContent?.text || "👍"} Reaction`

      case "buttonsResponseMessage":
        return messageContent?.selectedButtonId || "Button Response"

      case "listResponseMessage":
        return messageContent?.singleSelectReply?.selectedRowId || "List Response"

      case "templateButtonReplyMessage":
        return messageContent?.selectedId || "Template Response"

      case "editedMessage":
        const editedMsg = messageContent?.message?.protocolMessage?.editedMessage
        if (editedMsg?.extendedTextMessage?.text) {
          return editedMsg.extendedTextMessage.text
        }
        if (editedMsg?.conversation) {
          return editedMsg.conversation
        }
        if (editedMsg?.imageMessage?.caption) {
          return editedMsg.imageMessage.caption
        }
        return "Edited Message"

      case "protocolMessage":
        if (messageContent?.type === 0) {
          return "Message Deleted"
        }
        const protoMsg = messageContent?.editedMessage
        if (protoMsg?.extendedTextMessage?.text) {
          return protoMsg.extendedTextMessage.text
        }
        if (protoMsg?.conversation) {
          return protoMsg.conversation
        }
        return "Protocol Message"

      default:
        if (messageContent?.text) return messageContent.text
        if (messageContent?.caption) return messageContent.caption
        if (messageContent?.conversation) return messageContent.conversation
        return messageType || "Unknown"
    }
  } catch (error) {
    console.error("Error extracting message content:", error)
    return "Error extracting message"
  }
}

async function getGroupAdmins(participants) {
  const admins = []
  for (const participant of participants) {
    if (participant.admin === "admin" || participant.admin === "superadmin") {
      admins.push(participant.id)
    }
  }
  return admins
}
