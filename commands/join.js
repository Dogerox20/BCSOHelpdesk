const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Make the bot join your voice channel.'),

  async execute(interaction) {
    const ownerId = '1229398099567317023';

    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: '🚫 You are not authorized to use this command.', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(ownerId);
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '❌ You must be in a voice channel to use this command.', ephemeral: true });
    }

    try {
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      await interaction.reply({ content: `✅ Joined <#${voiceChannel.id}>`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Failed to join your voice channel.', ephemeral: true });
    }
  }
};
