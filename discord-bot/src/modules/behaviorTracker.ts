import { db as firestore } from '../db/firebase';
import { db } from '../db/database';

export interface BehavioralProfile {
  userId: string;
  username: string;
  averages: {
    spam: number;
    toxic: number;
    nsfw: number;
    constructive: number;
  };
  messageCount: number;
  lastActive: number;
  riskScore: number; // 0 to 100
}

export const behaviorTracker = {
  /**
   * Calculates a behavioral profile for a user based on their recent messages
   */
  getUserProfile: async (userId: string, limit: number = 50): Promise<BehavioralProfile | null> => {
    try {
      const snapshot = await firestore.collection('discord_logs')
        .where('userId', '==', userId)
        .get();

      if (snapshot.empty) return null;

      // Sort in-memory to avoid composite index requirement
      const logs = snapshot.docs
        .map(doc => doc.data())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      const username = logs[0].authorName || 'Unknown';
      
      const sums = { spam: 0, toxic: 0, nsfw: 0, constructive: 0 };
      let validCount = 0;

      logs.forEach(log => {
        if (log.probabilities) {
          sums.spam += log.probabilities.spam || 0;
          sums.toxic += log.probabilities.toxic || 0;
          sums.nsfw += log.probabilities.nsfw || 0;
          sums.constructive += log.probabilities.constructive || 0;
          validCount++;
        }
      });

      if (validCount === 0) return null;

      const averages = {
        spam: sums.spam / validCount,
        toxic: sums.toxic / validCount,
        nsfw: sums.nsfw / validCount,
        constructive: sums.constructive / validCount
      };

      // Risk score calculation: Weighted averages of negative behaviors vs constructive
      // (toxic * 0.5 + spam * 0.3 + nsfw * 0.2) * (1 - constructive * 0.5)
      const rawRisk = (averages.toxic * 0.5 + averages.spam * 0.3 + averages.nsfw * 0.2);
      const riskScore = Math.min(100, Math.round(rawRisk * (1 - averages.constructive * 0.5) * 100));

      return {
        userId,
        username,
        averages,
        messageCount: validCount,
        lastActive: logs[0].timestamp,
        riskScore
      };
    } catch (error) {
      console.error(`[BehaviorTracker] Error getting profile for ${userId}:`, error);
      return null;
    }
  },

  /**
   * Gets a list of high-risk users in the server
   */
  getHighRiskUsers: async (threshold: number = 40): Promise<BehavioralProfile[]> => {
    try {
      // For simplicity, we'll fetch recent unique users from logs and calculate their profiles
      // In a large server, this would need a more optimized approach (like a 'users' collection in the bot db)
      const recentLogs = await firestore.collection('discord_logs')
        .limit(200)
        .get();

      const uniqueUserIds = new Set<string>();
      recentLogs.docs.forEach(doc => uniqueUserIds.add(doc.data().userId));

      const profiles: BehavioralProfile[] = [];
      for (const userId of uniqueUserIds) {
        const profile = await behaviorTracker.getUserProfile(userId);
        if (profile && profile.riskScore >= threshold) {
          profiles.push(profile);
        }
      }

      return profiles.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('[BehaviorTracker] Error getting high risk users:', error);
      return [];
    }
  }
};
