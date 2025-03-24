const sheets = require('./sheets'); // same folder
const { BOT_DATABASE_SHEET_ID } = require('../config'); // one level up

async function checkBlacklist(discordId) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: BOT_DATABASE_SHEET_ID,
      range: 'BLACKLISTS!A2:B'
    });

    const rows = res.data.values || [];
    const match = rows.find(row => row[0] === discordId);
    return match ? match[1] : null; // return reason if found
  } catch (err) {
    console.error('Error checking blacklist:', err);
    return null;
  }
}

module.exports = checkBlacklist;
