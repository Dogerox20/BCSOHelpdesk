const { SlashCommandBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

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

    const filePath = path.join(__dirname, '..', 'audio', 'troll.mp3');

    if (!fs.existsSync(filePath)) {
      return interaction.reply({ content: '❌ Audio file not found.', ephemeral: true });
    }

    await interaction.reply({ content: '🔊 Attempting to play audio...' });

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    // Catch connection errors early
    connection.on('error', err => {
      console.error('🚨 Voice connection error:', err);
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
      console.log('✅ Voice connection established.');

      const resource = createAudioResource(filePath);
      const player = createAudioPlayer();

      player.on('error', error => {
        console.error('🎧 Audio player error:', error);
      });

      player.play(resource);
      connection.subscribe(player);

      await entersState(player, AudioPlayerStatus.Playing, 10_000);
      console.log('▶️ Audio is now playing.');

      player.once(AudioPlayerStatus.Idle, () => {
        console.log('🎵 Playback ended, destroying connection.');
        connection.destroy();
      });

    } catch (err) {
      console.error('❌ Playback Error:', err);
      connection.destroy();
      await interaction.editReply({ content: `❌ Playback Error: ${err.name}: ${err.message}` });
    }
  }
};
