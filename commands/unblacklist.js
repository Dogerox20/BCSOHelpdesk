const { SlashCommandBuilder } = require('discord.js');
const sheets = require('../utils/sheets');
const { ALLOWED_ROLE_ID, BOT_DATABASE_SHEET_ID } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unblacklist')
    .setDescription('Remove a user from the blacklist')
    .addStringOption(option =>
      option.setName('discord_id').setDescription('Discord ID to unblacklist').setRequired(true)),

  async execute(interaction) {
    const hasPermission = interaction.member.roles.cache.has(ALLOWED_ROLE_ID);
    if (!hasPermission) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const discordId = interaction.options.getString('discord_id');
    const sheet = 'BLACKLISTS';
    const range = `${sheet}!A2:B`;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: BOT_DATABASE_SHEET_ID,
      range
    });

    const rows = res.data.values || [];
    const index = rows.findIndex(row => row[0] === discordId);

    if (index === -1) {
      return interaction.reply({ content: '⚠️ That user is not blacklisted.', ephemeral: true });
    }

    const rowNumber = index + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_DATABASE_SHEET_ID,
      range: `${sheet}!A${rowNumber}:B${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['', '']] },
    });

    try {
      const user = await interaction.client.users.fetch(discordId);
      await user.send('✅ Your blacklist from the clockin/clockout command has been revoked, you are now able to clockin and clockout again.');
    } catch {
      console.log(`Could not DM user ${discordId}`);
    }

    return interaction.reply({ content: `✅ Removed user \`${discordId}\` from the blacklist.`, ephemeral: true });
  }
};
