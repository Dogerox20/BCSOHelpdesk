// commands/help.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('DMs you the bot help and GitHub link.'),

  async execute(interaction) {
    const helpMessage = `
📘 **BCSO Helpdesk GitHub**
https://github.com/Dogerox20/BCSO-Helpdesk-Help

The following GitHub has all of the information related to the bot including commands and what they do.

🐛 **Found a bug?**
Please report it in <#1353567410250321950>

💡 **Have a suggestion?**
Share it in <#1353567420727693425>
    `;

    try {
      await interaction.user.send(helpMessage);
      await interaction.reply({ content: '📬 Check your DMs!', ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: '❌ I couldn’t send you a DM. Please check your privacy settings.', ephemeral: true });
    }
  }
};
