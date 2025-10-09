# FiveM TxAdmin Discord Bot

Discord bot to manage TxAdmin accounts via slash commands.

## Commands

- `/createadmin` - Create new admin account
- `/editadmin` - Edit existing admin account  
- `/deleteadmin` - Delete admin account

## Setup

1. Install dependencies
```bash
npm install
```

2. Create `.env` file
```env
TXADMIN_USERNAME=admin
TXADMIN_PASSWORD=password
TXADMIN_URL=http://localhost:40120

DISCORD_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_guild_id
ADMIN_ROLE_ID=your_admin_role_id

CREATE_ADMIN_LOGS=channel_id_here
EDIT_ADMIN_LOGS=channel_id_here
DELETE_ADMIN_LOGS=channel_id_here
```

3. Configure groups in `groups.json`

4. Run the bot
```bash
npm run dev
```

## Discord Bot Setup

1. Create bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable bot permissions: Send Messages, Use Slash Commands, Embed Links
3. Copy token to `.env`
4. Invite bot to your server

## Requirements

- Node.js 18+
- Running TxAdmin server
- Discord bot token

