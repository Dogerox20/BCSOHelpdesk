// ✅ utils/statusMonitor.js (debugging heartbeat matches)
const axios = require('axios');

const HEARTBEAT_URL_PART = process.env.HEARTBEAT_URL_PART;
const BETTERSTACK_API_KEY = process.env.BETTERSTACK_API_KEY;

async function updateBotStatus(client) {
  try {
    console.log('[Status Monitor] Checking heartbeat status...');

    const res = await axios.get('https://uptime.betterstack.com/api/v1/heartbeats', {
      headers: {
        Authorization: `Bearer ${BETTERSTACK_API_KEY}`
      }
    });

    const heartbeats = res.data.data;

    console.log('[DEBUG] Available Heartbeats:');
    heartbeats.forEach(hb => {
      console.log(`→ ID: ${hb.id} | URL: ${hb.attributes.url}`);
    });

    const heartbeat = heartbeats.find(hb =>
      hb.attributes.url.includes(HEARTBEAT_URL_PART)
    );

    if (!heartbeat) {
      console.log(`[Status Monitor] ❌ No heartbeat found matching URL part: ${HEARTBEAT_URL_PART}`);
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
