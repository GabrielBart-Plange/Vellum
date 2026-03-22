import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import dotenv from 'dotenv';
import { db } from './db/database';
import { setupListener } from './modules/listener';
import { setupSummarizer } from './modules/summarizer';
import { setupServerManager } from './modules/serverManager';
import { setupExternalControl } from './modules/externalControl';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🤖 Logged in as ${readyClient.user.tag}`);
  
  console.log('📡 Vellum Server Operations System is online.');
});

// Setup Modules
setupListener(client);
setupSummarizer(client);
setupServerManager(client);
setupExternalControl(client);

// Start with extra error handling
async function start() {
  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error: any) {
    console.error('❌ Failed to login to Discord:');
    if (error.code === 'DisallowedIntents') {
        console.error('   Error: DisallowedIntents');
        console.error('   Solution: You MUST enable "Message Content Intent" in the Discord Developer Portal under the "Bot" tab.');
    } else {
        console.error(error);
    }
    process.exit(1);
  }
}

start();
