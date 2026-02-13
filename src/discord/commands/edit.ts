import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { TxAdminAPI } from '../../txadmin/txadmin';
import { Logger } from '../logger';
import { Groups } from '../groups';
import { Command } from './base';
import { COLORS, embed, timestamp, field } from '../utils';

export class EditCommand extends Command {
    name = 'editadmin';
    description = 'Edit a TxAdmin account';

    constructor(txAdmin: TxAdminAPI, private groups: Groups, logger: Logger, adminRoleId?: string) {
        super(txAdmin, logger, adminRoleId);
    }

    build(): SlashCommandBuilder {
        return this.baseBuilder()
            .addStringOption(opt => opt.setName('username').setDescription('Admin username to edit').setRequired(true))
            .addStringOption(opt => opt.setName('new_group').setDescription('New permission group').setRequired(true).addChoices(...this.groups.getChoices()))
            .addStringOption(opt => opt.setName('new_citizenfx_id').setDescription('New CitizenFX ID (optional)'))
            .addUserOption(opt => opt.setName('new_discord_user').setDescription('New Discord user (optional)')) as SlashCommandBuilder;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!await this.checkAccess(interaction)) return;

        const username = interaction.options.getString('username', true);
        const newGroup = interaction.options.getString('new_group', true);
        const newCitizenfxId = interaction.options.getString('new_citizenfx_id') || '';
        const newDiscordUser = interaction.options.getUser('new_discord_user');

        const result = await this.txAdmin.editAdmin(
            username,
            { name: username, citizenfxID: newCitizenfxId, discordID: newDiscordUser?.id || '' },
            this.groups.getPermissions(newGroup)
        );

        await this.logger.log({
            action: 'EDIT_ADMIN',
            username,
            group: newGroup,
            citizenfxId: newCitizenfxId,
            discordId: newDiscordUser?.id,
            discordUser: newDiscordUser?.tag,
            executor: interaction.user.tag,
            executorId: interaction.user.id,
            success: result.success,
            error: result.error
        });

        await interaction.editReply({
            embeds: [result.success
                ? new EmbedBuilder()
                    .setTitle('Account Updated')
                    .setColor(COLORS.PRIMARY)
                    .addFields(
                        field('ACCOUNT', `\`${username}\``, true),
                        field('NEW GROUP', `\`${this.groups.get(newGroup)!.name}\``, true),
                        field('BY', `<@${interaction.user.id}>`, true),
                        field('NEW CFX', newCitizenfxId || 'None', true),
                        field('NEW DISCORD', newDiscordUser ? `<@${newDiscordUser.id}>` : 'None', true),
                        field('WHEN', timestamp(), true)
                    )
                    .setFooter({ text: 'TxAdmin System' })
                    .setTimestamp()
                : embed('EDIT FAILED', result.error || 'Unknown error', COLORS.ERROR)]
        });

        if (result.success) console.log(`[INFO] Edited: ${username} (${newGroup}) by ${interaction.user.tag}`);
    }
}
