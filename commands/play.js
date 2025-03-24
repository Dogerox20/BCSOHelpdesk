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
      console.error('❌ File not found:', filePath);
      return interaction.reply({ content: '❌ Audio file not found.', ephemeral: true });
    }

    await interaction.reply({ content: '🔊 Attempting to play audio...' });

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
      console.log('✅ Voice connection established.');

      const resource = createAudioResource(filePath);
      const player = createAudioPlayer();

      player.play(resource);
      connection.subscribe(player);

      await entersState(player, AudioPlayerStatus.Playing, 5_000);
      console.log('▶️ Audio is now playing.');

      player.on(AudioPlayerStatus.Idle, () => {
        console.log('🔈 Playback finished.');
        connection.destroy();
      });

    } catch (err) {
      console.error('❌ Playback Error:', err);
      await interaction.editReply({ content: '❌ Failed to connect or play audio.' });
    }
  }
};
