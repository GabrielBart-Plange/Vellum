/**
 * Discord Service for interacting with the Vellum Discord Bot External API.
 */
export const discordService = {
    /**
     * Sends an alert message to a Discord channel.
     */
    sendAlert: async (message: string, channelId?: string) => {
        try {
            const botApiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:4000';
            const botApiKey = process.env.BOT_API_KEY || process.env.NEXT_PUBLIC_BOT_API_KEY;

            const response = await fetch(`${botApiUrl}/api/discord/alert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': botApiKey || ''
                },
                body: JSON.stringify({ message, channelId })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("[DiscordService] Failed to send alert:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("[DiscordService] Error sending alert:", error);
            return false;
        }
    },

    /**
     * Specifically formats and sends a moderation report alert.
     */
    reportInDiscord: async (report: { 
        contentType: string, 
        contentId: string, 
        contentTitle: string, 
        reason: string, 
        reporterEmail: string 
    }) => {
        const message = `🔔 **NEW MODERATION REPORT**\n` +
            `**Type:** ${report.contentType.toUpperCase()}\n` +
            `**Title:** ${report.contentTitle}\n` +
            `**ID:** \`${report.contentId}\`\n` +
            `**Reason:** ${report.reason}\n` +
            `**Reporter:** ${report.reporterEmail}\n` +
            `*Review required in the dashboard.*`;
        
        return discordService.sendAlert(message);
    }
};
