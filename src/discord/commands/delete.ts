import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from './base';
import { COLORS, embed, timestamp, field } from '../utils';

export class DeleteCommand extends Command {
    name = 'deleteadmin';
    description = 'Delete a TxAdmin account';

    build(): SlashCommandBuilder {
        return this.baseBuilder()
            .addStringOption(opt => opt.setName('username').setDescription('Admin username to delete').setRequired(true)) as SlashCommandBuilder;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!await this.checkAccess(interaction)) return;

        const username = interaction.options.getString('username', true);
        const result = await this.txAdmin.deleteAdmin(username);

        await this.logger.log({
            action: 'DELETE_ADMIN',
            username,
            executor: interaction.user.tag,
            executorId: interaction.user.id,
            success: result.success,
            error: result.error
        });

        await interaction.editReply({
            embeds: [result.success
                ? embed('ACCOUNT DELETED', 'Admin removed successfully.', COLORS.SUCCESS)
                    .addFields(
                        field('DELETED', `\`${username}\``, true),
                        field('BY', `<@${interaction.user.id}>`, true),
                        field('WHEN', timestamp(), true)
                    )
                : embed('DELETION FAILED', result.error || 'Unknown error', COLORS.ERROR)]
        });

        if (result.success) console.log(`[INFO] Deleted: ${username} by ${interaction.user.tag}`);
    }
}
