/**
 * Service to communicate with the Vellum Discord Bot API.
 * Allows the website to trigger Discord notifications and alerts.
 */

const DISCORD_BOT_API = process.env.NEXT_PUBLIC_DISCORD_BOT_API || "http://localhost:4001/api/discord";

export const discordNotificationService = {
  /**
   * Sends a general alert to the configured log channel.
   */
  async sendAlert(message: string, channelId?: string) {
    try {
      const response = await fetch(`${DISCORD_BOT_API}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, channelId }),
      });
      return await response.json();
    } catch (error) {
      console.error("[Discord Service] Failed to send alert:", error);
      return { success: false, error };
    }
  },

  /**
   * Formats and sends a "New Content" notification.
   */
  async notifyContentPublished(data: {
    title: string;
    authorName: string;
    type: 'novel' | 'story';
    url: string;
  }) {
    const message = `📚 **New ${data.type === 'novel' ? 'Novel' : 'Short Story'} Published!**\n\n**${data.title}** by *${data.authorName}*\n\nRead it here: ${data.url}`;
    
    // Send to announcements or release-log channel if specified, otherwise default
    return this.sendAlert(message);
  }
};
