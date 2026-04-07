import { Client, Events, Message, TextChannel } from 'discord.js';
import { db } from '../db/database';
import { randomUUID } from 'crypto';
import { Mistral } from '@mistralai/mistralai';

let dynamicChannelConfig: Record<string, string> = {
  '1474317463264170088': 'bug',
  '1474317372985839711': 'feature',
  '1474306854288101499': 'support',
  '1474317289833631826': 'dev_update',
  '1474304640165347398': 'fan_creation',
  '1474313522652647516': 'feedback',
  '1474310525813788764': 'support',
  '1474301996709314690': 'events'
};

export async function setupListener(client: Client) {
  // Sync with Firestore on startup
  const remoteConfig = await db.getChannelConfig();
  if (Object.keys(remoteConfig).length > 0) {
    dynamicChannelConfig = remoteConfig;
    console.log('📡 Synced dynamic channel configuration from Firestore');
  } else {
    // Save initial hardcoded config to Firestore if it's empty
    await db.saveChannelConfig(dynamicChannelConfig);
    console.log('📡 Initialized Firestore channel configuration');
  }

  // 1. Welcome Listener
  client.on(Events.GuildMemberAdd, async (member) => {
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (!welcomeChannelId) return;

    try {
      const channel = client.channels.cache.get(welcomeChannelId) as TextChannel;
      if (channel) {
        await channel.send(`👋 **Welcome to Vellum, ${member.user.username}!** We're glad you're here. Check out <#${process.env.RULES_CHANNEL_ID}> to get started!`);
      }
    } catch (error) {
      console.error('Failed to send welcome message:', error);
    }
  });

  // 2. Message Listener
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;
    
    // Refresh local config cache periodically or on demand (for simplicity, we'll use the variable)
    // In a high-scale app, we might use an event emitter to signal config changes
    if (!Object.keys(dynamicChannelConfig).includes(message.channelId)) return;

    // Use AI to filter clutter and categorize
    const assessment = await assessMessage(message.content, message.author.username);
    
    if (assessment.isClutter) {
      console.log(`🔇 AI Filtered clutter from ${message.author.username}: ${message.content.substring(0, 30)}...`);
      return;
    }

    // Save high-value messages to Firestore
    try {
      await db.logMessage({
        id: randomUUID(),
        channelId: message.channelId,
        userId: message.author.id,
        authorName: message.author.username,
        content: message.content,
        type: assessment.category || dynamicChannelConfig[message.channelId] || 'general',
        sentiment: assessment.sentiment,
        urgency: assessment.urgency,
        probabilities: assessment.probabilities,
        timestamp: Date.now(),
        processed: 0
      });
      console.log(`🚀 AI Logged ${assessment.category} from ${message.author.username} (Urgency: ${assessment.urgency})`);
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  });
}

// Export for externalControl to update
export function updateLocalChannelConfig(newConfig: Record<string, string>) {
  dynamicChannelConfig = newConfig;
}

async function assessMessage(text: string, author: string): Promise<{ 
  isClutter: boolean; 
  category?: string; 
  sentiment?: string; 
  urgency?: string;
  probabilities?: {
    spam: number;
    toxic: number;
    nsfw: number;
    constructive: number;
  }
}> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return { isClutter: text.length < 15 };

  try {
    const mistral = new Mistral({ apiKey });
    const prompt = `
      You are a Discord Community Manager for "Vellum".
      Analyze this message and determine its "substantive" value and behavioral probabilities.
      
      Behavioral Probabilities (0.0 to 1.0):
      - spam: Likelihood of being repetitive, bot-like, or useless noise.
      - toxic: Likelihood of being rude, insulting, or inflammatory.
      - nsfw: Likelihood of containing inappropriate content for a general audience.
      - constructive: Likelihood of being a high-value contribution.

      Message: "${text}"
      Author: ${author}

      Return ONLY a JSON object:
      {
        "isClutter": boolean,
        "category": "bug" | "feature" | "question" | "feedback" | "chat",
        "sentiment": "positive" | "negative" | "neutral",
        "urgency": "low" | "medium" | "high",
        "probabilities": {
          "spam": number,
          "toxic": number,
          "nsfw": number,
          "constructive": number
        },
        "reason": "short explanation"
      }
    `;

    const result = await mistral.chat.complete({
      model: process.env.LLM_MODEL || 'open-mistral-7b',
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' }
    });

    const content = result.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
      const parsed = JSON.parse(content);
      // Log almost everything to build accurate behavioral profiles, 
      // but still filter out "isClutter" if the AI explicitly says it's trash (like just "lol" or "ok")
      return {
        isClutter: parsed.isClutter && parsed.probabilities.constructive < 0.1 && parsed.probabilities.spam > 0.8,
        category: parsed.category,
        sentiment: parsed.sentiment,
        urgency: parsed.urgency,
        probabilities: parsed.probabilities
      };
    }
  } catch (error) {
    console.error("AI Assessment failed, falling back to basic filter:", error);
  }

  // Fallback to basic length filter
  return { isClutter: text.length < 20 };
}
