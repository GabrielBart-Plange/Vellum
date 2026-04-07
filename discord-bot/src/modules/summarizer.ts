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
  const now = Date.now();
  
  // Fetch messages from the last 24 hours using the new Firestore helper
  const recentMessages = await db.getRecentMessages(24);

  if (recentMessages.length === 0) {
    console.log('No recent messages to summarize.');
    return;
  }

  // Limit context to last 150 messages to avoid token overflow
  const messagesToSummarize = recentMessages.slice(0, 150);
  const summary = await generateLLMSummary(messagesToSummarize);

  // Log to Database for Dashboard Display
  await db.logSummary(summary);
  console.log('✅ Daily Digest saved to Firestore and ready for dashboard.');
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
      I will provide you with a list of messages from the last 24 hours from various Discord channels, including behavioral analysis data.
      
      Your job is to:
      1. Group them into "Bugs", "Feature Requests", and "General Feedback".
      2. Analyze Behavioral Health: Summarize average toxicity, spam, and constructive levels based on the data.
      3. Identify trends or repeated issues.
      4. Highlight any urgent issues or high-risk users that need the developer's attention.

      Messages Data (with probabilities):
      ${messages.map(m => `[${m.type}] ${m.authorName}: ${m.content} (Tox: ${m.probabilities?.toxic || 0}, Spam: ${m.probabilities?.spam || 0}, Const: ${m.probabilities?.constructive || 0})`).join('\n')}

      Format the output in clean Markdown. Include a "Server Health Overview" section with the behavioral metrics. Be concise but insightful.
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
