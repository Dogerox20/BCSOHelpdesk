const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
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

      await member.send({ embeds: [welcomeEmbed] });

      console.log(`[Welcome] Sent welcome DM to ${member.user.tag}`);
    } catch (err) {
      console.error(`[Welcome] Failed to DM ${member.user.tag}: ${err.message}`);
    }
  },
};
