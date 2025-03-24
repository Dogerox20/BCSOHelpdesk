// ✅ utils/statusMonitor.js — Adds emojis + ensures idle presence works
const sheets = require('./sheets');
const { BOT_DATABASE_SHEET_ID } = require('../config');

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
      activity = '🛡️ over the BCSO.';
      presence = 'online';
    } else if (sheetStatus === 'maintenance') {
      activity = '🔧 Undergoing maintenance!';
      presence = 'idle';
    }

    console.log(`[Status Monitor] Sheet status: ${sheetStatus} → Presence: ${presence} | Activity: Watching ${activity}`);

    await client.user.setPresence({
      activities: [{ name: `Watching ${activity}`, type: 3 }],
      status: presence,
    });
  } catch (err) {
    console.error('[Status Monitor] Failed to update presence from sheet:', err.response?.data || err.message);
  }
}

module.exports = updateBotStatus;
