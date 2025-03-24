// commands/say.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something in this channel.')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true)
    ),

  async execute(interaction) {
    const ownerId = '1229398099567317023';
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: '🚫 You are not authorized to use this command.', ephemeral: true });
    }

    const message = interaction.options.getString('message');
    await interaction.reply({ content: '✅ Message sent!', ephemeral: true });
    await interaction.channel.send(message);
  }
};
