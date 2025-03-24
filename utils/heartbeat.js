// ✅ utils/heartbeat.js
const axios = require('axios');

const HEARTBEAT_URL = 'https://uptime.betterstack.com/api/v1/heartbeat/ssbWih5gwfxAHuBZQA18ZRw5'; // Replace with your heartbeat URL

async function sendHeartbeat() {
  try {
    await axios.get(HEARTBEAT_URL);
    console.log('💓 Better Stack heartbeat sent successfully.');
  } catch (error) {
    console.error('❌ Failed to send Better Stack heartbeat:', error.message);
  }
}

module.exports = sendHeartbeat;
