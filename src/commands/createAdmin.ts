import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember, PermissionFlagsBits } from 'discord.js';
import { BaseCommand } from './base';
import { TxAdminAPI } from '../api/txadmin';
import { GroupManager } from '../managers/groupManager';
import { Logger } from '../services/logger';

export class CreateAdminCommand extends BaseCommand {
    name = 'createadmin';
    description = 'Create a new TxAdmin account';

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
            .addStringOption(option => option.setName('username').setDescription('Admin username').setRequired(true))
            .addUserOption(option => option.setName('discord_user').setDescription('Discord user to link with the admin account').setRequired(true))
            .addStringOption(option => option.setName('group').setDescription('Permission group for the admin').setRequired(true).addChoices(...groupChoices))
            .addStringOption(option => option.setName('citizenfx_id').setDescription('CitizenFX ID (optional)').setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as SlashCommandBuilder;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const member = interaction.member as GuildMember;
        if (this.adminRoleId && member && !member.roles.cache.has(this.adminRoleId)) {
            await interaction.reply({ content: 'Access denied: You do not have permission to create admin accounts.', ephemeral: true });
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
                .setColor(0x8B5CF6)
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
                .setColor(0x8B5CF6)
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
                    .setColor(0x8B5CF6)
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
                .setColor(0x8B5CF6)
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