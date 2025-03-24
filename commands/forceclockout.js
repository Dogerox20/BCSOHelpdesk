const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const sheets = require('../utils/sheets');
const { BOT_DATABASE_SHEET_ID, GENERAL_SHEET_ID } = require('../config');
const logCommand = require('../utils/embedLogger');

function convertExcelTimeToHHMMSS(serial) {
  const totalSeconds = Math.floor(serial * 86400); // 24 * 60 * 60
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function calculateTimeDifference(start, end) {
  const diffMs = end - start;
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function sumTimes(time1, time2) {
  const [h1, m1, s1] = time1.split(':').map(Number);
  const [h2, m2, s2] = time2.split(':').map(Number);

  let seconds = s1 + s2;
  let minutes = m1 + m2 + Math.floor(seconds / 60);
  let hours = h1 + h2 + Math.floor(minutes / 60);

  seconds %= 60;
  minutes %= 60;
  hours %= 24;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forceclockout')
    .setDescription('Forcefully clock out a user based on Discord ID.')
    .addStringOption(option =>
      option.setName('discord_id')
        .setDescription('The Discord ID to force clockout.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const discordId = interaction.options.getString('discord_id');
    const activeSheet = 'ACTIVECLOCKINS';
    const loggedSheet = 'LOGGEDCLOCKINS';

    await interaction.reply({ content: '🔄 Attempting to force clockout...', ephemeral: true });

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${activeSheet}!A2:B`,
      });

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === discordId);

      if (rowIndex === -1) {
        await interaction.editReply({ content: '❌ User not found in active clock-ins.' });
        return;
      }

      const [id, startRaw] = rows[rowIndex];
      const startTime = isNaN(startRaw) ? new Date(startRaw) : new Date((Number(startRaw) - 25569) * 86400 * 1000); // Convert Excel serial
      const endTime = new Date();
      const totalTime = calculateTimeDifference(startTime, endTime);

      // Log to LOGGEDCLOCKINS
      const logRow = [
        discordId,
        startTime.toLocaleTimeString('en-US', { hour12: false }),
        endTime.toLocaleTimeString('en-US', { hour12: false }),
        totalTime,
        new Date().toLocaleString('en-US', { hour12: false }),
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${loggedSheet}!A2`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [logRow] },
      });

      // Update General-Membership sheet
      const genRes = await sheets.spreadsheets.values.get({
        spreadsheetId: GENERAL_SHEET_ID,
        range: 'F12:F118',
      });

      const idRows = genRes.data.values || [];
      const genIndex = idRows.findIndex(row => row[0] === discordId);

      if (genIndex !== -1) {
        const timeCell = `R${genIndex + 12}`;
        const timeRes = await sheets.spreadsheets.values.get({
          spreadsheetId: GENERAL_SHEET_ID,
          range: `General-Membership!${timeCell}`,
        });

        const currentTime = (timeRes.data.values && timeRes.data.values[0][0]) || '00:00:00';
        const newTime = sumTimes(currentTime, totalTime);

        await sheets.spreadsheets.values.update({
          spreadsheetId: GENERAL_SHEET_ID,
          range: `General-Membership!${timeCell}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[newTime]] },
        });
      }

      // Clear from ACTIVECLOCKINS
      const clearRow = rowIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${activeSheet}!A${clearRow}:B${clearRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['', '']] },
      });

      // DM the user
      try {
        const user = await client.users.fetch(discordId);
        await user.send(`⏹️ You have been force clocked out by a Sergeant. If you believe this was in error, please contact a supervisor.`);
      } catch (err) {
        console.warn(`Could not DM user ${discordId}.`);
      }

      await interaction.editReply({ content: `✅ Force clocked out <@${discordId}> successfully.` });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: '❌ An error occurred while processing the command.' });
    }
  }
};
