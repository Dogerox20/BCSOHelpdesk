// ✅ utils/embedLogger.js
const { EmbedBuilder } = require('discord.js');
const LOG_CHANNEL_ID = '1350703697205792861';

module.exports = async function logCommand({ client, commandName, user, status, description }) {
  try {
    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle(`📘 Command Used: /${commandName}`)
      .setColor(status === 'Success' ? 'Green' : status === 'Failed' ? 'Red' : 'Yellow')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
        { name: 'Status', value: status, inline: true },
        { name: 'Time', value: new Date().toLocaleString(), inline: false },
        { name: 'Details', value: description || 'No description provided.' }
      )
      .setFooter({ text: 'Command Log' });

    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('❌ Failed to log command:', err);
  }
};
