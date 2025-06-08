import os from "os"
import chalk from "chalk"
import osUtils from "os-utils"

const formatBytes = (bytes) => {
  const sizes = ["B", "KB", "MB", "GB"]
  if (bytes === 0) return "0 B"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Number.parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + " " + sizes[i]
}

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const getCPUUsage = async () => {
  return new Promise((resolve) => {
    osUtils.cpuUsage((v) => {
      resolve((v * 100).toFixed(1))
    })
  })
}

const handler = async (m, { conn }) => {
  try {
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const memoryPercent = ((usedMemory / totalMemory) * 100).toFixed(1)

    const cpuUsage = await getCPUUsage()
    const botUptime = formatUptime(process.uptime())
    const systemUptime = formatUptime(os.uptime())

    const osInfo = `*System Information*

*Platform:* ${os.platform()} ${os.arch()}
*CPU:* ${os.cpus()[0]?.model.split(" ")[0] || "Unknown"} (${os.cpus().length} cores)
*CPU Usage:* ${cpuUsage}%
*Memory:* ${formatBytes(usedMemory)} / ${formatBytes(totalMemory)} (${memoryPercent}%)
*Bot Uptime:* ${botUptime}
*System Uptime:* ${systemUptime}`

    await m.reply(osInfo)
  } catch (error) {
    console.error(chalk.red(`Error in .os command:`), error)
    await m.reply(`⚠️ Error fetching system information`)
  }
}

handler.help = ["os"]
handler.tags = ["tools"]
handler.command = ["os", "system"]

export default handler
