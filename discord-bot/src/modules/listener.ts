import { Client, Events, Message } from 'discord.js';
import { db } from '../db/database';
import { randomUUID } from 'crypto';

const CHANNEL_CONFIG: Record<string, string> = {
  '1474317463264170088': 'bug',
  '1474317372985839711': 'feature',
  '1474306854288101499': 'support',
  '1474317289833631826': 'dev_update'
};

const TARGET_CHANNELS = Object.keys(CHANNEL_CONFIG);

export function setupListener(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    // Ignore bots
    if (message.author.bot) return;

    // Only listen to target channels
    if (!TARGET_CHANNELS.includes(message.channelId)) return;

    // Basic Noise Filter (Can be replaced with LLM call)
    if (isNoise(message.content)) {
      console.log(`🔇 Filtered noise from ${message.author.username}: ${message.content.substring(0, 20)}...`);
      return;
    }

    // Determine item type
    const type = CHANNEL_CONFIG[message.channelId] || determineType(message.content, message.channelId);

    // Save to Log
    try {
      db.logMessage({
        id: randomUUID(),
        channelId: message.channelId,
        userId: message.author.id,
        authorName: message.author.username,
        content: message.content,
        type: type,
        timestamp: Date.now(),
        processed: 0
      });
      console.log(`✅ Logged ${type} from ${message.author.username}`);
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  });
}

function isNoise(text: string): boolean {
  const t = text.toLowerCase().trim();
  // Very basic noise rejection. An LLM API call goes here in the future.
  if (t.length < 15 && !t.includes('bug') && !t.includes('issue')) return true;
  if (t === 'thanks' || t === 'me too' || t === 'same') return true;
  return false;
}

function determineType(text: string, channelId: string): string {
  // If we rely on channel structure:
  // if (channelId === 'BUG_CHANNEL_ID') return 'bug';
  
  const t = text.toLowerCase();
  if (t.includes('bug') || t.includes('issue') || t.includes('broken')) return 'bug';
  if (t.includes('add') || t.includes('please') || t.includes('idea')) return 'feature';
  return 'general_feedback';
}
