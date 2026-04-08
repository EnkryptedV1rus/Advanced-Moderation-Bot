import discord
from discord.ext import commands
import asyncio
import logging
import os
from datetime import datetime
from dotenv import load_dotenv

# -------------------------
# Load Environment Variables
# -------------------------

load_dotenv()
TOKEN = os.getenv("TOKEN")

# -------------------------
# Logging Setup
# -------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

logger = logging.getLogger("Kaito")

# -------------------------
# Bot Configuration
# -------------------------

intents = discord.Intents.default()
intents.members = True
intents.message_content = True

DEFAULT_PREFIX = "?"

# -------------------------
# Kaito Personality Messages
# -------------------------

KAITO_GREETING = [
    "Hey there~ I'm Kaito. Nice to meet you 🌸",
    "Hi hi! I'm Kaito! Need help with something?",
    "Hello! Kaito at your service ✨"
]

KAITO_HELP_LINES = [
    "Don't worry, I'll help you out.",
    "Let's figure it out together.",
    "I'm always here if you need me."
]

KAITO_ERROR_LINES = [
    "Umm... something went wrong.",
    "Ahh sorry! That didn't work.",
    "Oops… I messed up a bit there."
]

# -------------------------
# Custom Bot Class
# -------------------------

class Kaito(commands.Bot):

    def __init__(self):

        super().__init__(
            command_prefix=self.get_prefix,
            intents=intents,
            help_command=None
        )

        self.start_time = datetime.utcnow()

    async def setup_hook(self):

        logger.info("Loading extensions...")

        for filename in os.listdir("./cogs"):
            if filename.endswith(".py"):
                try:
                    await self.load_extension(f"cogs.{filename[:-3]}")
                    logger.info(f"Loaded cog: {filename}")
                except Exception as e:
                    logger.error(f"Failed to load {filename}: {e}")

        try:
            synced = await self.tree.sync()
            logger.info(f"Synced {len(synced)} slash commands")
        except Exception as e:
            logger.error(f"Slash sync failed: {e}")

    async def get_prefix(self, message):

        return commands.when_mentioned_or(DEFAULT_PREFIX)(self, message)

# -------------------------
# Create Bot Instance
# -------------------------

bot = Kaito()

# -------------------------
# Ready Event
# -------------------------

@bot.event
async def on_ready():

    logger.info("Kaito is online.")

    activity = discord.Activity(
        type=discord.ActivityType.watching,
        name="over the server peacefully 🌙"
    )

    await bot.change_presence(activity=activity)

# -------------------------
# Error Handling
# -------------------------

@bot.event
async def on_command_error(ctx, error):

    if isinstance(error, commands.CommandNotFound):
        return

    if isinstance(error, commands.MissingPermissions):

        embed = discord.Embed(
            description="Sorry... you don't have permission to use that command.",
            color=discord.Color.red()
        )

        await ctx.send(embed=embed)
        return

    if isinstance(error, commands.CommandOnCooldown):

        embed = discord.Embed(
            description=f"Slow down a little... try again in **{round(error.retry_after)}s**.",
            color=discord.Color.orange()
        )

        await ctx.send(embed=embed)
        return

    logger.error(f"Command error: {error}")

    embed = discord.Embed(
        description="Something unexpected happened...",
        color=discord.Color.red()
    )

    await ctx.send(embed=embed)

# -------------------------
# Basic Commands
# -------------------------

@bot.command()
async def ping(ctx):

    latency = round(bot.latency * 1000)

    embed = discord.Embed(
        title="🏓 Pong!",
        description=f"Latency: **{latency}ms**",
        color=discord.Color.blue()
    )

    await ctx.send(embed=embed)


@bot.command()
async def kaito(ctx):

    embed = discord.Embed(
        title="Hi, I'm Kaito!",
        description="A calm and helpful bot designed to make your server feel welcoming.",
        color=discord.Color.blurple()
    )

    embed.add_field(
        name="Personality",
        value="Relaxed • Friendly • Helpful"
    )

    embed.add_field(
        name="Purpose",
        value="Moderation • Economy • Fun • Utility"
    )

    await ctx.send(embed=embed)

# -------------------------
# Help Command
# -------------------------

@bot.command()
async def help(ctx):

    embed = discord.Embed(
        title="Kaito Help",
        description="Here's what I can do:",
        color=discord.Color.blurple()
    )

    embed.add_field(
        name="Moderation",
        value="ban • kick • warn • mute • purge",
        inline=False
    )

    embed.add_field(
        name="Economy",
        value="balance • daily • work • shop • gamble",
        inline=False
    )

    embed.add_field(
        name="Fun",
        value="8ball • meme • joke • rps",
        inline=False
    )

    embed.set_footer(text="Use ?help <command> for details.")

    await ctx.send(embed=embed)

# -------------------------
# Uptime Command
# -------------------------

@bot.command()
async def uptime(ctx):

    delta = datetime.utcnow() - bot.start_time

    hours, remainder = divmod(int(delta.total_seconds()), 3600)
    minutes, seconds = divmod(remainder, 60)

    embed = discord.Embed(
        title="Kaito Uptime",
        description=f"{hours}h {minutes}m {seconds}s",
        color=discord.Color.green()
    )

    await ctx.send(embed=embed)

# -------------------------
# Run Bot
# -------------------------

async def main():
    async with bot:
        await bot.start(TOKEN)

asyncio.run(main())
