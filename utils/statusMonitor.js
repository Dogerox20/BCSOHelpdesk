// ✅ utils/statusMonitor.js (for heartbeat monitor)
const axios = require('axios');

const HEARTBEAT_ID = process.env.HEARTBEAT_ID;
const BETTERSTACK_API_KEY = process.env.BETTERSTACK_API_KEY;

async function updateBotStatus(client) {
  try {
    console.log('[Status Monitor] Checking heartbeat status...');
    const res = await axios.get('https://uptime.betterstack.com/api/v1/heartbeats', {
      headers: {
        Authorization: `Bearer ${BETTERSTACK_API_KEY}`
      }
    });

    const heartbeat = res.data.data.find(hb => hb.id === HEARTBEAT_ID);

    if (!heartbeat) {
      console.log(`[Status Monitor] ❌ Heartbeat with ID '${HEARTBEAT_ID}' not found.`);
      return;
    }

    const lastPing = new Date(heartbeat.attributes.last_ping_at);
    const now = new Date();
    const diffMs = now - lastPing;
    const diffMinutes = diffMs / (1000 * 60);

    let activity = 'Unknown status!';
    let type = 3; // WATCHING

    if (diffMinutes < 2) activity = 'over the BCSO.';
    else activity = 'Undergoing maintenance!';

    console.log(`[Status Monitor] Last ping ${Math.round(diffMinutes)}m ago → Setting status: Watching ${activity}`);

    await client.user.setPresence({
      activities: [{ name: `Watching ${activity}`, type }],
      status: 'online',
    });
  } catch (err) {
    console.error('[Status Monitor] Failed to update presence:', err.message);
  }
}

module.exports = updateBotStatus;
