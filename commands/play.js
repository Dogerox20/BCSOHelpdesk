const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays troll.mp3 (only for authorized user).'),

  async execute(interaction) {
    const allowedUserId = '1229398099567317023';

    if (interaction.user.id !== allowedUserId) {
      return interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
    }

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '❌ You must be in a voice channel to use this command.', ephemeral: true });
    }

    try {
      await interaction.reply({ content: '🔊 Attempting to play audio...' });

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 5_000);

      const player = createAudioPlayer();
      const filePath = path.join(__dirname, '..', 'audio', 'troll.mp3');

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error('❌ File not found at:', filePath);
        return interaction.editReply({ content: `❌ Audio file not found.` });
      }

      console.log('✅ Playing file from:', filePath);

      const resource = createAudioResource(filePath);
      connection.subscribe(player);
      player.play(resource);

      player.once(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

    } catch (err) {
      console.error('❌ Playback Error:', err);
      await interaction.editReply({ content: '❌ Failed to connect or play audio.' });
    }
  }
};
