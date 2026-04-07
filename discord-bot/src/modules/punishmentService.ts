import { db as firestore } from '../db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { Client, TextChannel } from 'discord.js';

export const punishmentService = {
  /**
   * Applies a punishment to a user in both Discord and the Vellum app
   */
  applyPunishment: async (client: Client, targetId: string, content: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`[PunishmentService] Applying punishment to ${targetId}: ${content}`);

      // 1. App-side punishment: XP Reduction
      if (content.toLowerCase().includes('xp reduction') || content.toLowerCase().includes('warning')) {
        const userRef = firestore.collection('users').doc(targetId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          const userData = userDoc.data() || {};
          let reductionAmount = 0;
          let isWarning = content.toLowerCase().includes('warning');

          if (isWarning) {
            // Escalation logic: Track warnings
            const warningCount = (userData.warningCount || 0) + 1;
            
            if (warningCount >= 3) {
              // Level 2 Escalation: Auto-XP Reduction + Warning
              reductionAmount = 100;
              content = `⚠️ ESCALATED: 3rd Warning. ${content} + 100 XP Reduction.`;
            } else if (warningCount >= 5) {
              // Level 3 Escalation: Major XP Reduction
              reductionAmount = 500;
              content = `🚨 CRITICAL ESCALATION: ${warningCount}th Warning. ${content} + 500 XP Reduction.`;
            }

            await userRef.update({
              warningCount: FieldValue.increment(1),
              lastWarningAt: Date.now()
            });
          } else {
            // Direct XP reduction
            const xpMatch = content.match(/(\d+)\s*xp/i);
            reductionAmount = xpMatch ? parseInt(xpMatch[1]) : 50;
          }

          if (reductionAmount > 0) {
            await userRef.update({
              xp: FieldValue.increment(-reductionAmount),
              lastModerationAction: {
                type: isWarning ? 'warning_escalation' : 'xp_reduction',
                amount: reductionAmount,
                reason: content,
                timestamp: Date.now()
              }
            });
            console.log(`[PunishmentService] Reduced ${reductionAmount} XP for user ${targetId} due to ${isWarning ? 'warning escalation' : 'direct action'}`);
          }
        }
      }

      // 2. Discord-side notification (and potential mute/kick if implemented)
      const logChannelId = process.env.LOG_CHANNEL_ID;
      if (logChannelId) {
        const channel = client.channels.cache.get(logChannelId) as TextChannel;
        if (channel) {
          await channel.send(`🛡️ **Moderation Action Applied:**\n**Target:** <@${targetId}>\n**Action:** ${content}`);
        }
      }

      // 3. DM the user (optional but good practice)
      try {
        const user = await client.users.fetch(targetId);
        if (user) {
          await user.send(`⚠️ **Vellum Moderation Notification:**\nA moderation action has been applied to your account based on behavioral analysis: \n\n> ${content}`);
        }
      } catch (e) {
        console.warn(`[PunishmentService] Could not DM user ${targetId}`);
      }

      // 4. Log to history
      await firestore.collection('discord_mod_history').add({
        targetId,
        action: content,
        timestamp: Date.now(),
        type: content.toLowerCase().includes('xp') ? 'xp_reduction' : 'other'
      });

      return { success: true, message: 'Punishment applied successfully' };
    } catch (error) {
      console.error(`[PunishmentService] Error applying punishment:`, error);
      return { success: false, message: (error as Error).message };
    }
  }
};
