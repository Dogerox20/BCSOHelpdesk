
const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const logCommand = require('../utils/embedLogger');
const { BOT_DATABASE_SHEET_ID, SHEET_ID } = require('../config');

function parseTimeString(timeStr) {
  const parts = timeStr.split(':');
  return new Date(0, 0, 0, +parts[0], +parts[1], +parts[2]);
}

function formatDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forceclockout')
    .setDescription('Forcefully clock out a user by their Discord ID')
    .addStringOption(option =>
      option.setName('discord_id')
        .setDescription('The Discord ID of the user to clock out')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const discordId = interaction.options.getString('discord_id');

    try {
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: 'ACTIVECLOCKINS!A2:C',
      });

      const rows = getRes.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === discordId);

      if (rowIndex === -1) {
        await interaction.reply({ content: '❌ This user is not currently clocked in.', ephemeral: true });
        return;
      }

      const startTimeStr = rows[rowIndex][1];
      const startTime = new Date(`1970-01-01T${startTimeStr}`);
      const endTime = new Date();
      const duration = formatDuration(endTime - startTime);

      await sheets.spreadsheets.values.append({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: 'LOGGEDCLOCKINS!A2',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[discordId, startTime.toTimeString().split(' ')[0], endTime.toTimeString().split(' ')[0], duration]],
        },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: BOT_DATABASE_SHEET_ID,
        range: `ACTIVECLOCKINS!A${rowIndex + 2}:C${rowIndex + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['', '', '']],
        },
      });

      const getGen = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'General-Membership!F12:F118',
      });

      const genRows = getGen.data.values || [];
      const genRowIndex = genRows.findIndex(row => row[0] === discordId);

      if (genRowIndex !== -1) {
        const timeRange = `General-Membership!R${genRowIndex + 12}`;
        const prevTimeRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: timeRange,
        });

        const prevTime = prevTimeRes.data.values?.[0]?.[0] || '00:00:00';
        const prevDate = parseTimeString(prevTime);
        const newDuration = parseTimeString(duration);

        const combined = new Date(prevDate.getTime() + newDuration.getTime());
        const newTotal = formatDuration(combined - new Date(0));

        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: timeRange,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[newTotal]],
          },
        });

        try {
          const user = await client.users.fetch(discordId);
          if (user) {
            await user.send("🔔 You’ve been force clocked-out by a Sergeant. Please ensure your shifts are manually ended moving forward.");
          }
        } catch (dmErr) {
          console.warn("⚠ Could not DM the user:", dmErr.message);
        }

        await interaction.reply({ content: `✅ Successfully force clocked out <@${discordId}>.`, ephemeral: true });

        await logCommand({
          client,
          commandName: 'forceclockout',
          user: interaction.user,
          status: 'Success',
          description: `Force clocked out <@${discordId}> | Time Logged: ${duration}`
        });
      } else {
        await interaction.reply({ content: '❌ User not found in General-Membership sheet.', ephemeral: true });
      }
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ An error occurred during force clockout.', ephemeral: true });

      await logCommand({
        client,
        commandName: 'forceclockout',
        user: interaction.user,
        status: 'Error',
        description: `❌ ${err.message}`
      });
    }
  }
};
