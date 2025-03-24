const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays the troll.mp3 audio file (for authorized user only).'),

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

      const resource = createAudioResource(filePath);
      connection.subscribe(player);
      player.play(resource);

      player.once(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

    } catch (err) {
      console.error('Playback error:', err);
      await interaction.editReply({ content: '❌ Failed to connect or play audio.' });
    }
  }
};
