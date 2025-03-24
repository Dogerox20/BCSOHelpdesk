const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const { BOT_DATABASE_SHEET_ID, SHEET_ID } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quotareset')
    .setDescription('Resets all quota time and archives LOGGEDCLOCKINS.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const allowedRoleId = '1348493505827307623';
    const memberRoles = interaction.member.roles.cache;
    if (!memberRoles.has(allowedRoleId)) {
      await interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
      await logCommand({
        client,
        commandName: 'quotareset',
        user: interaction.user,
        status: 'Denied',
        description: 'User did not have the appropriate role.'
      });
      return;
    }

    try {
      // Reset General-Membership Quota Time
      const resetRange = 'General-Membership!R12:R118';
      const resetValues = Array(107).fill(['00:00:00']);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: resetRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: resetValues }
      });

      // Get current LOGGEDCLOCKINS data
      const logRes = await sheets.spreadsheets.values.get({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: 'LOGGEDCLOCKINS!A2:E'
      });
      const logData = logRes.data.values || [];

      // Archive to MARCH 2025 ARCHIVE sheet
      if (logData.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: BOT_DATABASE_SHEET_ID,
          range: 'MARCH 2025 ARCHIVE!A2',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: logData }
        });
      }

      // Clear LOGGEDCLOCKINS
      const clearRange = `LOGGEDCLOCKINS!A2:E${logData.length + 1}`;
      await sheets.spreadsheets.values.clear({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: clearRange
      });

      await interaction.reply({ content: '✅ Quota has been reset and data archived.', ephemeral: true });
      await logCommand({
        client,
        commandName: 'quotareset',
        user: interaction.user,
        status: 'Success',
        description: `✅ Quota cleared and archived ${logData.length} entries to MARCH 2025 ARCHIVE.`
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ An error occurred during the quota reset.', ephemeral: true });
      await logCommand({
        client,
        commandName: 'quotareset',
        user: interaction.user,
        status: 'Error',
        description: `❌ ${err.message}`
      });
    }
  }
};
