import { Client, TextChannel } from 'discord.js';
import cron from 'node-cron';
import { db } from '../db/database';
import { Mistral } from '@mistralai/mistralai';

export function setupSummarizer(client: Client) {
  // Schedule Daily Digest (Every day at 8 AM)
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running Daily Digest...');
    await sendDailyDigest(client);
  });
}

export async function sendDailyDigest(client: Client) {
  const data = db.read();
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Filter messages from the last 24 hours
  const recentMessages = data.messages.filter((m: any) => m.timestamp > oneDayAgo);

  if (recentMessages.length === 0) {
    console.log('No recent messages to summarize.');
    return;
  }

  const summary = await generateLLMSummary(recentMessages);

  // Send to a specific dev/admin channel
  const logChannelId = process.env.LOG_CHANNEL_ID;
  if (!logChannelId || logChannelId === 'REPLACE_WITH_YOUR_PRIVATE_LOG_CHANNEL_ID') {
    console.error('LOG_CHANNEL_ID not set or default in .env');
    // For now, let's log to console so the user sees it even if channel ID isn't set.
    console.log('--- MISTRAL SUMMARY ---\n', summary);
    return;
  }

  const channel = client.channels.cache.get(logChannelId) as TextChannel;
  if (channel) {
    await channel.send({
      content: `📊 **Daily Server Operations Digest (Powered by Mistral)**\n\n${summary}`
    });
  } else {
    console.log('Could not find log channel by ID. Logging summary here:\n', summary);
  }
}

async function generateLLMSummary(messages: any[]): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  const modelName = process.env.LLM_MODEL || 'open-mistral-7b';
  
  if (!apiKey) {
    return '⚠️ Mistral API Key missing. Please provide a key in .env.\n\nRaw count of recent activity: ' + messages.length + ' messages.';
  }

  try {
    const client = new Mistral({ apiKey });

    const prompt = `
      You are an AI Server Operations Assistant for "Vellum".
      I will provide you with a list of messages from the last 24 hours from various Discord channels.
      Your job is to:
      1. Group them into "Bugs", "Feature Requests", and "General Feedback".
      2. Identify duplicates or repeated issues.
      3. Summarize the overall sentiment.
      4. Highlight any urgent issues that need the developer's attention.

      Messages:
      ${messages.map(m => `[${m.type}] ${m.authorName}: ${m.content}`).join('\n')}

      Format the output in clean Markdown. Be concise but insightful.
    `;

    const result = await client.chat.complete({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
    });

    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content as string;
    }
    
    return '⚠️ Mistral returned an empty response.';
  } catch (error) {
    console.error('Mistral Summary failed:', error);
    return '❌ Error generating Mistral summary. Check console logs.';
  }
}
