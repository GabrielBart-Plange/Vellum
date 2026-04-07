import { Mistral } from '@mistralai/mistralai';
import { db as firestore } from '../db/firebase';
import { behaviorTracker, BehavioralProfile } from './behaviorTracker';
import { db } from '../db/database';
import { punishmentService } from './punishmentService';
import { Client, TextChannel } from 'discord.js';

export interface ProposedRule {
  id: string;
  type: 'rule' | 'punishment';
  target: string; // 'general' or specific 'userId'
  content: string;
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export const ruleGenerator = {
  /**
   * Generates proposed rules or punishments based on recent behavioral trends
   */
  generateProposals: async (): Promise<ProposedRule[]> => {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) return [];

    try {
      const mistral = new Mistral({ apiKey });
      
      // 1. Get high-risk users
      const highRiskUsers = await behaviorTracker.getHighRiskUsers(30); // Lower threshold for analysis
      
      // 2. Get overall server sentiment/trends (last 100 messages)
      const recentLogs = await db.getRecentMessages(24) as any[];
      const trends = {
        avgToxic: recentLogs.reduce((acc, log) => acc + (log.probabilities?.toxic || 0), 0) / (recentLogs.length || 1),
        avgSpam: recentLogs.reduce((acc, log) => acc + (log.probabilities?.spam || 0), 0) / (recentLogs.length || 1),
        avgNSFW: recentLogs.reduce((acc, log) => acc + (log.probabilities?.nsfw || 0), 0) / (recentLogs.length || 1),
        avgConstructive: recentLogs.reduce((acc, log) => acc + (log.probabilities?.constructive || 0), 0) / (recentLogs.length || 1),
      };

      const prompt = `
        You are an AI Server Governor for the "Vellum" Discord community. 
        Analyze the following behavioral data and propose new server rules or specific punishments (like XP reduction).
        
        Server Trends (Last 24h):
        - Average Toxicity: ${trends.avgToxic.toFixed(2)}
        - Average Spam: ${trends.avgSpam.toFixed(2)}
        - Average NSFW: ${trends.avgNSFW.toFixed(2)}
        - Average Constructive: ${trends.avgConstructive.toFixed(2)}
        
        High Risk Users:
        ${highRiskUsers.map(u => `- ${u.username} (ID: ${u.userId}, Risk: ${u.riskScore}, Toxic: ${u.averages.toxic.toFixed(2)}, Spam: ${u.averages.spam.toFixed(2)})`).join('\n')}
        
        Proposed punishments can include:
        - "XP Reduction": Reduce a user's XP in the Vellum app. (Specify amount, e.g. "50 XP Reduction")
        - "Mute": Temporary mute in Discord.
        - "Warning": Official warning recorded.
        
        Proposed rules should be concise and address current trends.
        
        Return ONLY a JSON array of objects:
        [
          {
            "type": "rule" | "punishment",
            "target": "general" | "userId",
            "content": "the actual rule text or punishment description",
            "reasoning": "why this is being proposed based on the data"
          }
        ]
      `;

      const result = await mistral.chat.complete({
        model: process.env.LLM_MODEL || 'open-mistral-7b',
        messages: [{ role: 'user', content: prompt }],
        responseFormat: { type: 'json_object' }
      });

      const content = result.choices?.[0]?.message?.content;
      if (typeof content === 'string') {
        const parsed = JSON.parse(content);
        // 1. Get existing pending proposals to avoid duplicates
        const existingProposals = await ruleGenerator.getPendingProposals();
        const pendingTargets = new Set(existingProposals.map((p: ProposedRule) => p.target));

        const proposals: ProposedRule[] = (Array.isArray(parsed) ? parsed : parsed.proposals || [])
          .filter((p: any) => p.target === 'general' || !pendingTargets.has(p.target)) // Only add if not already pending
          .map((p: any) => ({
            id: Math.random().toString(36).substring(2, 15),
            ...p,
            status: 'pending',
            createdAt: Date.now()
          }));

        // Store proposals in Firestore for admin review
        for (const proposal of proposals) {
          await firestore.collection('discord_proposals').doc(proposal.id).set(proposal);
        }

        return proposals;
      }
    } catch (error) {
      console.error('[RuleGenerator] Error generating proposals:', error);
    }
    return [];
  },

  /**
   * Fetches pending proposals for the dashboard
   */
  getPendingProposals: async (): Promise<ProposedRule[]> => {
    try {
      const snapshot = await firestore.collection('discord_proposals')
        .where('status', '==', 'pending')
        .get();
      
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ProposedRule))
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('[RuleGenerator] Error fetching proposals:', error);
      return [];
    }
  },

  /**
   * Approves or rejects a proposal
   */
  handleProposal: async (client: Client, proposalId: string, status: 'approved' | 'rejected'): Promise<boolean> => {
    try {
      const proposalRef = firestore.collection('discord_proposals').doc(proposalId);
      const proposalDoc = await proposalRef.get();
      
      if (!proposalDoc.exists) return false;
      const proposal = proposalDoc.data() as ProposedRule;

      await proposalRef.update({
        status,
        handledAt: Date.now()
      });
      
      // If approved and it's a punishment, apply it!
      if (status === 'approved') {
        if (proposal.type === 'punishment' && proposal.target !== 'general') {
          await punishmentService.applyPunishment(client, proposal.target, proposal.content);
        } else if (proposal.type === 'rule' && proposal.target === 'general') {
          // Post new rule to #rules channel
          const rulesChannelId = process.env.RULES_CHANNEL_ID;
          if (rulesChannelId) {
            const channel = client.channels.cache.get(rulesChannelId) as TextChannel;
            if (channel) {
              await channel.send(`📜 **New Community Rule Added:**\n\n${proposal.content}\n\n*Reasoning: ${proposal.reasoning}*`);
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error(`[RuleGenerator] Error handling proposal ${proposalId}:`, error);
      return false;
    }
  }
};
