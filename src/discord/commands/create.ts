import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { TxAdminAPI } from '../../txadmin/txadmin';
import { Logger } from '../logger';
import { Groups } from '../groups';
import { Command } from './base';
import { COLORS, embed, timestamp, field } from '../utils';

export class CreateCommand extends Command {
    name = 'createadmin';
    description = 'Create a new TxAdmin account';

    constructor(txAdmin: TxAdminAPI, private groups: Groups, logger: Logger, adminRoleId?: string) {
        super(txAdmin, logger, adminRoleId);
    }

    build(): SlashCommandBuilder {
        return this.baseBuilder()
            .addStringOption(opt => opt.setName('username').setDescription('Admin username').setRequired(true))
            .addUserOption(opt => opt.setName('discord_user').setDescription('Discord user to link').setRequired(true))
            .addStringOption(opt => opt.setName('group').setDescription('Permission group').setRequired(true).addChoices(...this.groups.getChoices()))
            .addStringOption(opt => opt.setName('citizenfx_id').setDescription('CitizenFX ID (optional)')) as SlashCommandBuilder;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!await this.checkAccess(interaction)) return;

        const username = interaction.options.getString('username', true);
        const groupName = interaction.options.getString('group', true);
        const citizenfxId = interaction.options.getString('citizenfx_id') || '';
        const discordUser = interaction.options.getUser('discord_user', true);

        if (!this.groups.isValid(groupName)) {
            return void await interaction.editReply({
                embeds: [embed('INVALID GROUP', 'Group does not exist.')
                    .addFields(field('AVAILABLE', this.groups.getAll().map(g => `\`${g}\``).join(' • '), false))]
            });
        }

        const result = await this.txAdmin.createAdmin(
            { name: username, citizenfxID: citizenfxId, discordID: discordUser.id },
            this.groups.getPermissions(groupName)
        );

        await this.logger.log({
            action: 'CREATE_ADMIN',
            username,
            group: groupName,
            citizenfxId,
            discordId: discordUser.id,
            discordUser: discordUser.tag,
            executor: interaction.user.tag,
            executorId: interaction.user.id,
            success: result.success,
            error: result.error
        });

        if (result.success) {
            const group = this.groups.get(groupName)!;
            const perms = group.permissions;
            const permPreview = perms.slice(0, 3).join(', ') + (perms.length > 3 ? ` +${perms.length - 3}` : '');

            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle('Account Created')
                    .setColor(COLORS.PRIMARY)
                    .addFields(
                        field('ACCOUNT', `**User:** \`${result.username}\`\n**Pass:** ||\`${result.password}\`||\n**Group:** \`${group.name}\``, false),
                        field('PERMISSIONS', `\`${perms.length}\` total\n\`\`\`${permPreview}\`\`\``, false),
                        field('LINKED', `**CFX:** ${citizenfxId || 'None'}\n**Discord:** <@${discordUser.id}>`, false),
                        field('BY', `<@${interaction.user.id}>`, true),
                        field('WHEN', timestamp(), true)
                    )
                    .setFooter({ text: 'TxAdmin System' })
                    .setTimestamp()]
            });

            discordUser.send({
                embeds: [new EmbedBuilder()
                    .setTitle('TxAdmin Account')
                    .setColor(COLORS.PRIMARY)
                    .addFields(
                        field('LOGIN', `**User:** \`${result.username}\`\n**Pass:** \`${result.password}\``, false),
                        field('INFO', `**Group:** ${group.name}\n**Desc:** ${group.description}`, false),
                        field('NOTES', '• Change password after login\n• Keep credentials secure', false)
                    )
                    .setTimestamp()]
            }).catch(() => console.log(`[WARN] DM failed: ${discordUser.tag}`));

            console.log(`[INFO] Created: ${username} (${groupName}) by ${interaction.user.tag}`);
        } else {
            await interaction.editReply({
                embeds: [embed('CREATION FAILED', result.error || 'Unknown error', COLORS.ERROR)
                    .addFields(field('DETAILS', `**User:** \`${username}\`\n**Group:** \`${groupName}\`\n**Target:** <@${discordUser.id}>`, false))]
            });
        }
    }
}
