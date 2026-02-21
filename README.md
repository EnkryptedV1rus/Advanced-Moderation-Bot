# Advanced Discord Moderation Bot

A powerful, feature-rich Discord moderation bot written in JavaScript using discord.js v14.  
Designed for servers that need robust protection, the bot includes automated moderation, logging, raid detection, per-server configuration, and a wide range of moderation commands.

---

## Features

- **Moderation**: Ban, kick, mute (timeout), warn, purge, slowmode, lockdown, nick, voice kick/move, and more.  
- **Automated moderation**: Detects spam, raid attempts, and malicious links.  
- **Logging**: Tracks deleted messages, joins/leaves, and moderation actions to a designated channel.  
- **Configuration**: Per-server prefix and log channel, stored in JSON.  
- **Warning System**: Track, list, and delete specific warnings per user.  
- **Lockdown**: Lock channels with automatic unlocking and permission restoration.  
- **Fun Commands**: `howgay`, `say`, `ping`.  
- **Safe Mode**: Users can toggle messages to be reposted as embeds.  
- **Slash Commands** (global) and **Prefix Commands** (customizable prefix).  
- **User-friendly setup** and configuration.  

---

## Prerequisites

- [Node.js](https://nodejs.org/) v16.9.0 or higher  
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))  
- Git (optional)  

---

## Installation

1. **Clone the repository**

git clone https://github.com/yourusername/your-repo.git

cd your-repo


2. **Install dependencies**

npm install discord.js dotenv


3. **Create a `.env` file** in the root directory and add your bot token:

TOKEN=your_bot_token_here


4. **Invite the bot to your server**  
Use the following OAuth2 URL generator (replace `CLIENT_ID` with your bot's client ID):

https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands

Permissions: Administrator (can be customized later).

5. **Run the bot**

node index.js


**Optional**: For production, consider a process manager like PM2:

npm install -g pm2
pm2 start index.js --name "mod-bot"


---

## Usage

- **Slash Commands** – Type `/` and browse the list.  
- **Prefix Commands** – Default prefix is `!`. Use `!help` to see available commands.  
- Change the prefix with `/prefix new_prefix` (Admin only).  
- Set a log channel with `/log channel #channel` (Admin only).  

---

## Commands Overview

| Category       | Commands |
|----------------|----------|
| Moderation     | /ban, /unban, /kick, /mute, /unmute, /warn, /warnings, /delwarn, /purge, /slowmode, /lockdown, /unlockdown, /nick, /vckick, /vcmove |
| Configuration  | /prefix, /log channel, /config |
| Fun            | /ping, /howgay, /say |
| Utility        | /safemode, /checksafemode, /help |

---

## Data Storage

All server settings (prefix, log channel, warnings, lockdown states) are stored in `guildData.json`.  
You can safely edit this file while the bot is offline, but maintain proper JSON structure.

---

## Contributing

Pull requests are welcome! For major changes, open an issue first to discuss.  
All contributions help make the bot smarter, safer, and more feature-rich.

---

## License

MIT

---

## 🧩 Final Steps

1. Save the script as `index.js` in your project folder.  
2. Create a `.env` file with your bot token.  
3. Run `npm init -y` (if not already done) and `npm install discord.js dotenv`.  
4. Test the bot in a server.  
