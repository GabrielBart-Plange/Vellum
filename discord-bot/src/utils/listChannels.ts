import { Client, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`\n✅ Connected as ${readyClient.user.tag}`);
  console.log(`📂 Listing all channels across ${readyClient.guilds.cache.size} servers:\n`);

  readyClient.guilds.cache.forEach((guild) => {
    console.log(`🏰 Server: ${guild.name} (${guild.id})`);
    
    // Filter and sort channels that have a position (base channels)
    const channels = guild.channels.cache
      .filter(c => 'position' in c)
      .sort((a, b) => ((a as any).position || 0) - ((b as any).position || 0));
    
    channels.forEach((channel) => {
      const type = channel.type === 0 ? 'TEXT' : channel.type === 2 ? 'VOICE' : channel.type === 4 ? 'CATEGORY' : 'OTHER';
      console.log(`   [${type.padEnd(8)}] ${channel.name.padEnd(30)} ID: ${channel.id}`);
    });
    console.log('');
  });

  process.exit(0);
});

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ Error: DISCORD_TOKEN not found in .env file.');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('❌ Failed to login:', err.message);
  process.exit(1);
});
