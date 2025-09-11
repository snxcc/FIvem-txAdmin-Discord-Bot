import { Client, GatewayIntentBits } from 'discord.js';
import { TxAdminAPI } from '../api/txadmin';
import { GroupManager } from '../managers/groupManager';
import { CommandManager } from '../managers/commandManager';
import { Logger } from '../services/logger';
import { TxAdminConfig } from '../types';

export class TxAdminBot {
    private client: Client;
    private txAdmin: TxAdminAPI;
    private groupManager: GroupManager;
    private commandManager: CommandManager;
    private logger: Logger;
    private guildId?: string;

    constructor(config: TxAdminConfig) {
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
        });

        this.txAdmin = new TxAdminAPI(config.url, config.username, config.password);
        this.groupManager = new GroupManager();
        this.logger = new Logger(this.client);
        this.commandManager = new CommandManager(this.client, this.txAdmin, this.groupManager, this.logger, config.adminRoleId);
        this.guildId = config.guildId;

        this.setupEvents();
    }

    private setupEvents(): void {
        this.client.once('clientReady', () => {
            console.log(`[INFO] Bot logged in as ${this.client.user?.tag}`);
            this.commandManager.registerSlashCommands(this.guildId);
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            await this.commandManager.handleInteraction(interaction);
        });
    }

    async start(token: string): Promise<void> {
        try {
            await this.client.login(token);
        } catch (error) {
            console.error('[ERROR] Failed to start bot:', error);
        }
    }

    async stop(): Promise<void> {
        await this.client.destroy();
        console.log('[INFO] Bot stopped');
    }
}