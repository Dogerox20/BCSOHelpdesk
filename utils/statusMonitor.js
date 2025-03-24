// ✅ utils/statusMonitor.js — Updated with public status page monitoring
const axios = require('axios');

const STATUS_PAGE_URL = process.env.STATUS_PAGE_URL;
const BETTERSTACK_API_KEY = process.env.BETTERSTACK_API_KEY;

async function updateBotStatus(client) {
  try {
    console.log('[Status Monitor] Fetching status from Better Stack status page...');

    const res = await axios.get(STATUS_PAGE_URL, {
      headers: {
        Authorization: `Bearer ${BETTERSTACK_API_KEY}`
      }
    });

    const status = res.data.status.indicator;
    let activity = 'Unknown status!';
    let type = 3; // WATCHING

    if (status === 'none' || status === 'up') activity = 'over the BCSO.';
    else if (status === 'maintenance') activity = 'Undergoing maintenance!';

    console.log(`[Status Monitor] Status indicator: ${status} → Setting presence: Watching ${activity}`);

    await client.user.setPresence({
      activities: [{ name: `Watching ${activity}`, type }],
      status: 'online',
    });
  } catch (err) {
    console.error('[Status Monitor] Failed to update presence:', err.response?.data || err.message);
  }
}

module.exports = updateBotStatus;