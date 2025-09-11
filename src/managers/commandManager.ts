import { Client, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '../commands/base';
import { CommandFactory } from '../factories/commandFactory';
import { TxAdminAPI } from '../api/txadmin';
import { GroupManager } from './groupManager';
import { Logger } from '../services/logger';
import { handleCommandError } from '../utils/errorHandler';

export class CommandManager {
    private commands: Map<string, BaseCommand> = new Map();

    constructor(
        private client: Client,
        txAdmin: TxAdminAPI,
        groupManager: GroupManager,
        logger: Logger,
        adminRoleId?: string
    ) {
        this.registerCommands(txAdmin, groupManager, logger, adminRoleId);
    }

    private registerCommands(txAdmin: TxAdminAPI, groupManager: GroupManager, logger: Logger, adminRoleId?: string): void {
        CommandFactory.createCommands(txAdmin, groupManager, logger, adminRoleId)
            .forEach(cmd => this.commands.set(cmd.name, cmd));
    }

    async registerSlashCommands(guildId?: string): Promise<void> {
        try {
            const commands = Array.from(this.commands.values()).map(cmd => cmd.build());
            const target = guildId ? this.client.guilds.cache.get(guildId) : this.client.application;
            if (target) {
                await target.commands.set(commands);
                console.log(`[INFO] Slash commands registered ${guildId ? 'for guild' : 'globally'}`);
            }
        } catch (error) {
            console.error('[ERROR] Failed to register slash commands:', error);
        }
    }

    async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
        const command = this.commands.get(interaction.commandName);
        if (!command) return;
        
        try {
            await command.execute(interaction);
        } catch (error) {
            await handleCommandError(error, interaction);
        }
    }
}