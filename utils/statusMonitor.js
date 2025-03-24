// ✅ utils/statusMonitor.js — Logs status changes to a public announcements channel
const sheets = require('./sheets');
const { BOT_DATABASE_SHEET_ID } = require('../config');
const { EmbedBuilder } = require('discord.js');

let lastStatus = null; // Stores the last known status

async function updateBotStatus(client) {
  try {
    console.log('[Status Monitor] Checking status from sheet...');

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: BOT_DATABASE_SHEET_ID,
      range: 'STATUS!A2'
    });

    const sheetStatus = res?.data?.values?.[0]?.[0]?.toLowerCase() || 'unknown';
    let activity = '❓ Unknown status!';
    let presence = 'dnd';

    if (sheetStatus === 'online') {
      activity = 'over BCSO operations.';
      presence = 'online';
    } else if (sheetStatus === 'maintenance') {
      activity = 'maintenance mode.';
      presence = 'idle';
    }

    console.log(`[Status Monitor] Sheet status: ${sheetStatus} → Presence: ${presence} | Activity: ${activity}`);

    await client.user.setPresence({
      activities: [{ name: activity, type: 3 }], // WATCHING
      status: presence,
    });

    // Log status changes in embed format
    if (lastStatus && lastStatus !== sheetStatus && ['online', 'maintenance'].includes(sheetStatus)) {
      const channel = client.channels.cache.get('1348499008363958282');
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle('🔔 Status Update')
          .setColor(sheetStatus === 'online' ? 0x00b15e : 0xffcc00)
          .setDescription(
            sheetStatus === 'online'
              ? '✅ The system is now **Online** and operational. Commands should work as intended.'
              : '🛠️ The system has entered **Maintenance Mode** please check the status page for more information you can locate it in the bots About Me section. ***Commands may not be operable during maintenance.***'
          )
          .setFooter({ text: 'BCSO Helpdesk Status', iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    }

    lastStatus = sheetStatus;
  } catch (err) {
    console.error('[Status Monitor] Failed to update presence from sheet:', err.response?.data || err.message);
  }
}

module.exports = updateBotStatus;
