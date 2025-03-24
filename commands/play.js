// commands/play.js
const { SlashCommandBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a local MP3 file in your voice channel.'),

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

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5_000);

      const player = createAudioPlayer();
      const filePath = path.join(__dirname, '../audio/sample.mp3'); // You can rename 'sample.mp3' to any file you place in the /audio folder
      const resource = createAudioResource(filePath);

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      await interaction.reply({ content: '🎶 Playing audio...', ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to play audio.', ephemeral: true });
    }
  }
};
