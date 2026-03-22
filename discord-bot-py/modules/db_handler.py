import aiosqlite
import os
import logging
from discord.ext import commands

logger = logging.getLogger("VellumBot.DB")

class DBHandler(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db_path = "vellum_bot.db"

    async def cog_load(self):
        await self.init_db()

    async def init_db(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    discord_id TEXT UNIQUE,
                    content TEXT,
                    author_id TEXT,
                    author_name TEXT,
                    channel_id TEXT,
                    channel_name TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    category TEXT,
                    processed_ai INTEGER DEFAULT 0
                )
            ''')
            await db.execute('''
                CREATE TABLE IF NOT EXISTS user_stats (
                    user_id TEXT PRIMARY KEY,
                    messages_sent INTEGER DEFAULT 0,
                    bugs_reported INTEGER DEFAULT 0,
                    features_suggested INTEGER DEFAULT 0,
                    xp INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1
                )
            ''')
            await db.commit()
            logger.info("Database initialized.")

    async def save_message(self, message):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                INSERT OR IGNORE INTO messages 
                (discord_id, content, author_id, author_name, channel_id, channel_name)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (str(message.id), message.content, str(message.author.id), 
                  message.author.name, str(message.channel.id), message.channel.name))
            await db.commit()

async def setup(bot):
    await bot.add_cog(DBHandler(bot))
