// ✅ commands/reverttime.js
const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const { SHEET_ID, ALLOWED_ROLE_ID, BOT_DATABASE_SHEET_ID } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reverttime')
    .setDescription('Revert a user’s time to what it was before their last clockout.')
    .addStringOption(option =>
      option.setName('discord_id')
        .setDescription('The user’s Discord ID')
        .setRequired(true)),

  async execute(interaction, client) {
    const hasPermission = interaction.member.roles.cache.has(ALLOWED_ROLE_ID);
    if (!hasPermission) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const discordId = interaction.options.getString('discord_id');
    const sheetName = 'General-Membership';

    try {
      // Get current time from General-Membership
      const idRange = 'F12:F118';
      const timeRange = 'R12:R118';

      const [idRes, timeRes] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${sheetName}!${idRange}` }),
        sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${sheetName}!${timeRange}` })
      ]);

      const ids = idRes.data.values || [];
      const times = timeRes.data.values || [];
      const rowIndex = ids.findIndex(row => row[0] === discordId);

      if (rowIndex === -1) {
        return interaction.reply({ content: '❌ That ID was not found in the sheet.', ephemeral: true });
      }

      const generalRowNumber = rowIndex + 12;

      // Get previous time from LOGGEDCLOCKINS
      const logSheet = 'LOGGEDCLOCKINS';
      const logRes = await sheets.spreadsheets.values.get({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${logSheet}!A2:D`,
      });

      const logRows = logRes.data.values || [];
      const filtered = logRows.filter(row => row[0] === discordId);

      if (filtered.length < 2) {
        return interaction.reply({ content: '⚠️ Not enough history to revert this user’s time.', ephemeral: true });
      }

      const lastEntry = filtered[filtered.length - 1];
      const prevEntry = filtered[filtered.length - 2];
      const previousTotal = prevEntry[3];

      if (!previousTotal) {
        return interaction.reply({ content: '⚠️ Previous time value not found.', ephemeral: true });
      }

      // Update time back to previous
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!R${generalRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[previousTotal]] },
      });

      await interaction.reply({ content: `⏪ Reverted time for \`${discordId}\` to **${previousTotal}**.`, ephemeral: true });

      await logCommand({
        client,
        commandName: 'reverttime',
        user: interaction.user,
        status: 'Success',
        description: `Reverted total time to ${previousTotal} for Discord ID \`${discordId}\` (R${generalRowNumber})`,
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Something went wrong while reverting time.', ephemeral: true });

      await logCommand({
        client,
        commandName: 'reverttime',
        user: interaction.user,
        status: 'Error',
        description: `❌ ${err.message}`,
      });
    }
  }
};
