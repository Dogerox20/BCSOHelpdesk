// ✅ utils/statusMonitor.js
const axios = require('axios');

const HEARTBEAT_ID = process.env.HEARTBEAT_ID; // Example: 'ssbWih5gwfxAHuBZQA18ZRw5'
const BETTERSTACK_API_KEY = process.env.BETTERSTACK_API_KEY;

async function updateBotStatus(client) {
  try {
    const res = await axios.get(`https://uptime.betterstack.com/api/v2/heartbeat-monitors`, {
      headers: {
        Authorization: `Bearer ${BETTERSTACK_API_KEY}`
      }
    });

    const monitor = res.data.data.find(m => m.attributes.url.includes(HEARTBEAT_ID));
    const status = monitor?.attributes?.status || 'unknown';

    let activity = 'Unknown status!';
    let type = 3; // WATCHING

    if (status === 'up') {
      activity = 'over the LSPD.';
    } else if (status === 'maintenance') {
      activity = 'Undergoing maintenance!';
    }

    await client.user.setPresence({
      activities: [{ name: activity, type }],
      status: 'online',
    });
  } catch (err) {
    console.error('❌ Failed to fetch Better Stack status:', err.message);
  }
}

module.exports = updateBotStatus;
