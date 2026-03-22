from discord.ext import commands
import discord
import logging
import aiosqlite

logger = logging.getLogger("VellumBot.Ascension")

class Ascension(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="ascend")
    async def perform_ascension(self, ctx):
        """Perform the Ritual of Ascension if you are Level 9."""
        db_handler = self.bot.get_cog("DBHandler")
        if not db_handler:
            return await ctx.send("Systems offline. Ascension denied.")

        # Logic to check level 9 would go here, currently using mock check
        async with aiosqlite.connect(db_handler.db_path) as db:
            async with db.execute("SELECT level FROM user_stats WHERE user_id = ?", (str(ctx.author.id),)) as cursor:
                row = await cursor.fetchone()
                user_level = row[0] if row else 1
        
        if user_level >= 9:
            await ctx.send(f"✨ **BEHOLD!** {ctx.author.mention} has ascended to the rank of **Level 9 Elder**!")
            await ctx.send("🏛️ You now have access to the **Elder Pool** and platform governance.")
        else:
            await ctx.send(f"❌ **Ascension Denied.** Your Current Archive Level: **{user_level}**")
            await ctx.send("Only those of the **9th Level** may enter the Sovereign Pool.")
            await ctx.send("*Keep contributing to the Chronicle (Bugs/Features) to reach the required level.*")

async def setup(bot):
    await bot.add_cog(Ascension(bot))
