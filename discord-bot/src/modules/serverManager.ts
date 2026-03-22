import { Client, Events, TextChannel, EmbedBuilder } from 'discord.js';

export function setupServerManager(client: Client) {
  // Onboarding: Welcome new members
  client.on(Events.GuildMemberAdd, async (member) => {
    console.log(`👋 New member joined: ${member.user.tag}`);

    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    const rulesChannelId = process.env.RULES_CHANNEL_ID;

    if (!welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(welcomeChannelId) as TextChannel;
    if (channel) {
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Welcome to Vellum, ${member.user.username}! 🏺`)
        .setDescription(`We're glad to have you here. Please make sure to check out the <#${rulesChannelId}> to get started.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await channel.send({ embeds: [welcomeEmbed] });
    }
  });

  // Future: Add role assignment logic here (e.g., via button/reaction)
}
