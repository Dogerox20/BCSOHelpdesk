// ✅ utils/statusMonitor.js — Fix deputy count fallback + log value
const sheets = require('./sheets');
const { BOT_DATABASE_SHEET_ID, SHEET_ID } = require('../config');
const { EmbedBuilder } = require('discord.js');

let lastStatus = null;

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
      // Fetch number of deputies from P16 in General-Membership
      
      const deputyRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'General-Membership!P16'
      });

      
      let deputyCount = deputyRes?.data?.values?.[0]?.[0]?.trim();
      console.log('[Status Monitor] Deputy Count from P16:', deputyCount);

      if (!deputyCount || isNaN(deputyCount)) deputyCount = '0';

      activity = `over ${deputyCount} deputies.`;
      presence = 'online';
    } else if (sheetStatus === 'maintenance') {
      activity = 'over maintenance operations.';
      presence = 'idle';
    }

    console.log(`[Status Monitor] Sheet status: ${sheetStatus} → Presence: ${presence} | Activity: ${activity}`);

    await client.user.setPresence({
      activities: [{ name: `Watching ${activity}`, type: 3 }],
      status: presence,
    });

    // Log status changes
    if (lastStatus && lastStatus !== sheetStatus && ['online', 'maintenance'].includes(sheetStatus)) {
      const channel = client.channels.cache.get('1348499008363958282');
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle('🔔 Status Update')
          .setColor(sheetStatus === 'online' ? 0x00b15e : 0xffcc00)
          .setDescription(
            sheetStatus === 'online'
              ? '✅ The system is now Online and operational. Commands should work as intended.'
              : '🛠️ The system has entered Maintenance Mode. Please check the status page for more information — you can locate it in the bots About Me section.'
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
