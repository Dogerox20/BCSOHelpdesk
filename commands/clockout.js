const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const checkBlacklist = require('./checkBlacklist');
const { startSurvey } = require('../utils/surveyManager');
const { SHEET_ID, BOT_DATABASE_SHEET_ID, LOG_CHANNEL_ID, CLOCKIN_ROLE_ID } = require('../config');

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour12: false });
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function parseDuration(duration) {
  const [h, m, s] = duration.split(':').map(Number);
  return (h * 3600 + m * 60 + s) * 1000;
}

module.exports = {
  data: new SlashCommandBuilder().setName('clockout').setDescription('Clock out of your shift.'),

  async execute(interaction, client) {
    const discordId = interaction.user.id;

    // Role check
    const hasClockinRole = interaction.member.roles.cache.has(CLOCKIN_ROLE_ID);
    if (!hasClockinRole) {
      await interaction.reply({ content: '❌ You are not a high enough of a rank to use this command!', ephemeral: true });
      return logCommand({
        client,
        commandName: 'clockout',
        user: interaction.user,
        status: 'Denied',
        description: `User lacks rank role to run clockout.`,
      });
    }

    // Check blacklist
    const reason = await checkBlacklist(discordId);
    if (reason) {
      await interaction.reply({ content: `❌ You are blacklisted from using this command. Reason: ${reason}`, ephemeral: true });
      return logCommand({
        client,
        commandName: 'clockout',
        user: interaction.user,
        status: 'Blacklisted',
        description: `Attempted clockout but is blacklisted. Reason: ${reason}`,
      });
    }

    const activeRes = await sheets.spreadsheets.values.get({
      spreadsheetId: BOT_DATABASE_SHEET_ID,
      range: 'ACTIVECLOCKINS!A2:C',
    });

    const rows = activeRes.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === discordId);
    if (rowIndex === -1) {
      await interaction.reply({ content: '❌ You are not clocked in.', ephemeral: true });
      return;
    }

    const [id, startTime] = rows[rowIndex];
    const startDate = new Date(startTime);
    const endDate = new Date();
    const durationMs = endDate - startDate;
    const formattedDuration = formatDuration(durationMs);

    const formattedStart = formatTime(startDate);
    const formattedEnd = formatTime(endDate);

    const logRange = `LOGGEDCLOCKINS!A2:E`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: BOT_DATABASE_SHEET_ID,
      range: logRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[discordId, formattedStart, formattedEnd, formattedDuration, new Date().toLocaleString()]],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_DATABASE_SHEET_ID,
      range: `ACTIVECLOCKINS!A${rowIndex + 2}:D${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['', '', '', '']] },
    });

    // Add duration to R12:R118
    const gmRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'General-Membership!F12:F118',
    });

    const gmRows = gmRes.data.values || [];
    const matchIndex = gmRows.findIndex(row => row[0] === discordId);
    if (matchIndex !== -1) {
      const rRow = matchIndex + 12;
      const quotaRange = `General-Membership!R${rRow}`;
      const current = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: quotaRange,
      });

      const currentDuration = current.data.values?.[0]?.[0] || '00:00:00';
      const totalDuration = formatDuration(parseDuration(currentDuration) + durationMs);

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: quotaRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[totalDuration]] },
      });
    }

    await interaction.reply({ content: `✅ Clocked out! Time worked: **${formattedDuration}**`, ephemeral: true });

    await logCommand({
      client,
      commandName: 'clockout',
      user: interaction.user,
      status: 'Success',
      description: `Clocked out successfully. Time worked: ${formattedDuration}`,
    });

    // Trigger post-shift survey
    await startSurvey(interaction.user, client);
  },
};
