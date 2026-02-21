# Advanced Discord Moderation Bot

A feature-rich Discord moderation bot for servers that need protection.  
Includes automated moderation, logging, raid detection, warnings, lockdowns, and fun commands.

---

## Features

- **Moderation**: Ban, kick, mute, warn, purge, slowmode, lockdown, nick, voice kick/move  
- **Automated moderation**: Detects spam, raids, and malicious links  
- **Logging**: Tracks deleted messages, joins/leaves, and moderation actions  
- **Configuration**: Per-server prefix and log channel  
- **Warning system**: Track and manage warnings per user  
- **Fun commands**: `howgay`, `say`, `ping`  
- **Slash & prefix commands** (customizable prefix)  

---

## Prerequisites

- [Node.js](https://nodejs.org/) v16.9.0 or higher  
- [Python](https://www.python.org/downloads/) v3.10+ (if you want to run scripts that need Python)  
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))  

---

## Installation

1. **Clone the repository**

git clone https://github.com/yourusername/your-repo.git

cd your-repo


2. **Install Node.js dependencies**

npm install discord.js dotenv


3. **Create a `.env` file** in the root folder and add your bot token:

TOKEN=your_bot_token_here


4. **Invite the bot to your server**  
Use this URL (replace CLIENT_ID with your bot’s ID):

https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands


5. **Run the bot**

node index.js


**Optional**: Use PM2 to keep the bot running:

npm install -g pm2
pm2 start index.js --name "mod-bot"


---

## Usage

- Slash commands: Type `/` and browse commands  
- Prefix commands: Default `!` (use `!help`)  
- Set prefix: `/prefix new_prefix` (Admin only)  
- Set log channel: `/log channel #channel` (Admin only)  

---

## Contributing

Pull requests are welcome! For major changes, open an issue first to discuss.  

---

## License

MIT
