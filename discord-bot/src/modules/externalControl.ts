import express from 'express';
import cors from 'cors';
import { Client, TextChannel } from 'discord.js';
import { db } from '../db/database';
import { sendDailyDigest } from './summarizer';

export function setupExternalControl(client: Client) {
  const app = express();
  const port = process.env.PORT || 4000;

  console.log(`📡 Preparing External Control API on port ${port}...`);

  app.use(cors());
  app.use(express.json());
  
  // Explicitly log every request to help debug frontend/backend communication
  app.use((req, res, next) => {
    console.log(`🌐 [API] ${req.method} ${req.url}`);
    next();
  });

  // ... (rest of the file remains same)

  // Root Status Check
  app.get('/', (req, res) => {
    res.json({ 
      status: 'online', 
      system: 'Vellum Discord Operations Bot',
      version: '1.0.0',
      endpoints: [
        'GET /api/discord/daily-summary',
        'GET /api/discord/logs',
        'POST /api/discord/alert'
      ]
    });
  });

  // GET /api/discord/daily-summary
  // Triggers and returns the daily summary
  app.get('/api/discord/daily-summary', async (req, res) => {
    try {
      // In a real scenario, we might want to just return the latest saved summary
      // But for now, we'll trigger a fresh generation
      await sendDailyDigest(client);
      res.json({ status: 'success', message: 'Summary generated and posted to Discord.' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: (error as Error).message });
    }
  });

  // POST /api/discord/alert
  // Allows external systems to post alert messages to a specific channel
  app.post('/api/discord/alert', async (req, res) => {
    const { message, channelId } = req.body;
    
    if (!message) {
      return res.status(400).json({ status: 'error', message: 'Message content is required.' });
    }

    const targetChannelId = channelId || process.env.LOG_CHANNEL_ID;
    
    if (!targetChannelId) {
      return res.status(400).json({ status: 'error', message: 'Target channel ID is required.' });
    }

    try {
      const channel = client.channels.cache.get(targetChannelId) as TextChannel;
      if (channel) {
        await channel.send(`🚨 **EXTERNAL ALERT:** ${message}`);
        res.json({ status: 'success', message: 'Alert sent to Discord.' });
      } else {
        res.status(404).json({ status: 'error', message: 'Channel not found.' });
      }
    } catch (error) {
      res.status(500).json({ status: 'error', message: (error as Error).message });
    }
  });

  // GET /api/discord/logs
  // Returns raw logs from the JSON DB
  app.get('/api/discord/logs', (req, res) => {
    try {
      const data = db.read();
      res.json(data.messages);
    } catch (error) {
      res.status(500).json({ status: 'error', message: (error as Error).message });
    }
  });

  // GET /api/discord/admin/summaries
  // Returns all AI insights
  app.get('/api/discord/admin/summaries', (req, res) => {
    try {
      const data = db.read();
      res.json(data.summaries || []);
    } catch (error) {
      res.status(500).json({ status: 'error', message: (error as Error).message });
    }
  });

  // GET /api/discord/admin/config
  // Fetches current channel configuration (with optional Import from Discord)
  app.get('/api/discord/admin/config', async (req, res) => {
    const { channelId } = req.query;
    if (!channelId) return res.status(400).json({ error: 'Channel ID required' });

    try {
      let config = db.getAdminConfig(channelId as string);
      
      // If no config exists, try to "Import" from Discord
      if (!config) {
        const channel = client.channels.cache.get(channelId as string) as TextChannel;
        if (channel) {
          const messages = await channel.messages.fetch({ limit: 1 });
          const lastMessage = messages.first();
          if (lastMessage && lastMessage.author.id === client.user?.id) {
            config = { text: lastMessage.content, lastUpdated: lastMessage.createdTimestamp };
            db.saveAdminConfig(channelId as string, lastMessage.content);
            db.trackAdminMessage(channelId as string, lastMessage.id);
          }
        }
      }

      res.json(config || { text: "", lastUpdated: 0 });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/discord/admin/update
  // Pushes dashboard content to Discord
  app.post('/api/discord/admin/update', async (req, res) => {
    const { channelId, text, mode } = req.body; // mode: 'replace', 'edit', 'append'
    if (!channelId || !text) return res.status(400).json({ error: 'Missing data' });

    try {
      const channel = client.channels.cache.get(channelId) as TextChannel;
      if (!channel) return res.status(404).json({ error: 'Channel not found' });

      let resultMessage;
      const lastMessageId = db.getAdminMessageId(channelId);

      if (mode === 'edit' && lastMessageId) {
        try {
          const msg = await channel.messages.fetch(lastMessageId);
          resultMessage = await msg.edit(text);
        } catch (e) {
          // If edit fails (message deleted), send new
          resultMessage = await channel.send(text);
        }
      } else if (mode === 'replace' && lastMessageId) {
          try {
            const msg = await channel.messages.fetch(lastMessageId);
            await msg.delete();
          } catch (e) {}
          resultMessage = await channel.send(text);
      } else {
        resultMessage = await channel.send(text);
      }

      // Update DB state
      db.saveAdminConfig(channelId, text);
      db.trackAdminMessage(channelId, resultMessage.id);

      res.json({ status: 'success', message: 'Channel updated successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`🌐 External Control API is running on port ${port} (0.0.0.0)`);
  });
}
