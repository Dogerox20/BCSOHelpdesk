
const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const checkBlacklist = require('../utils/checkBlacklist');
const logCommand = require('../utils/embedLogger');
const { BOT_DATABASE_SHEET_ID, GENERAL_MEMBERSHIP_SHEET_ID, ALLOWED_ROLE_ID } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clockin')
    .setDescription('Clock in to start your shift.'),

  async execute(interaction, client) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const hasPermission = member.roles.cache.some(role => role.id === ALLOWED_ROLE_ID || role.position >= interaction.guild.roles.cache.get(ALLOWED_ROLE_ID).position);

      if (!hasPermission) {
        await interaction.reply({ content: '❌ You are not a high enough of a rank to use this command!', ephemeral: true });
        await logCommand({
          client,
          commandName: 'clockin',
          user: interaction.user,
          status: 'Denied',
          description: '❌ Insufficient rank to clock in.',
        });
        return;
      }

      const discordId = interaction.user.id;

      // Check blacklist
      const blacklistReason = await checkBlacklist(discordId);
      if (blacklistReason) {
        await interaction.reply({ content: `❌ You are blacklisted from clocking in.
**Reason:** ${blacklistReason}`, ephemeral: true });
        await logCommand({
          client,
          commandName: 'clockin',
          user: interaction.user,
          status: 'Denied',
          description: `❌ User is blacklisted. Reason: ${blacklistReason}`,
        });
        return;
      }

      // Check if user already clocked in
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: 'ACTIVECLOCKINS!A2:A',
      });

      const rows = getRes.data.values || [];
      const alreadyClockedIn = rows.some(row => row[0] === discordId);

      if (alreadyClockedIn) {
        await interaction.reply({ content: '❌ You are already clocked in. Please clock out before clocking in again.', ephemeral: true });
        await logCommand({
          client,
          commandName: 'clockin',
          user: interaction.user,
          status: 'Failed',
          description: '❌ User tried to clock in while already clocked in.',
        });
        return;
      }

      // Find next empty row
      const emptyRowIndex = rows.length + 2;

      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: false });
      const updateRange = `ACTIVECLOCKINS!A${emptyRowIndex}:B${emptyRowIndex}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[discordId, timeString]],
        },
      });

      await interaction.reply({ content: '✅ You have been clocked in successfully!', ephemeral: true });

      await logCommand({
        client,
        commandName: 'clockin',
        user: interaction.user,
        status: 'Success',
        description: `🕒 Clock-in recorded at ${timeString} in row ${emptyRowIndex}.`,
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ An unexpected error occurred while processing the clockin.', ephemeral: true });

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
