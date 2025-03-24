const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const { ALLOWED_ROLE_ID, SHEET_ID } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pitdeauth')
    .setDescription('Remove PIT Certification from a user.')
    .addStringOption(option =>
      option.setName('discord_id')
        .setDescription('The Discord ID to deauthorize')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const staffRole = interaction.member.roles.cache.has(ALLOWED_ROLE_ID);
    const discordId = interaction.options.getString('discord_id');
    const sheetName = 'General-Membership';

    if (!staffRole) {
      await interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
      return;
    }

    try {
      const idRange = 'F12:F118';
      const checkboxRange = 'O12:O118';

      const idRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!${idRange}`,
      });

      const ids = idRes.data.values || [];
      const rowIndex = ids.findIndex(row => row[0] === discordId);

      if (rowIndex === -1) {
        await interaction.reply({ content: '❌ Discord ID not found in the sheet.', ephemeral: true });
        await logCommand({
          client,
          commandName: 'pitdeauth',
          user: interaction.user,
          status: 'Failed',
          description: `Discord ID \`${discordId}\` not found.`,
        });
        return;
      }

      const checkRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!O${rowIndex + 12}`,
      });

      const currentValue = checkRes.data.values?.[0]?.[0];

      if (!currentValue || currentValue === 'FALSE') {
        await interaction.reply({ content: '⚠️ This user is already deauthorized for PIT.', ephemeral: true });
        return;
      }

      const updateRange = `${sheetName}!O${rowIndex + 12}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['FALSE']] },
      });

      await interaction.reply({ content: `✅ PIT certification removed for ID \`${discordId}\`.`, ephemeral: true });

      await logCommand({
        client,
        commandName: 'pitdeauth',
        user: interaction.user,
        status: 'Success',
        description: `✅ Set cell O${rowIndex + 12} to FALSE for ID \`${discordId}\`.`,
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ An error occurred while processing the command.', ephemeral: true });

      await logCommand({
        client,
        commandName: 'pitdeauth',
        user: interaction.user,
        status: 'Error',
        description: `❌ ${err.message}`,
      });
    }
  }
};