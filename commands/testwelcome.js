const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('Send the BCSO welcome message to a specified user.')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('The Discord ID of the user to DM')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const targetId = interaction.options.getString('user_id');
    const targetUser = await client.users.fetch(targetId).catch(() => null);

    const welcomeEmbed = new EmbedBuilder()
      .setColor('#2f3136')
      .setTitle('👋 Welcome to the Blaine County Sheriff\'s Office!')
      .setThumbnail('https://images-ext-1.discordapp.net/external/1HtOwNKGPE-pLJFX0Qlb62Dt8bT1FzpoQFMnD5U2pAQ/%3Fsize%3D4096/https/cdn.discordapp.com/icons/1319706747908263956/a11bda90af53e8cc549c6e3bd408e9bb.png?format=webp&quality=lossless')
      .setDescription(
        `We are glad you chose us over the other departments and **congratulations on passing your onboarding process**.

I am the **BCSO Helpdesk**, also known as **Desk Sergeant Deborah**. I'm responsible for assisting Sergeants with their duties and Deputies with clocking in and out.

If you need any assistance with the bot, please run the **/help** command. For anything else, please reach out to the person who onboarded you or any available **Sergeant**.

**Welcome aboard, Deputy! 🚓**`
      )
      .setFooter({ text: 'BCSO Helpdesk • Automated Assistant' });

    await interaction.deferReply({ ephemeral: true });

    if (!targetUser) {
      return interaction.editReply('❌ Could not find a user with that ID.');
    }

    try {
      await targetUser.send({ embeds: [welcomeEmbed] });
      await interaction.editReply(`✅ Sent the welcome message to <@${targetUser.id}>.`);
    } catch (err) {
      console.error(`[TestWelcome] Failed to DM user ${targetId}:`, err);
      await interaction.editReply('❌ I couldn’t send a DM to that user. They may have DMs disabled.');
    }
  },
};
