import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { BaseCommand } from './base';
import { TxAdminAPI } from '../api/txadmin';
import { Logger } from '../services/logger';
import { createEmbed, createErrorEmbed } from '../utils/embedBuilder';
import { checkPermissions } from '../utils/permissions';

export class DeleteAdminCommand extends BaseCommand {
    name = 'deleteadmin';
    description = 'Delete a TxAdmin account';

    constructor(
        private txAdmin: TxAdminAPI,
        private logger: Logger,
        private adminRoleId?: string
    ) {
        super();
    }

    build(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption(option => option.setName('username').setDescription('Admin username to delete').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as SlashCommandBuilder;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!(await checkPermissions(interaction, this.adminRoleId))) return;
        await interaction.deferReply({ ephemeral: true });

        const username = interaction.options.getString('username', true);
        const result = await this.txAdmin.deleteAdmin(username);
        const logData = { action: 'DELETE_ADMIN', username, executor: interaction.user.tag, executorId: interaction.user.id, success: result.success, error: result.error };

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