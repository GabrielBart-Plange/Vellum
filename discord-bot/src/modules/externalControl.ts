import express from 'express';
import cors from 'cors';
import { Client, TextChannel, ChannelType } from 'discord.js';
import { db } from '../db/database';
import { sendDailyDigest } from './summarizer';
import { ruleGenerator } from './ruleGenerator';
import { behaviorTracker } from './behaviorTracker';
import { updateLocalChannelConfig } from './listener';

export function setupExternalControl(client: Client) {
  const app = express();
  const port = process.env.PORT || 4000;

  console.log(`📡 Preparing External Control API on port ${port}...`);

  app.use(cors());
  app.use(express.json());
  
  // API Key Protection Middleware
  const apiKey = process.env.BOT_API_KEY;
  if (apiKey) {
    app.use((req, res, next) => {
      const requestKey = req.headers['x-api-key'];
      if (req.method !== 'GET' || req.path.includes('admin') || req.path.includes('moderation')) {
        if (requestKey !== apiKey) {
          console.warn(`🔒 [API] Unauthorized access attempt: ${req.method} ${req.url}`);
          return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
        }
      }
      next();
    });
  } else {
    console.warn('⚠️ [API] No BOT_API_KEY set. API is currently public.');
  }
  
  // Explicitly log every request to help debug frontend/backend communication
  app.use((req, res, next) => {
    console.log(`🌐 [API] ${req.method} ${req.url}`);
    next();
  });

  // Root Status Check
  app.get('/', (req, res) => {
    res.json({ 
      status: 'online', 
      system: 'Vellum Discord Operations Bot',
      version: '1.0.0',
      endpoints: [
        'GET /api/discord/daily-summary',
        'GET /api/discord/logs',
        'POST /api/discord/alert',
        'GET /api/discord/moderation/proposals',
        'POST /api/discord/moderation/proposals/handle',
        'GET /api/discord/moderation/risk-users',
        'POST /api/discord/moderation/generate-proposals',
        'GET /api/discord/admin/summaries',
        'GET /api/discord/admin/config',
        'POST /api/discord/admin/update'
      ]
    });
  });

  // Moderation: Get manual/AI moderation history
  app.get('/api/discord/moderation/history', async (req, res) => {
    try {
      const { db: firestore } = await import('../db/firebase');
      const snapshot = await firestore.collection('discord_mod_history')
        .get();
      
      // Sort in-memory to avoid index requirement
      const history = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);
      
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
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
  // Returns raw logs from Firestore
  app.get('/api/discord/logs', async (req, res) => {
    try {
      const messages = await db.getRecentMessages(48); // Last 48 hours
      res.json(messages);
    } catch (error) {
      res.status(500).json({ status: 'error', message: (error as Error).message });
    }
  });

  // GET /api/discord/admin/summaries
  // Returns all AI insights from Firestore
  app.get('/api/discord/admin/summaries', async (req, res) => {
    try {
      const { db: firestore } = await import('../db/firebase');
      const summariesSnapshot = await firestore.collection('discord_summaries')
        .get();
      
      // Sort in-memory to avoid index requirement
      const summaries = summariesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
      
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ status: 'error', message: (error as Error).message });
    }
  });

  // GET /api/discord/admin/config
  // Fetches current channel configuration
  app.get('/api/discord/admin/config', async (req, res) => {
    const { channelId } = req.query;
    if (!channelId) return res.status(400).json({ error: 'Channel ID required' });

    try {
      let config = await db.getAdminConfig(channelId as string);
      
      // If no config exists, try to "Import" from Discord
      if (!config) {
        const channel = client.channels.cache.get(channelId as string) as TextChannel;
        if (channel) {
          const messages = await channel.messages.fetch({ limit: 1 });
          const lastMessage = messages.first();
          if (lastMessage && lastMessage.author.id === client.user?.id) {
            config = { text: lastMessage.content, lastUpdated: lastMessage.createdTimestamp };
            await db.saveAdminConfig(channelId as string, lastMessage.content);
            await db.trackAdminMessage(channelId as string, lastMessage.id);
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
      const lastMessageId = await db.getAdminMessageId(channelId);

      if (mode === 'edit' && lastMessageId) {
        try {
          const msg = await channel.messages.fetch(lastMessageId);
          resultMessage = await msg.edit(text);
        } catch (e) {
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
      await db.saveAdminConfig(channelId, text);
      await db.trackAdminMessage(channelId, resultMessage.id);

      res.json({ status: 'success', message: 'Channel updated successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/discord/moderation/user-spotlight
  // Returns a specific user's behavioral profile and recent logs
  app.get('/api/discord/moderation/user-spotlight', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
      const profile = await behaviorTracker.getUserProfile(userId as string);
      
      const { db: firestore } = await import('../db/firebase');
      const logsSnapshot = await firestore.collection('discord_logs')
        .where('userId', '==', userId)
        .get();
      
      const logs = logsSnapshot.docs
        .map(doc => doc.data())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);

      res.json({ profile, logs });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // --- Channel Management Endpoints ---

  // GET /api/discord/admin/channels
  // Returns all tracked channels and their types
  app.get('/api/discord/admin/channels', async (req, res) => {
    try {
      console.log('📡 [API] Fetching tracked channels configuration...');
      const config = await db.getChannelConfig();
      const channels = [];
      
      for (const [id, type] of Object.entries(config)) {
        const channel = client.channels.cache.get(id);
        channels.push({
          id,
          name: channel && 'name' in channel ? (channel as TextChannel).name : 'Unknown',
          type,
          exists: !!channel
        });
      }
      
      console.log(`✅ [API] Returning ${channels.length} tracked channels`);
      res.json(channels);
    } catch (error) {
      console.error('❌ [API] Error fetching channels:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/discord/admin/channels/create
  // Creates a new channel in Discord and adds it to tracking
  app.post('/api/discord/admin/channels/create', async (req, res) => {
    const { name, type, categoryId } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type required' });

    try {
      const guild = client.guilds.cache.first();
      if (!guild) return res.status(500).json({ error: 'Guild not found' });

      const newChannel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: categoryId || null
      });

      // Update configuration
      const config = await db.getChannelConfig();
      config[newChannel.id] = type;
      await db.saveChannelConfig(config);
      updateLocalChannelConfig(config);

      res.json({ 
        status: 'success', 
        channelId: newChannel.id, 
        message: `Channel #${name} created and added to tracking.` 
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/discord/admin/channels/delete
  // Deletes a channel from Discord and removes it from tracking
  app.post('/api/discord/admin/channels/delete', async (req, res) => {
    const { channelId } = req.body;
    if (!channelId) return res.status(400).json({ error: 'Channel ID required' });

    try {
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        await channel.delete();
      }

      // Update configuration
      const config = await db.getChannelConfig();
      delete config[channelId];
      await db.saveChannelConfig(config);
      updateLocalChannelConfig(config);

      res.json({ status: 'success', message: 'Channel deleted and removed from tracking.' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // --- Moderation & AI Intelligence Endpoints ---

  // GET /api/discord/moderation/proposals
  // Returns pending AI-generated rules/punishments
  app.get('/api/discord/moderation/proposals', async (req, res) => {
    try {
      const proposals = await ruleGenerator.getPendingProposals();
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/discord/moderation/proposals/handle
  // Approves or rejects a proposal
  app.post('/api/discord/moderation/proposals/handle', async (req, res) => {
    const { proposalId, status } = req.body;
    if (!proposalId || !status) return res.status(400).json({ error: 'Missing proposalId or status' });

    try {
      const success = await ruleGenerator.handleProposal(client, proposalId, status);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/discord/moderation/risk-users
  // Returns high-risk behavioral profiles
  app.get('/api/discord/moderation/risk-users', async (req, res) => {
    try {
      const users = await behaviorTracker.getHighRiskUsers(30);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/discord/moderation/generate-proposals
  // Manually triggers AI analysis for new rules/punishments
  app.post('/api/discord/moderation/generate-proposals', async (req, res) => {
    try {
      const proposals = await ruleGenerator.generateProposals();
      res.json({ success: true, count: proposals.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`🌐 External Control API is running on port ${port} (0.0.0.0)`);
  });
}
