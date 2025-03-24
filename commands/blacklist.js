const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const { ALLOWED_ROLE_ID, BOT_DATABASE_SHEET_ID } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Blacklist a user from using clockin/clockout')
    .addStringOption(option =>
      option.setName('discord_id').setDescription('Discord ID to blacklist').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for blacklist').setRequired(true)),

  async execute(interaction) {
    const hasPermission = interaction.member.roles.cache.has(ALLOWED_ROLE_ID);
    if (!hasPermission) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const discordId = interaction.options.getString('discord_id');
    const reason = interaction.options.getString('reason');
    const sheet = 'BLACKLISTS';
    const range = `${sheet}!A2:B`;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: BOT_DATABASE_SHEET_ID,
      range
    });

    const rows = res.data.values || [];
    const exists = rows.find(row => row[0] === discordId);

    if (exists) {
      return interaction.reply({ content: '⚠️ This user is already blacklisted.', ephemeral: true });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: BOT_DATABASE_SHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[discordId, reason]] },
    });

    return interaction.reply({ content: `✅ Blacklisted user \`${discordId}\` for reason: ${reason}`, ephemeral: true });
  }
};
