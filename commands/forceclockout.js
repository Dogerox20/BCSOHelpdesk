// ✅ commands/forceclockout.js
const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const { BOT_DATABASE_SHEET_ID, ALLOWED_ROLE_ID } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forceclockout')
    .setDescription('Forcefully clock out a user by Discord ID.')
    .addStringOption(option =>
      option.setName('discord_id')
        .setDescription('Discord ID to clock out')
        .setRequired(true)),

  async execute(interaction, client) {
    const staffRole = interaction.member.roles.cache.has(ALLOWED_ROLE_ID);
    if (!staffRole) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const discordId = interaction.options.getString('discord_id');
    const activeSheet = 'ACTIVECLOCKINS';
    const logSheet = 'LOGGEDCLOCKINS';
    const endTime = new Date();
    const endFormatted = endTime.toLocaleString('en-US', { timeZone: 'America/Chicago' });

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${activeSheet}!A2:C`,
      });

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === discordId);

      if (rowIndex === -1) {
        return interaction.reply({ content: '⚠️ That user is not currently clocked in.', ephemeral: true });
      }

      const actualRow = rowIndex + 2;
      const startTimeRaw = rows[rowIndex][1];
      const startTime = new Date(startTimeRaw);

      if (isNaN(startTime)) {
        return interaction.reply({ content: '❌ Invalid start time format found in sheet.', ephemeral: true });
      }

      const durationMs = endTime - startTime;
      const formatDuration = ms => {
        const totalSeconds = Math.floor(ms / 1000);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      const duration = formatDuration(durationMs);

      await sheets.spreadsheets.values.append({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${logSheet}!A:E`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            discordId,
            startTime.toLocaleString('en-US', { timeZone: 'America/Chicago' }),
            endFormatted,
            duration,
            new Date().toISOString(),
          ]],
        },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${activeSheet}!A${actualRow}:C${actualRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['', '', '']] },
      });

      await interaction.reply({ content: `✅ Successfully force-clocked out \`${discordId}\` with time **${duration}**.`, ephemeral: true });

      await logCommand({
        client,
        commandName: 'forceclockout',
        user: interaction.user,
        status: 'Success',
        description: `Force clocked out user \`${discordId}\` | Time worked: ${duration}`,
      });

    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Something went wrong during force clockout.', ephemeral: true });

      await logCommand({
        client,
        commandName: 'forceclockout',
        user: interaction.user,
        status: 'Error',
        description: `❌ ${err.message}`,
      });
    }
  }
};
