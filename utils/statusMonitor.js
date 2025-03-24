// ✅ utils/statusMonitor.js — Finalized using Better Stack official status.json
const axios = require('axios');

const STATUS_PAGE_URL = 'https://status.betterstack.com/api/v2/status.json';

async function updateBotStatus(client) {
  try {
    console.log('[Status Monitor] Fetching official Better Stack status...');

    const res = await axios.get(STATUS_PAGE_URL);
    const indicator = res?.data?.status?.indicator;

    let activity = 'Unknown status!';
    let type = 3; // WATCHING

    if (indicator === 'none' || indicator === 'up') activity = 'over the BCSO.';
    else if (indicator === 'maintenance') activity = 'Undergoing maintenance!';

    console.log(`[Status Monitor] Status indicator: ${indicator || 'undefined'} → Setting presence: Watching ${activity}`);

    await client.user.setPresence({
      activities: [{ name: `Watching ${activity}`, type }],
      status: 'online',
    });

  } catch (err) {
    console.error('[Status Monitor] Failed to update presence:', err.response?.data || err.message);
  }
}

module.exports = updateBotStatus;
