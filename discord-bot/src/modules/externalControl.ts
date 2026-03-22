import express from 'express';
import { Client, TextChannel } from 'discord.js';
import { db } from '../db/database';
import { sendDailyDigest } from './summarizer';

export function setupExternalControl(client: Client) {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

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

  app.listen(port, () => {
    console.log(`🌐 External Control API is running on port ${port}`);
  });
}
