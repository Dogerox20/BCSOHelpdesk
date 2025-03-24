const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const checkBlacklist = require('./checkBlacklist');
const { BOT_DATABASE_SHEET_ID, GENERAL_SHEET_ID, ALLOWED_ROLE_ID } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clockin')
    .setDescription('Clock in for duty.'),

  async execute(interaction, client) {
    try {
      const memberRoles = interaction.member.roles.cache;
      const requiredRole = interaction.guild.roles.cache.get(ALLOWED_ROLE_ID);
      const hasPermission = memberRoles.some(role => role.position >= requiredRole.position);

      if (!hasPermission) {
        await interaction.reply({ content: '❌ You are not a high enough of a rank to use this command!', ephemeral: true });
        await logCommand({
          client,
          commandName: 'clockin',
          user: interaction.user,
          status: 'Denied',
          description: 'User did not have the required role.'
        });
        return;
      }

      const discordId = interaction.user.id;
      const blacklistReason = await checkBlacklist(discordId);

      if (blacklistReason) {
        await interaction.reply({ content: `❌ You are blacklisted from using this command.
**Reason:** ${blacklistReason}`, ephemeral: true });
        await logCommand({
          client,
          commandName: 'clockin',
          user: interaction.user,
          status: 'Blacklisted',
          description: `Tried to clock in while blacklisted. Reason: ${blacklistReason}`,
        });
        return;
      }

      const range = 'ACTIVECLOCKINS!A2:A';
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range,
      });

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === discordId);

      if (rowIndex !== -1) {
        await interaction.reply({ content: '❌ You are already clocked in. Please clock out before clocking in again.', ephemeral: true });
        await logCommand({
          client,
          commandName: 'clockin',
          user: interaction.user,
          status: 'Failed',
          description: 'Attempted to clock in while already clocked in.',
        });
        return;
      }

      const now = new Date();
      const formatted = now.toLocaleTimeString('en-US', { hour12: false });

      // Find next empty row
      const emptyIndex = rows.findIndex(row => !row[0]);
      const targetRow = emptyIndex !== -1 ? emptyIndex + 2 : rows.length + 2;

      await sheets.spreadsheets.values.update({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `ACTIVECLOCKINS!A${targetRow}:B${targetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[discordId, formatted]],
        },
      });

      await interaction.reply({ content: `✅ You have successfully clocked in at **${formatted}**.`, ephemeral: true });

      await logCommand({
        client,
        commandName: 'clockin',
        user: interaction.user,
        status: 'Success',
        description: `Clocked in at ${formatted}. (Row ${targetRow})`,
      });

    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ An error occurred while processing the command.', ephemeral: true });
      await logCommand({
        client,
        commandName: 'clockin',
        user: interaction.user,
        status: 'Error',
        description: `❌ ${err.message}`,
      });
    }
  },
};