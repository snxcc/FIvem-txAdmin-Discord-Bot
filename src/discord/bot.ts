import { Client, GatewayIntentBits, ChatInputCommandInteraction } from 'discord.js';
import { TxAdminAPI } from '../txadmin/txadmin';
import { TxAdminConfig } from '../types/types';
import { Logger } from './logger';
import { Groups } from './groups';
import { Command, CreateCommand, EditCommand, DeleteCommand } from './commands';
import { handleError } from './utils';

class Handler {
    private commands = new Map<string, Command>();

    constructor(client: Client, txAdmin: TxAdminAPI, groups: Groups, logger: Logger, roleId?: string) {
        [
            new CreateCommand(txAdmin, groups, logger, roleId),
            new EditCommand(txAdmin, groups, logger, roleId),
            new DeleteCommand(txAdmin, logger, roleId)
        ].forEach(cmd => this.commands.set(cmd.name, cmd));
    }

    async register(client: Client, guildId?: string): Promise<void> {
        try {
            const target: any = guildId ? client.guilds.cache.get(guildId) : client.application;
            if (target) {
                await target.commands.set([...this.commands.values()].map(cmd => cmd.build()));
                console.log(`[INFO] Commands registered ${guildId ? 'for guild' : 'globally'}`);
            }
        } catch (error) {
            console.error('[ERROR] Command registration failed:', error);
        }
    }

    async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        const cmd = this.commands.get(interaction.commandName);
        if (cmd) {
            try {
                await cmd.execute(interaction);
            } catch (error) {
                await handleError(error, interaction);
            }
        }
    }
}

export class Bot {
    private client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
    });
    private handler: Handler;

    constructor(config: TxAdminConfig) {
        const txAdmin = new TxAdminAPI(config.url, config.username, config.password);
        const groups = new Groups();
        const logger = new Logger(this.client);
        
        this.handler = new Handler(this.client, txAdmin, groups, logger, config.adminRoleId);

        this.client.once('clientReady', () => {
            console.log(`[INFO] Logged in as ${this.client.user?.tag}`);
            this.handler.register(this.client, config.guildId);
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isChatInputCommand()) await this.handler.handle(interaction);
        });
    }

    async start(token: string): Promise<void> {
        try {
            await this.client.login(token);
        } catch (error) {
            console.error('[ERROR] Bot start failed:', error);
        }
    }

    async stop(): Promise<void> {
        await this.client.destroy();
        console.log('[INFO] Bot stopped');
    }
}
