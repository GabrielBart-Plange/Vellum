import ollama
import aiosqlite
import logging
import asyncio
from discord.ext import commands, tasks

logger = logging.getLogger("VellumBot.AI")

class AIAnalyzer(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.model = "tinyllama" # Using the successfully pulled model
        self.analyze_loop.start()

    def cog_unload(self):
        self.analyze_loop.cancel()

    @tasks.loop(minutes=10) # Run analysis every 10 minutes
    async def analyze_loop(self):
        logger.info("Starting scheduled AI analysis...")
        await self.process_pending_messages()

    async def process_pending_messages(self):
        db_handler = self.bot.get_cog("DBHandler")
        if not db_handler:
            logger.error("DBHandler cog not found.")
            return

        async with aiosqlite.connect(db_handler.db_path) as db:
            async with db.execute("SELECT id, content, author_id FROM messages WHERE processed_ai = 0") as cursor:
                rows = await cursor.fetchall()
                
                for row in rows:
                    msg_id, content = row
                    logger.info(f"Analyzing message {msg_id}...")
                    
                    try:
                        classification = await self.classify_message(content)
                        await db.execute(
                            "UPDATE messages SET category = ?, processed_ai = 1 WHERE id = ?",
                            (classification, msg_id)
                        )
                        
                        # AWARD XP based on category
                        if classification in ["BUG_REPORT", "FEATURE_REQUEST"]:
                             await self.award_contribution_xp(row[2], classification) # row[2] is author_id
                             
                        await db.commit()
                        logger.info(f"Message {msg_id} classified as: {classification}")
                    except Exception as e:
                        logger.error(f"Error analyzing message {msg_id}: {e}")

    async def classify_message(self, content):
        """Classifies a single message using local AI."""
        prompt = f"""
        [SYSTEM]
        You are the Vellum Community Analyst. Your job is to categorize incoming Discord messages to help developers track feedback.
        
        [CATEGORIES]
        - BUG_REPORT: Technical issues, errors, or broken features.
        - FEATURE_REQUEST: Suggestions for new features or improvements.
        - USER_SUPPORT: Questions about how to use the app or platform.
        - GENERAL_CHAT: Social interaction, memes, or trivial comments.
        
        [MESSAGE]
        "{content}"
        
        [OUTPUT]
        Return only the category key (e.g., BUG_REPORT).
        """
        
        try:
            response = await asyncio.to_thread(
                ollama.generate, 
                model=self.model, 
                prompt=prompt
            )
            category = response['response'].strip().upper()
            valid_categories = ["BUG_REPORT", "FEATURE_REQUEST", "USER_SUPPORT", "GENERAL_CHAT"]
            return category if category in valid_categories else "GENERAL_CHAT"
        except Exception as e:
            logger.warning(f"Ollama classification failed: {e}")
            return "UNKNOWN"

    async def generate_community_digest(self, timeframe_hours=24):
        """Generates a summary of recent activity for a specific channel."""
        db_handler = self.bot.get_cog("DBHandler")
        if not db_handler: return "Database unavailable."

        async with aiosqlite.connect(db_handler.db_path) as db:
            query = """
                SELECT content, category FROM messages 
                WHERE timestamp >= datetime('now', ?) 
                AND category IN ('BUG_REPORT', 'FEATURE_REQUEST')
            """
            async with db.execute(query, (f"-{timeframe_hours} hours",)) as cursor:
                rows = await cursor.fetchall()
        
        if not rows:
            return "No significant feedback reported in the last cycle."

        # Prepare summary prompt
        feedback_blob = "\n".join([f"[{cat}] {text}" for text, cat in rows])
        prompt = f"""
        Summarize the following community feedback into a concise developer digest. 
        Group by category and highlight the most urgent issues.
        
        FEEDBACK:
        {feedback_blob}
        """

        try:
            response = await asyncio.to_thread(
                ollama.generate,
                model=self.model,
                prompt=prompt
            )
            return response['response']
        except Exception as e:
            logger.error(f"Digest generation failed: {e}")
            return "Failed to generate AI digest."

    @commands.command(name="digest")
    @commands.has_permissions(administrator=True)
    async def manual_digest(self, ctx, hours: int = 24):
        """Manual command to trigger a community digest."""
        await ctx.send(f"🔍 Generating community digest for the last {hours} hours...")
        digest = await self.generate_community_digest(hours)
        await ctx.send(f"**Vellum Community Digest**\n---\n{digest}")

    @commands.command(name="analyze_now")
    @commands.has_permissions(administrator=True)
    async def manual_analyze(self, ctx):
        await ctx.send("🤖 Starting manual AI analysis of pending messages...")
        await self.process_pending_messages()
        await ctx.send("✅ Analysis complete.")

    async def award_contribution_xp(self, user_id, category):
        """Awards XP and increments counters for bug reports/features."""
        db_handler = self.bot.get_cog("DBHandler")
        if not db_handler: return
        
        xp_gain = 50 if category == "BUG_REPORT" else 30
        
        async with aiosqlite.connect(db_handler.db_path) as db:
            # Check if user exists
            async with db.execute("SELECT user_id FROM user_stats WHERE user_id = ?", (user_id,)) as cursor:
                if not await cursor.fetchone():
                    await db.execute("INSERT INTO user_stats (user_id) VALUES (?)", (user_id,))
            
            if category == "BUG_REPORT":
                await db.execute("UPDATE user_stats SET xp = xp + ?, bugs_reported = bugs_reported + 1 WHERE user_id = ?", (xp_gain, user_id))
            else:
                await db.execute("UPDATE user_stats SET xp = xp + ?, features_suggested = features_suggested + 1 WHERE user_id = ?", (xp_gain, user_id))
            
            # Recalculate level (100 XP per level)
            await db.execute("UPDATE user_stats SET level = (xp / 100) + 1 WHERE user_id = ?", (user_id,))
            await db.commit()
            logger.info(f"Awarded {xp_gain} XP to user {user_id} for {category}")

async def setup(bot):
    await bot.add_cog(AIAnalyzer(bot))
