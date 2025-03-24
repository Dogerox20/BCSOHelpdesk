// commands/checkID.js
const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const { SHEET_ID } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkid')
    .setDescription('Check if a Discord ID exists in the General-Membership sheet.')
    .addStringOption(option =>
      option.setName('discord_id')
        .setDescription('The Discord ID to look for.')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const discordId = interaction.options.getString('discord_id');
    const sheetName = 'General-Membership';
    const range = 'F12:F118';

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!${range}`,
      });

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === discordId);

      if (rowIndex === -1) {
        await interaction.reply({ content: '❌ Discord ID not found in the system.', ephemeral: true });
        await logCommand({
          client,
          commandName: 'checkid',
          user: interaction.user,
          status: 'Not Found',
          description: `Searched for Discord ID \`${discordId}\` but it was not found.`,
        });
        return;
      }

      const sheetRow = rowIndex + 12; // Offset for F12:F118
      await interaction.reply({ content: `✅ Discord ID found on row ${sheetRow}.`, ephemeral: true });

      await logCommand({
        client,
        commandName: 'checkid',
        user: interaction.user,
        status: 'Success',
        description: `Found ID \`${discordId}\` on row ${sheetRow}.`,
      });

    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ An error occurred while checking the ID.', ephemeral: true });

      await logCommand({
        client,
        commandName: 'checkid',
        user: interaction.user,
        status: 'Error',
        description: `❌ ${error.message}`,
      });
    }
  }
};
