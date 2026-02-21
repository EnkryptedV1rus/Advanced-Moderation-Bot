# Advanced Discord Moderation Bot

A powerful, feature‑rich moderation bot for Discord, written in JavaScript using discord.js v14.  
Includes per‑server configuration, persistent storage, and a wide range of moderation commands.

## Features

- **Moderation**: Ban, kick, mute (timeout), warn, purge, slowmode, lockdown, nick, voice kick/move, and more.
- **Configuration**: Per‑server prefix and log channel (stored in JSON).
- **Warning System**: Track warnings per user, list them, delete specific warnings.
- **Lockdown**: Lock channels with automatic unlocking, restoring original permissions.
- **Fun Commands**: `howgay`, `say`, `ping`.
- **Safe Mode**: Users can toggle their messages to be reposted as embeds.
- **Slash Commands** (global) and **Prefix Commands** (customizable prefix).
- **Logging**: All moderation actions are logged to a designated channel.

## Prerequisites

- [Node.js](https://nodejs.org/) v16.9.0 or higher
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- Git (optional)
- [Visual Studio Code](https://code.visualstudio.com/), Google Antigravity, or [PyCharm](https://www.jetbrains.com/pycharm/download/?section=windows)

## Installation

**Clone the repository**
   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
```
Install dependencies
```bash
npm install discord.js dotenv
```

Create a `.env` file in the root directory and add your bot token:

```env
TOKEN=your_bot_token_here
```
Invite the bot to your server
Use the following OAuth2 URL generator (replace CLIENT_ID with your bot's client ID):

https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
Permissions: Administrator (for simplicity) – you can customise the permissions later.

Run the bot

```bash
node index.js
```
For production, consider using [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start index.js --name "mod-bot"
```
Usage
Slash commands – Type `/` and browse the list.

Prefix commands – Default prefix is `!`. Use `!help` to see available message commands.

Change the prefix with `/prefix new_prefix` (Admin only).

Set a log channel with `/log channel #`channel (Admin only).

## Commands Overview
| Category      | Commands                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Moderation    | /ban, /unban, /kick, /mute, /unmute, /warn, /warnings, /delwarn, /purge, /slowmode, /lockdown, /unlockdown, /nick, /vckick, /vcmove |
| Configuration | /prefix, /log channel, /config                                                                                                      |
| Fun           | /ping, /howgay, /say                                                                                                                |
| Utility       | /safemode, /checksafemode, /help                                                                                                    |

## Data Storage
All server settings (prefix, log channel, warnings, lockdown states) are stored in guildData.json.
You can safely edit this file while the bot is offline, but be careful with the JSON structure.

## 🧩 Overview/Summary

1. **Save the script** as `index.js` in your project folder.
2. **Create a `.env` file** with your token.
3. **Run `npm init -y`** (if you haven't already) and then `npm install discord.js dotenv`.
4. **Test the bot** in a server.

License
---
MIT
