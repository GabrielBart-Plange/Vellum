import discord
from discord.ext import commands
import logging
import os

logger = logging.getLogger("VellumBot.ServerManager")

class ServerManager(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member):
        logger.info(f"New member joined: {member.name}")
        welcome_channel_id = os.getenv("WELCOME_CHANNEL_ID")
        if welcome_channel_id:
            welcome_channel = member.guild.get_channel(int(welcome_channel_id))
            if welcome_channel:
                embed = discord.Embed(
                    title=f"Welcome to Vellum, {member.name}!",
                    description="Please read the rules in #rules to get started.",
                    color=discord.Color.blue()
                )
                await welcome_channel.send(embed=embed)

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload):
        # Rule acceptance logic (reactive to a specific message/emoji)
        # In a real scenario, compare payload.message_id to a stored rules_message_id
        if payload.emoji.name == "✅":
            guild = self.bot.get_guild(payload.guild_id)
            member = guild.get_member(payload.user_id)
            if member and not member.bot:
                role = discord.utils.get(guild.roles, name="Chronicler") # Example role
                if role:
                    await member.add_roles(role)
                    logger.info(f"Assigned role {role.name} to {member.name}")

async def setup(bot):
    await bot.add_cog(ServerManager(bot))
