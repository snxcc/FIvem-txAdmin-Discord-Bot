import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from 'discord.js';
import { TxAdminAPI } from '../../txadmin/txadmin';
import { Logger } from '../logger';
import { MESSAGES } from '../utils';

export abstract class Command {
    abstract name: string;
    abstract description: string;

    constructor(
        protected txAdmin: TxAdminAPI,
        protected logger: Logger,
        protected adminRoleId?: string
    ) {}

    abstract build(): SlashCommandBuilder;
    abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;

    protected hasPermission(interaction: ChatInputCommandInteraction): boolean {
        return !this.adminRoleId || !!(interaction.member as GuildMember)?.roles.cache.has(this.adminRoleId);
    }

    protected async checkAccess(interaction: ChatInputCommandInteraction): Promise<boolean> {
        if (!this.hasPermission(interaction)) {
            await interaction.reply({ content: MESSAGES.ACCESS_DENIED, ephemeral: true });
            return false;
        }
        await interaction.deferReply({ ephemeral: true });
        return true;
    }

    protected baseBuilder() {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
    }
}
