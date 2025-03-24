// commands/dm.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a DM to a user by their Discord ID.')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('The ID of the user to DM')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const ownerId = '1229398099567317023';
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: '🚫 You are not authorized to use this command.', ephemeral: true });
    }

    const userId = interaction.options.getString('user_id');
    const message = interaction.options.getString('message');

    try {
      const user = await client.users.fetch(userId);
      await user.send(message);
      await interaction.reply({ content: `✅ Message sent to <@${userId}>.`, ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to send the message. Invalid user ID or DMs are closed.', ephemeral: true });
    }
  }
};
