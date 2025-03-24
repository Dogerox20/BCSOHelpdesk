const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const { BOT_DATABASE_SHEET_ID } = require('../config');
const { hasPendingSurvey } = require('../utils/surveyManager');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clockin')
    .setDescription('Clock in for your shift.'),

  async execute(interaction, client) {
    const discordId = interaction.user.id;

    // Role rank restriction check
    const allowedRoleId = '1348493509698781216';
    const hasRank = interaction.member.roles.cache.has(allowedRoleId);
    if (!hasRank) {
      await interaction.reply({ content: '❌ You are not a high enough of a rank to use this command!', ephemeral: true });
      await logCommand({
        client,
        commandName: 'clockin',
        user: interaction.user,
        status: 'Denied',
        description: `User did not meet rank requirement (missing role ID ${allowedRoleId}).`
      });
      return;
    }

    // Check for blacklist
    const reason = await checkBlacklist(discordId);
    if (reason) {
      await interaction.reply({ content: `🚫 You are blacklisted from using this command. Reason: **${reason}**`, ephemeral: true });
      return;
    }

    // Check for pending survey
    if (hasPendingSurvey(discordId)) {
      await interaction.reply({ content: '🚫 You have a pending post-clockout survey. Please complete it before clocking in again.', ephemeral: true });
      return;
    }

    const sheetName = 'ACTIVECLOCKINS';
    const startTime = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

    try {
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${sheetName}!A2:A`,
      });

      const ids = getRes.data.values?.flat() || [];

      if (ids.includes(discordId)) {
        await interaction.reply({ content: '⏳ You are already clocked in.', ephemeral: true });
        return;
      }

      const nextRow = ids.length + 2;

      await sheets.spreadsheets.values.update({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${sheetName}!A${nextRow}:B${nextRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[discordId, startTime]],
        },
      });

      await interaction.reply({ content: `✅ You have clocked in at **${startTime}**.`, ephemeral: true });

      await logCommand({
        client,
        commandName: 'clockin',
        user: interaction.user,
        status: 'Success',
        description: `Clocked in at ${startTime} (Row ${nextRow})`,
      });

    } catch (error) {
      console.error(error);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ Something went wrong while clocking you in.', ephemeral: true });
      }
    }
  }
};
