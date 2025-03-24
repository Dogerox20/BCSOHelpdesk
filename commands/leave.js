// commands/leave.js
const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Make the bot leave its current voice channel.'),

  async execute(interaction) {
    const ownerId = '1229398099567317023';

    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: '🚫 You are not authorized to use this command.', ephemeral: true });
    }

    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      return interaction.reply({ content: '❌ I am not in a voice channel.', ephemeral: true });
    }

    connection.destroy();
    await interaction.reply({ content: '👋 Left the voice channel.', ephemeral: true });
  }
};
