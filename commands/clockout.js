const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const { BOT_DATABASE_SHEET_ID, SHEET_ID } = require('../config');
const { startSurvey } = require('../utils/surveyManager');

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function parseTimeString(timeStr) {
  if (!timeStr) return 0;
  const [hrs, mins, secs] = timeStr.split(':').map(Number);
  return (hrs * 3600 + mins * 60 + secs) * 1000;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clockout')
    .setDescription('Clock out and log your shift.'),

  async execute(interaction, client) {
    const discordId = interaction.user.id;
    const activeSheet = 'ACTIVECLOCKINS';
    const logSheet = 'LOGGEDCLOCKINS';
    const generalSheet = 'General-Membership';
    const endTime = new Date();
    const endTimeFormatted = endTime.toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const timestamp = new Date().toISOString();

    try {
      // Step 1: Get current ACTIVE clock-ins
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${activeSheet}!A2:C`,
      });

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === discordId);

      if (rowIndex === -1) {
        await interaction.reply({ content: '❌ You are not currently clocked in.', ephemeral: true });

        await logCommand({
          client,
          commandName: 'clockout',
          user: interaction.user,
          status: 'Failed',
          description: `User attempted to clock out but was not clocked in.`,
        });
        return;
      }

      const actualRow = rowIndex + 2;
      const startTimeRaw = rows[rowIndex][1];
      const startTime = new Date(startTimeRaw);

      if (isNaN(startTime)) {
        await interaction.reply({ content: '❌ Invalid start time format. Please contact an admin.', ephemeral: true });
        return;
      }

      const sessionMs = endTime - startTime;
      const sessionTime = formatDuration(sessionMs);

      // Step 2: Log session to LOGGEDCLOCKINS
      await sheets.spreadsheets.values.append({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${logSheet}!A:E`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            discordId,
            startTime.toLocaleString('en-US', { timeZone: 'America/Chicago' }),
            endTimeFormatted,
            sessionTime,
            timestamp,
          ]]
        }
      });

      // Step 3: Clear from ACTIVECLOCKINS
      await sheets.spreadsheets.values.update({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${activeSheet}!A${actualRow}:C${actualRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['', '', '']] },
      });

      // Step 4: Add time to General-Membership!R
      const idRange = 'F12:F118';
      const timeRange = 'R12:R118';
      const idRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${generalSheet}!${idRange}`,
      });

      const ids = idRes.data.values?.flat() || [];
      const idIndex = ids.findIndex(id => id === discordId);

      if (idIndex !== -1) {
        const rowNumber = idIndex + 12;
        const currentTimeRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `${generalSheet}!R${rowNumber}`,
        });

        const currentTime = currentTimeRes.data.values?.[0]?.[0] || '00:00:00';
        const newTotalMs = parseTimeString(currentTime) + sessionMs;
        const newTotalFormatted = formatDuration(newTotalMs);

        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${generalSheet}!R${rowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[newTotalFormatted]] },
        });
      }

      // Step 5: Reply to user
      await interaction.reply({ content: `✅ You have clocked out. Total time: **${sessionTime}**`, ephemeral: true });

      // Step 6: Log to staff log
      await logCommand({
        client,
        commandName: 'clockout',
        user: interaction.user,
        status: 'Success',
        description: `Clocked out. Duration: ${sessionTime} — Time added to General-Membership sheet.`,
      });

      // Step 7: Start post-shift survey via DM
      await startSurvey(interaction.user, client);

    } catch (error) {
      console.error(error);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ An error occurred while clocking you out.', ephemeral: true });
      }

      await logCommand({
        client,
        commandName: 'clockout',
        user: interaction.user,
        status: 'Error',
        description: `❌ ${error.message}`,
      });
    }
  }
};
