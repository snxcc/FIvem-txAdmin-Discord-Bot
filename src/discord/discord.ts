import { Client, GatewayIntentBits, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember, PermissionFlagsBits, TextChannel } from 'discord.js';
import { TxAdminAPI } from '../txadmin/txadmin';
import { TxAdminConfig, GroupsConfig, Group } from '../types/types';
import * as fs from 'fs';
import * as path from 'path';

type LogData = {
    action: string;
    username: string;
    executor: string;
    executorId: string;
    success: boolean;
    group?: string;
    citizenfxId?: string;
    discordId?: string;
    discordUser?: string;
    error?: string;
};

const COLORS = { PRIMARY: 0x8B5CF6, SUCCESS: 0x22c55e, ERROR: 0xef4444 } as const;
const MESSAGES = {
    ACCESS_DENIED: 'Access denied: You do not have permission to use this command.',
    TXADMIN_OFFLINE: 'TxAdmin server is not running or not accessible. Please start TxAdmin first.',
    AUTH_FAILED: 'Failed to authenticate with TxAdmin. Check your credentials in the configuration.',
    FOOTER: 'TxAdmin Administration System'
} as const;
const TIMEOUTS = { CONNECTION: 5000, REQUEST: 10000 } as const;

const createEmbed = (title: string, description: string, color: number = COLORS.PRIMARY) =>
    new EmbedBuilder().setTitle(title).setColor(color).setDescription(description).setFooter({ text: MESSAGES.FOOTER }).setTimestamp();
const createErrorEmbed = (error: string) =>
    createEmbed('SYSTEM ERROR', error, COLORS.ERROR).addFields({ name: 'ERROR DETAILS', value: `\`\`\`${error}\`\`\``, inline: false });

const handleCommandError = async (error: any, interaction: ChatInputCommandInteraction): Promise<void> => {
    console.error(`[ERROR] Command ${interaction.commandName}:`, error);
    const embed = createEmbed('SYSTEM ERROR', getErrorMessage(error));
    try {
        const method = (interaction.deferred || interaction.replied) ? 'editReply' : 'reply';
        const options = method === 'reply' ? { embeds: [embed], ephemeral: true } : { embeds: [embed] };
        // @ts-ignore
        await interaction[method](options);
    } catch (replyError) {
        console.error('[ERROR] Failed to send error message:', replyError);
    }
};

const getErrorMessage = (error: any): string => {
    if (error.message?.includes('TxAdmin is not running')) return MESSAGES.TXADMIN_OFFLINE;
    if (error.message?.includes('Failed to authenticate')) return MESSAGES.AUTH_FAILED;
    return 'An unexpected error occurred while processing your request.';
};

class Logger {
    constructor(private client: Client) {}
    private get createLogs(): boolean { return process.env.CREATE_LOGS === 'true'; }
    private get logChannelId(): string | undefined { return process.env.LOG_CHANNEL_ID; }

    async logAdminAction(data: LogData): Promise<void> {
        if (!this.createLogs) return;
        const status = data.success ? '' : '_FAILED';
        console.log(`[${data.action}${status}] ${data.username} ${data.group ? `(${data.group})` : ''} by ${data.executor}${data.error ? `: ${data.error}` : ''}`);
        if (!this.logChannelId) return;
        try {
            const channel = await this.client.channels.fetch(this.logChannelId) as TextChannel;
            if (!channel) return;
            const embed = new EmbedBuilder()
                .setTitle(`ADMIN ${data.action.replace('_', ' ')}${data.success ? '' : ' FAILED'}`)
                .setColor(data.success ? COLORS.SUCCESS : COLORS.ERROR)
                .addFields(
                    { name: 'USERNAME', value: `\`${data.username}\``, inline: true },
                    { name: 'EXECUTOR', value: `<@${data.executorId}>`, inline: true },
                    { name: 'TIMESTAMP', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: 'TxAdmin Administration System' })
                .setTimestamp();
            if (data.group) embed.addFields({ name: 'GROUP', value: `\`${data.group}\``, inline: true });
            if (data.citizenfxId) embed.addFields({ name: 'CITIZENFX ID', value: data.citizenfxId, inline: true });
            if (data.discordUser) embed.addFields({ name: 'DISCORD USER', value: data.discordUser, inline: true });
            if (!data.success && data.error) embed.addFields({ name: 'ERROR DETAILS', value: `\`\`\`${data.error}\`\`\``, inline: false });
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('[ERROR] Failed to send channel log:', error);
        }
    }
}

class GroupManager {
    private groups!: GroupsConfig;
    private groupsPath: string;
    constructor() {
        this.groupsPath = path.join(process.cwd(), 'groups.json');
        this.loadGroups();
    }
    private loadGroups(): void {
        try {
            const data = fs.readFileSync(this.groupsPath, 'utf8');
            this.groups = JSON.parse(data);
        } catch (error) {
            console.error('[ERROR] Failed to load groups.json:', error);
            throw new Error('Could not load group configuration');
        }
    }
    getAvailableGroups(): string[] { return Object.keys(this.groups.groups); }
    getGroup(groupName: string): Group | null { return this.groups.groups[groupName] || null; }
    getGroupPermissions(groupName: string): string[] { return this.getGroup(groupName)?.permissions || []; }
    validateGroup(groupName: string): boolean { return Object.prototype.hasOwnProperty.call(this.groups.groups, groupName); }
    getGroupChoices(): Array<{ name: string; value: string }> {
        return Object.entries(this.groups.groups).map(([key, group]) => ({ name: `${group.name} - ${group.description}`, value: key }));
    }
}

abstract class BaseCommand {
    abstract name: string;
    abstract description: string;
    abstract build(): SlashCommandBuilder;
    abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

class CreateAdminCommand extends BaseCommand {
    name = 'createadmin';
    description = 'Create a new TxAdmin account';
    constructor(private txAdmin: TxAdminAPI, private groupManager: GroupManager, private logger: Logger, private adminRoleId?: string) { super(); }
    build(): SlashCommandBuilder {
        const groupChoices = this.groupManager.getGroupChoices();
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption(option => option.setName('username').setDescription('Admin username').setRequired(true))
            .addUserOption(option => option.setName('discord_user').setDescription('Discord user to link with the admin account').setRequired(true))
            .addStringOption(option => option.setName('group').setDescription('Permission group for the admin').setRequired(true).addChoices(...groupChoices))
            .addStringOption(option => option.setName('citizenfx_id').setDescription('CitizenFX ID (optional)').setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as SlashCommandBuilder;
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const member = interaction.member as GuildMember;
        if (this.adminRoleId && member && !member.roles.cache.has(this.adminRoleId)) {
            await interaction.reply({ content: MESSAGES.ACCESS_DENIED, ephemeral: true });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const username = interaction.options.getString('username', true);
        const groupName = interaction.options.getString('group', true);
        const citizenfxId = interaction.options.getString('citizenfx_id') || '';
        const discordUser = interaction.options.getUser('discord_user', true);
        if (!this.groupManager.validateGroup(groupName)) {
            await interaction.editReply({ embeds: [new EmbedBuilder()
                .setTitle('INVALID GROUP SELECTION')
                .setColor(COLORS.PRIMARY)
                .setDescription('The specified group does not exist in the system configuration.')
                .addFields({ name: 'AVAILABLE GROUPS', value: this.groupManager.getAvailableGroups().map(g => `\`${g}\``).join(' • '), inline: false })
                .setFooter({ text: 'TxAdmin System • FIVEM' })
                .setTimestamp()] });
            return;
        }
        const result = await this.txAdmin.createAdmin({ name: username, citizenfxID: citizenfxId, discordID: discordUser.id }, this.groupManager.getGroupPermissions(groupName));
        if (result.success) {
            const group = this.groupManager.getGroup(groupName)!;
            const embed = new EmbedBuilder()
                .setTitle('txAdmin Account Created')
                .setColor(COLORS.PRIMARY)
                .addFields(
                    { name: 'ACCOUNT INFORMATION', value: `- **Username:** \`${result.username}\`\n- **Password:** ||\`${result.password}\`||\n- **Permission:** \`${group.name}\``, inline: false },
                    { name: 'PERMISSIONS', value: `\`${group.permissions.length}\` permissions added\n\`\`\`${group.permissions.slice(0, 3).join(', ')}${group.permissions.length > 3 ? ` +${group.permissions.length - 3} more` : ''}\`\`\``, inline: false },
                    { name: 'LINKED ACCOUNTS', value: `- **CitizenFX:** ${citizenfxId || 'Not assigned'}\n- **Discord:** <@${discordUser.id}>`, inline: false },
                    { name: 'CREATED BY', value: `<@${interaction.user.id}> (${interaction.user.id})`, inline: true },
                    { name: 'TIMESTAMP', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: 'TxAdmin System • FIVEM' })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('txAdmin Account Data')
                    .setColor(COLORS.PRIMARY)
                    .addFields(
                        { name: 'LOGIN CREDENTIALS', value: `- **Username:** \`${result.username}\`\n- **Password:** \`${result.password}\``, inline: false },
                        { name: 'INFO', value: `- **Group:** ${group.name}\n- **Description:** ${group.description}`, inline: false },
                        { name: 'IMPORTANT NOTES', value: '• Change your password after first login\n• Keep your credentials secure\n• Contact administrators for support', inline: false }
                    )
                    .setFooter({ text: 'TxAdmin System • FIVEM' })
                    .setTimestamp();
                await discordUser.send({ embeds: [dmEmbed] });
                console.log(`[INFO] DM sent to ${discordUser.tag} with admin credentials`);
            } catch (dmError) {
                console.log(`[WARN] Could not send DM to ${discordUser.tag}: ${dmError}`);
            }
            await this.logger.logAdminAction({ action: 'CREATE_ADMIN', username, group: groupName, citizenfxId, discordId: discordUser.id, discordUser: discordUser.tag, executor: interaction.user.tag, executorId: interaction.user.id, success: true });
            console.log(`[INFO] Admin account created: ${username} (${groupName}) for ${discordUser.tag} by ${interaction.user.tag}`);
        } else {
            const errorEmbed = new EmbedBuilder()
                .setTitle('ADMIN CREATION FAILED')
                .setColor(COLORS.PRIMARY)
                .addFields(
                    { name: 'ERROR INFORMATION', value: `\`\`\`${result.error}\`\`\``, inline: false },
                    { name: 'REQUEST DETAILS', value: `- **Username:** \`${username}\`\n- **Group:** \`${groupName}\`\n- **Target User:** <@${discordUser.id}>`, inline: false }
                )
                .setFooter({ text: 'TxAdmin Administration System • Error Report' })
                .setTimestamp();
            await interaction.editReply({ embeds: [errorEmbed] });
            await this.logger.logAdminAction({ action: 'CREATE_ADMIN', username, group: groupName, citizenfxId, discordId: discordUser.id, discordUser: discordUser.tag, executor: interaction.user.tag, executorId: interaction.user.id, success: false, error: result.error });
        }
    }
}

class EditAdminCommand extends BaseCommand {
    name = 'editadmin';
    description = 'Edit a TxAdmin account';
    constructor(private txAdmin: TxAdminAPI, private groupManager: GroupManager, private logger: Logger, private adminRoleId?: string) { super(); }
    build(): SlashCommandBuilder {
        const groupChoices = this.groupManager.getGroupChoices();
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption(option => option.setName('username').setDescription('Admin username to edit').setRequired(true))
            .addStringOption(option => option.setName('new_group').setDescription('New permission group').setRequired(true).addChoices(...groupChoices))
            .addStringOption(option => option.setName('new_citizenfx_id').setDescription('New CitizenFX ID (optional)').setRequired(false))
            .addUserOption(option => option.setName('new_discord_user').setDescription('New Discord user (optional)').setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as SlashCommandBuilder;
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const member = interaction.member as GuildMember;
        if (this.adminRoleId && member && !member.roles.cache.has(this.adminRoleId)) {
            await interaction.reply({ content: MESSAGES.ACCESS_DENIED, ephemeral: true });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const username = interaction.options.getString('username', true);
        const newGroup = interaction.options.getString('new_group', true);
        const newCitizenfxId = interaction.options.getString('new_citizenfx_id') || '';
        const newDiscordUser = interaction.options.getUser('new_discord_user');
        const permissions = this.groupManager.getGroupPermissions(newGroup);
        const result = await this.txAdmin.editAdmin(username, { name: username, citizenfxID: newCitizenfxId, discordID: newDiscordUser?.id || '' }, permissions);
        if (result.success) {
            const group = this.groupManager.getGroup(newGroup)!;
            const embed = new EmbedBuilder()
                .setTitle('txAdmin Account Updated')
                .setColor(COLORS.PRIMARY)
                .addFields(
                    { name: 'UPDATED ACCOUNT', value: `\`${username}\``, inline: true },
                    { name: 'NEW GROUP', value: `\`${group.name}\``, inline: true },
                    { name: 'UPDATED BY', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'NEW CITIZENFX ID', value: newCitizenfxId || 'Not assigned', inline: true },
                    { name: 'NEW DISCORD USER', value: newDiscordUser ? `<@${newDiscordUser.id}>` : 'Not assigned', inline: true },
                    { name: 'TIMESTAMP', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: 'TxAdmin Administration System' })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
            await this.logger.logAdminAction({ action: 'EDIT_ADMIN', username, group: newGroup, citizenfxId: newCitizenfxId, discordId: newDiscordUser?.id, discordUser: newDiscordUser?.tag, executor: interaction.user.tag, executorId: interaction.user.id, success: true });
            console.log(`[INFO] Admin account edited: ${username} (${newGroup}) by ${interaction.user.tag}`);
        } else {
            const errorEmbed = new EmbedBuilder()
                .setTitle('ADMIN EDIT FAILED')
                .setColor(COLORS.PRIMARY)
                .setDescription('The system encountered an error while updating the administrator account.')
                .addFields({ name: 'ERROR INFORMATION', value: `\`\`\`${result.error}\`\`\``, inline: false })
                .setFooter({ text: 'TxAdmin Administration System' })
                .setTimestamp();
            await interaction.editReply({ embeds: [errorEmbed] });
            await this.logger.logAdminAction({ action: 'EDIT_ADMIN', username, group: newGroup, executor: interaction.user.tag, executorId: interaction.user.id, success: false, error: result.error });
        }
    }
}

class DeleteAdminCommand extends BaseCommand {
    name = 'deleteadmin';
    description = 'Delete a TxAdmin account';
    constructor(private txAdmin: TxAdminAPI, private logger: Logger, private adminRoleId?: string) { super(); }
    build(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption(option => option.setName('username').setDescription('Admin username to delete').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as SlashCommandBuilder;
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const member = interaction.member as GuildMember;
        if (this.adminRoleId && member && !member.roles.cache.has(this.adminRoleId)) {
            await interaction.reply({ content: MESSAGES.ACCESS_DENIED, ephemeral: true });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const username = interaction.options.getString('username', true);
        const result = await this.txAdmin.deleteAdmin(username);
        const logData: LogData = { action: 'DELETE_ADMIN', username, executor: interaction.user.tag, executorId: interaction.user.id, success: result.success, error: result.error };
        if (result.success) {
            await interaction.editReply({ embeds: [createEmbed('ADMIN ACCOUNT DELETED', 'The administrator account has been successfully removed from the system.')
                .addFields(
                    { name: 'DELETED ACCOUNT', value: `\`${username}\``, inline: true },
                    { name: 'DELETED BY', value: `<@${interaction.user.id}> (${interaction.user.id})`, inline: true },
                    { name: 'TIMESTAMP', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )] });
            console.log(`[INFO] Admin account deleted: ${username} by ${interaction.user.tag}`);
        } else {
            await interaction.editReply({ embeds: [createErrorEmbed(result.error!)] });
        }
        await this.logger.logAdminAction(logData);
    }
}

class CommandManager {
    private commands: Map<string, BaseCommand> = new Map();
    constructor(private client: Client, txAdmin: TxAdminAPI, groupManager: GroupManager, logger: Logger, adminRoleId?: string) {
        [
            new CreateAdminCommand(txAdmin, groupManager, logger, adminRoleId),
            new DeleteAdminCommand(txAdmin, logger, adminRoleId),
            new EditAdminCommand(txAdmin, groupManager, logger, adminRoleId)
        ].forEach(cmd => this.commands.set(cmd.name, cmd));
    }
    async registerSlashCommands(guildId?: string): Promise<void> {
        try {
            const commands = Array.from(this.commands.values()).map(cmd => cmd.build());
            const target: any = guildId ? this.client.guilds.cache.get(guildId) : this.client.application;
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
        try { await command.execute(interaction); } catch (error) { await handleCommandError(error, interaction); }
    }
}

export class TxAdminBot {
    private client: Client;
    private txAdmin: TxAdminAPI;
    private groupManager: GroupManager;
    private commandManager: CommandManager;
    private logger: Logger;
    private guildId?: string;
    constructor(config: TxAdminConfig) {
        this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
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
    async start(token: string): Promise<void> { try { await this.client.login(token); } catch (error) { console.error('[ERROR] Failed to start bot:', error); } }
    async stop(): Promise<void> { await this.client.destroy(); console.log('[INFO] Bot stopped'); }
}

export { TIMEOUTS };


