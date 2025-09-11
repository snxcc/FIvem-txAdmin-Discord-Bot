# FiveM TxAdmin Discord Bot

A Discord bot for managing TxAdmin accounts on FiveM servers. This bot allows administrators to create, edit, and delete TxAdmin accounts directly through Discord slash commands.

## Features

- **Account Management**: Create, edit, and delete TxAdmin accounts
- **Discord Integration**: Full integration with Discord slash commands
- **Permission System**: Role-based access control
- **Logging**: Optional comprehensive logging of all actions
- **Group Management**: Support for different admin groups
- **CitizenFX Integration**: Link accounts with CitizenFX IDs

## Available Commands

### `/createadmin`
Creates a new TxAdmin account
- `username` - Username for the admin account
- `discord_user` - Discord user to link with the account
- `group` - Permission group for the admin
- `citizenfx_id` - (Optional) CitizenFX ID

### `/editadmin`
Edits an existing TxAdmin account
- `username` - Username of the account to edit
- `new_group` - New permission group
- `new_citizenfx_id` - (Optional) New CitizenFX ID
- `new_discord_user` - (Optional) New Discord user

### `/deleteadmin`
Deletes a TxAdmin account
- `username` - Username of the account to delete

## Installation

### Prerequisites
- Node.js (Version 18 or higher)
- npm or yarn
- A running TxAdmin server
- Discord Bot Token

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd fivem-txadmin-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the project directory:

```env
# TxAdmin Configuration
TXADMIN_USERNAME=your_txadmin_username
TXADMIN_PASSWORD=your_txadmin_password
TXADMIN_URL=http://localhost:40120

# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_guild_id
ADMIN_ROLE_ID=admin_role_id

# Logging (Optional)
CREATE_LOGS=true
LOG_CHANNEL_ID=log_channel_id
```

4. **Start the bot**

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TXADMIN_USERNAME` | TxAdmin username | ✅ |
| `TXADMIN_PASSWORD` | TxAdmin password | ✅ |
| `TXADMIN_URL` | TxAdmin server URL | ✅ |
| `DISCORD_TOKEN` | Discord bot token | ✅ |
| `DISCORD_GUILD_ID` | Discord server ID | ❌ |
| `ADMIN_ROLE_ID` | Admin role ID for permissions | ❌ |
| `CREATE_LOGS` | Enable logging (true/false) | ❌ |
| `LOG_CHANNEL_ID` | Channel ID for logs | ❌ |

### Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new Application
3. Navigate to "Bot" and create a bot
4. Copy the bot token
5. Enable the following bot permissions:
   - `Send Messages`
   - `Use Slash Commands`
   - `Embed Links`
6. Invite the bot to your server with the appropriate permissions

### Group Configuration

Available admin groups are defined in the `groups.json` file. This file contains the different permission levels that can be assigned during account creation.

## Project Structure

```
src/
├── api/           # TxAdmin API Integration
├── commands/      # Discord Slash Commands
├── constants/     # Constants and Configurations
├── core/          # Bot Core Logic
├── factories/     # Factory Pattern Implementations
├── managers/      # Manager Classes
├── services/      # Service Layer
├── types/         # TypeScript Type Definitions
└── utils/         # Utility Functions
```

## Development

### Scripts

- `npm run dev` - Starts the bot in development mode
- `npm run build` - Compiles TypeScript to JavaScript
- `npm run start` - Starts the compiled bot
- `npm run watch` - Watches for changes and compiles automatically

### Technology Stack

- **TypeScript** - Typed JavaScript development
- **Discord.js v14** - Discord API wrapper
- **Axios** - HTTP client for TxAdmin API
- **dotenv** - Environment variables management

## Troubleshooting

### Common Issues

**Bot not responding to commands:**
- Check if the bot has the correct permissions
- Ensure slash commands are registered
- Check the console for error messages

**TxAdmin connection failed:**
- Verify TxAdmin URL and credentials
- Ensure TxAdmin is accessible
- Check network configuration

**Permission errors:**
- Verify the `ADMIN_ROLE_ID` configuration
- Ensure the user has the appropriate role

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Support

For questions or issues, please create an issue in the repository or contact the developers.

