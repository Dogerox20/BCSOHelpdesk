// ✅ utils/statusMonitor.js — Safer Better Stack status parsing
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

    const indicator = res?.data?.status?.indicator;
    const description = res?.data?.status?.description;

    if (!indicator) {
      console.warn('[Status Monitor] ⚠ Unexpected response from status page:', res.data);
    }

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