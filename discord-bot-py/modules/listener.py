import discord
from discord.ext import commands
import logging

import os

logger = logging.getLogger("VellumBot.Listener")

class Listener(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        # Channel IDs to monitor for feedback/bugs
        self.monitored_channel_ids = [
            os.getenv("BUG_REPORTS_CHANNEL_ID"),
            os.getenv("FEATURE_REQUESTS_CHANNEL_ID"),
            os.getenv("SUPPORT_CHAT_CHANNEL_ID"),
            os.getenv("DEV_UPDATES_CHANNEL_ID")
        ]
        # Clean up any None values
        self.monitored_channel_ids = [int(cid) for cid in self.monitored_channel_ids if cid]

    @commands.Cog.listener()
    async def on_message(self, message):
        if message.author.bot:
            return

        # Check if the channel ID is in our monitor list
        if message.channel.id in self.monitored_channel_ids:
            logger.info(f"Captured message from {message.channel.name}: {message.content[:50]}...")
            
            # Save to DB via the DBHandler cog
            db_handler = self.bot.get_cog("DBHandler")
            if db_handler:
                await db_handler.save_message(message)
            else:
                logger.warning("DBHandler cog not found, message not saved.")

async def setup(bot):
    await bot.add_cog(Listener(bot))
