# TxAdmin Discord Bot

A Discord bot for managing FiveM TxAdmin accounts through slash commands.

## Overview

This bot provides a secure interface for managing TxAdmin administrator accounts directly from Discord. It supports creating, editing, and deleting admin accounts with configurable permission groups and automatic logging.

## Features

- Secure authentication with TxAdmin API
- Role-based permission system
- Automatic action logging to Discord channels
- Type-safe implementation with TypeScript
- Configurable permission groups
- CSRF token-based security

## Commands

| Command | Description | Required Parameters | Optional Parameters |
|---------|-------------|---------------------|---------------------|
| `/createadmin` | Create new admin account | username, discord_user, group | citizenfx_id |
| `/editadmin` | Modify existing admin account | username, new_group | new_citizenfx_id, new_discord_user |
| `/deleteadmin` | Remove admin account | username | - |

## Prerequisites

- Node.js 18.0 or higher
- Running TxAdmin server instance
- Discord bot application with token
- Administrator permissions in Discord server

## Installation

```bash
git clone <repository-url>
cd txadmin-discord-bot
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# TxAdmin Server Configuration
TXADMIN_URL=http://localhost:40120
TXADMIN_USERNAME=admin
TXADMIN_PASSWORD=password

# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here
ADMIN_ROLE_ID=your_admin_role_id_here

# Optional: Logging Channels
CREATE_ADMIN_LOGS=channel_id
EDIT_ADMIN_LOGS=channel_id
DELETE_ADMIN_LOGS=channel_id
```

### Permission Groups

Configure admin permission groups in `groups.json`:

```json
{
  "groups": {
    "admin": {
      "name": "Administrator",
      "description": "Full server access",
      "permissions": [
        "all_permissions",
        "manage.admins",
        "server.control"
      ]
    },
    "moderator": {
      "name": "Moderator",
      "description": "Limited moderation access",
      "permissions": [
        "players.kick",
        "players.warn",
        "players.message"
      ]
    }
  }
}
```

### Discord Bot Setup

1. Navigate to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Navigate to the Bot section and create a bot
4. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
5. Copy the bot token to your `.env` file
6. Generate an OAuth2 URL with the following scopes:
   - `applications.commands`
   - `bot`
7. Add the following bot permissions:
   - Send Messages
   - Embed Links
   - Use Slash Commands
8. Use the generated URL to invite the bot to your server

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── discord/
│   ├── commands/
│   │   ├── base.ts          # Base command class
│   │   ├── create.ts        # Create admin command
│   │   ├── edit.ts          # Edit admin command
│   │   ├── delete.ts        # Delete admin command
│   │   └── index.ts         # Command exports
│   ├── bot.ts               # Discord client and handler
│   ├── groups.ts            # Permission group manager
│   ├── logger.ts            # Channel logging system
│   ├── utils.ts             # Utility functions
│   └── discord.ts           # Module exports
├── txadmin/
│   └── txadmin.ts           # TxAdmin API client
├── types/
│   └── types.ts             # TypeScript type definitions
└── main/
    └── main.ts              # Application entry point
```

## Security Considerations

- All slash commands require Discord Administrator permissions by default
- Optional role-based access control through `ADMIN_ROLE_ID` environment variable
- Credentials are stored securely in environment variables
- CSRF token authentication with TxAdmin API
- Automatic session management and token refresh

## Troubleshooting

### Commands Not Appearing

- Verify the bot has the `applications.commands` scope
- Ensure the bot has Administrator permissions in the server
- Global commands may take up to 1 hour to register
- Use `DISCORD_GUILD_ID` for instant guild-specific commands

### Authentication Failures

- Confirm TxAdmin server is running and accessible
- Verify credentials in `.env` file are correct
- Check TxAdmin URL includes the correct port number
- Ensure TxAdmin web interface is accessible from the bot's network

### Bot Not Responding

- Check bot is online in Discord
- Verify bot has necessary permissions in the server
- Review console logs for error messages
- Ensure all required environment variables are set

## API Reference

### TxAdminAPI Class

The `TxAdminAPI` class provides methods for interacting with the TxAdmin server:

- `createAdmin(adminData, permissions)` - Create a new admin account
- `editAdmin(username, adminData, permissions)` - Modify an existing admin account
- `deleteAdmin(username)` - Remove an admin account

All methods return a Promise with success status and relevant data or error messages.

## Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome. Please open an issue or submit a pull request for any improvements or bug fixes.

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.



