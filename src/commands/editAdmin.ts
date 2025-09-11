import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember, PermissionFlagsBits } from 'discord.js';
import { BaseCommand } from './base';
import { TxAdminAPI } from '../api/txadmin';
import { GroupManager } from '../managers/groupManager';
import { Logger } from '../services/logger';

export class EditAdminCommand extends BaseCommand {
    name = 'editadmin';
    description = 'Edit a TxAdmin account';

    constructor(
        private txAdmin: TxAdminAPI,
        private groupManager: GroupManager,
        private logger: Logger,
        private adminRoleId?: string
    ) {
        super();
    }

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
            await interaction.reply({ content: 'Access denied: You do not have permission to edit admin accounts.', ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const username = interaction.options.getString('username', true);
        const newGroup = interaction.options.getString('new_group', true);
        const newCitizenfxId = interaction.options.getString('new_citizenfx_id') || '';
        const newDiscordUser = interaction.options.getUser('new_discord_user');

        const permissions = this.groupManager.getGroupPermissions(newGroup);
        const result = await this.txAdmin.editAdmin(username, {
            name: username,
            citizenfxID: newCitizenfxId,
            discordID: newDiscordUser?.id || ''
        }, permissions);

        if (result.success) {
            const group = this.groupManager.getGroup(newGroup)!;
            const embed = new EmbedBuilder()
                .setTitle('txAdmin Account Updated')
                .setColor(0x8B5CF6)
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

            await this.logger.logAdminAction({
                action: 'EDIT_ADMIN',
                username: username,
                group: newGroup,
                citizenfxId: newCitizenfxId,
                discordId: newDiscordUser?.id,
                discordUser: newDiscordUser?.tag,
                executor: interaction.user.tag,
                executorId: interaction.user.id,
                success: true
            });

            console.log(`[INFO] Admin account edited: ${username} (${newGroup}) by ${interaction.user.tag}`);
        } else {
            const errorEmbed = new EmbedBuilder()
                .setTitle('ADMIN EDIT FAILED')
                .setColor(0x8B5CF6)
                .setDescription('The system encountered an error while updating the administrator account.')
                .addFields({ name: 'ERROR INFORMATION', value: `\`\`\`${result.error}\`\`\``, inline: false })
                .setFooter({ text: 'TxAdmin Administration System' })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });

            await this.logger.logAdminAction({
                action: 'EDIT_ADMIN',
                username: username,
                group: newGroup,
                executor: interaction.user.tag,
                executorId: interaction.user.id,
                success: false,
                error: result.error
            });
        }
    }
}