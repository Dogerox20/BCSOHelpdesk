// ✅ utils/statusMonitor.js
const axios = require('axios');

const HEARTBEAT_ID = process.env.HEARTBEAT_ID;
const BETTERSTACK_API_KEY = process.env.BETTERSTACK_API_KEY;

async function updateBotStatus(client) {
  try {
    console.log('[Status Monitor] Fetching monitor status...');
    const res = await axios.get(`https://uptime.betterstack.com/api/v2/heartbeat-monitors`, {
      headers: {
        Authorization: `Bearer ${BETTERSTACK_API_KEY}`
      }
    });

    const monitor = res.data.data.find(m => m.attributes.url.includes(HEARTBEAT_ID));
    const status = monitor?.attributes?.status || 'unknown';

    let activity = 'Unknown status!';
    let type = 3; // WATCHING

    if (status === 'up') activity = 'over the BCSO.';
    else if (status === 'maintenance') activity = 'Undergoing maintenance!';

    console.log(`[Status Monitor] Status: ${status} → Setting presence to: Watching ${activity}`);

    await client.user.setPresence({
      activities: [{ name: `Watching ${activity}`, type }],
      status: 'online',
    });
  } catch (err) {
    console.error('[Status Monitor] Failed to update presence:', err.message);
  }
}

module.exports = updateBotStatus;
