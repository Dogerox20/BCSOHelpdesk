// ✅ commands/forcetime.js
const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const { SHEET_ID, ALLOWED_ROLE_ID } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forcetime')
    .setDescription('Forcefully set a user’s total time on the General-Membership sheet.')
    .addStringOption(option =>
      option.setName('discord_id')
        .setDescription('The user’s Discord ID')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('hours')
        .setDescription('Total hours')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('minutes')
        .setDescription('Total minutes')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('seconds')
        .setDescription('Total seconds')
        .setRequired(true)),

  async execute(interaction, client) {
    const staffRole = interaction.member.roles.cache.has(ALLOWED_ROLE_ID);
    if (!staffRole) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const discordId = interaction.options.getString('discord_id');
    const hours = interaction.options.getInteger('hours');
    const minutes = interaction.options.getInteger('minutes');
    const seconds = interaction.options.getInteger('seconds');

    const totalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const sheetName = 'General-Membership';

    try {
      const idRange = 'F12:F118';
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!${idRange}`
      });

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === discordId);

      if (rowIndex === -1) {
        return interaction.reply({ content: '❌ That ID was not found in the sheet.', ephemeral: true });
      }

      const rowNumber = rowIndex + 12;
      const updateRange = `${sheetName}!R${rowNumber}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[totalTime]] },
      });

      await interaction.reply({ content: `✅ Time set to **${totalTime}** for ID \`${discordId}\`.`, ephemeral: true });

      await logCommand({
        client,
        commandName: 'forcetime',
        user: interaction.user,
        status: 'Success',
        description: `Set total time to ${totalTime} for Discord ID \`${discordId}\` (R${rowNumber})`,
      });

    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Something went wrong while setting time.', ephemeral: true });

      await logCommand({
        client,
        commandName: 'forcetime',
        user: interaction.user,
        status: 'Error',
        description: `❌ ${err.message}`,
      });
    }
  }
};
