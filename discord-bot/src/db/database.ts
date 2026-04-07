import { db as firestore } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';

export const db = {
  logMessage: async (message: any) => {
    try {
      await firestore.collection('discord_logs').doc(message.id).set({
        ...message,
        createdAt: Timestamp.now(),
        processed: 0
      });
    } catch (error) {
      console.error('[Firestore] Failed to log message:', error);
    }
  },

  logSummary: async (summary: string) => {
    try {
      await firestore.collection('discord_summaries').add({
        content: summary,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('[Firestore] Failed to log summary:', error);
    }
  },

  trackAdminMessage: async (channelId: string, messageId: string) => {
    try {
      await firestore.collection('discord_admin_tracking').doc(channelId).set({
        messageId,
        lastUpdated: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      console.error('[Firestore] Failed to track admin message:', error);
    }
  },

  saveAdminConfig: async (channelId: string, text: string) => {
    try {
      await firestore.collection('discord_admin_configs').doc(channelId).set({
        text,
        lastUpdated: Timestamp.now()
      });
    } catch (error) {
      console.error('[Firestore] Failed to save admin config:', error);
    }
  },

  getAdminConfig: async (channelId: string) => {
    try {
      const doc = await firestore.collection('discord_admin_configs').doc(channelId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('[Firestore] Failed to get admin config:', error);
      return null;
    }
  },

  getAdminMessageId: async (channelId: string) => {
    try {
      const doc = await firestore.collection('discord_admin_tracking').doc(channelId).get();
      return doc.exists ? doc.data()?.messageId : null;
    } catch (error) {
      console.error('[Firestore] Failed to get admin message ID:', error);
      return null;
    }
  },

  // Helper for historical fetches (used by summarizer)
  getRecentMessages: async (limitHours: number = 24) => {
    try {
      const cutoff = new Date(Date.now() - limitHours * 60 * 60 * 1000);
      const snapshot = await firestore.collection('discord_logs')
        .where('timestamp', '>', cutoff.getTime())
        .get();
      
      // Sort in-memory to avoid composite index requirement
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('[Firestore] Failed to fetch recent messages:', error);
      return [];
    }
  },

  getChannelConfig: async (): Promise<Record<string, string>> => {
    try {
      const doc = await firestore.collection('discord_settings').doc('channels').get();
      return doc.exists ? doc.data() as Record<string, string> : {};
    } catch (error) {
      console.error('[Firestore] Failed to get channel config:', error);
      return {};
    }
  },

  saveChannelConfig: async (config: Record<string, string>) => {
    try {
      await firestore.collection('discord_settings').doc('channels').set(config);
    } catch (error) {
      console.error('[Firestore] Failed to save channel config:', error);
    }
  }
};
