const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const { BOT_DATABASE_SHEET_ID, SHEET_ID } = require('../config');
const { isUserBlacklisted } = require('../commands/checkBlacklist');
const { getTimeDifference, formatTime } = require('../utils/timeUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forceclockout')
    .setDescription('Force clockout a user based on Discord ID.')
    .addStringOption(option =>
      option.setName('discord_id')
        .setDescription('The Discord ID to force clockout')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const discordId = interaction.options.getString('discord_id');
    const userId = interaction.user.id;
    const logChannelId = '1350703697205792861';

    try {
      // Check if user is in ACTIVECLOCKINS
      const activeRange = 'ACTIVECLOCKINS!A2:C';
      const activeRes = await sheets.spreadsheets.values.get({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: activeRange
      });

      const activeRows = activeRes.data.values || [];
      const rowIndex = activeRows.findIndex(row => row[0] === discordId);
      if (rowIndex === -1) {
        await interaction.reply({ content: '❌ User is not currently clocked in.', ephemeral: true });
        return;
      }

      const [id, startTime] = activeRows[rowIndex];
      const endTime = new Date();
      const startDate = new Date(startTime);
      const totalTime = getTimeDifference(startDate, endTime);
      const formattedTotal = formatTime(totalTime);

      const logRange = 'LOGGEDCLOCKINS';
      await sheets.spreadsheets.values.append({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `${logRange}!A2`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            discordId,
            startDate.toLocaleTimeString('en-US', { hour12: false }),
            endTime.toLocaleTimeString('en-US', { hour12: false }),
            formattedTotal,
            new Date().toLocaleString('en-US', { hour12: false })
          ]]
        }
      });

      // Remove from ACTIVECLOCKINS
      await sheets.spreadsheets.values.update({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `ACTIVECLOCKINS!A${rowIndex + 2}:D${rowIndex + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['', '', '', '']]
        }
      });

      // Add to General-Membership sheet quota
      const genRange = 'General-Membership!F12:F118';
      const genRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: genRange
      });
      const genRows = genRes.data.values || [];
      const genRowIndex = genRows.findIndex(row => row[0] === discordId);

      if (genRowIndex !== -1) {
        const quotaCell = `General-Membership!R${genRowIndex + 12}`;
        const prevTimeRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: quotaCell
        });

        const oldTime = prevTimeRes.data.values?.[0]?.[0] || '00:00:00';
        const [oh, om, os] = oldTime.split(':').map(Number);
        const [th, tm, ts] = formattedTotal.split(':').map(Number);

        const totalSeconds = (oh * 3600 + om * 60 + os) + (th * 3600 + tm * 60 + ts);
        const newHours = Math.floor(totalSeconds / 3600);
        const newMinutes = Math.floor((totalSeconds % 3600) / 60);
        const newSeconds = totalSeconds % 60;
        const newTotal = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`;

        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: quotaCell,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[newTotal]] }
        });
      }

      // DM the user
      try {
        const member = await client.users.fetch(discordId);
        if (member) {
          await member.send('You’ve been force clocked-out by a Sergeant. Please ensure your shifts are manually ended moving forward.');
        }
      } catch (err) {
        console.warn('Could not DM user:', err.message);
      }

      await interaction.reply({ content: `✅ Successfully force clocked out <@${discordId}>.`, ephemeral: true });

      await logCommand({
        client,
        commandName: 'forceclockout',
        user: interaction.user,
        status: 'Success',
        description: `Force clocked out <@${discordId}> | Time Logged: ${formattedTotal}`
      });

    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ An error occurred during force clockout.', ephemeral: true });

      await logCommand({
        client,
        commandName: 'forceclockout',
        user: interaction.user,
        status: 'Error',
        description: err.message
      });
    }
  }
};