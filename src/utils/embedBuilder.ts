import { EmbedBuilder } from 'discord.js';
import { COLORS, MESSAGES } from '../constants';

export const createEmbed = (title: string, description: string, color: number = COLORS.PRIMARY) =>
    new EmbedBuilder().setTitle(title).setColor(color).setDescription(description).setFooter({ text: MESSAGES.FOOTER }).setTimestamp();

export const createErrorEmbed = (error: string) =>
    createEmbed('SYSTEM ERROR', error, COLORS.ERROR).addFields({ name: 'ERROR DETAILS', value: `\`\`\`${error}\`\`\``, inline: false });

export const createSuccessEmbed = (title: string, description: string) =>
    createEmbed(title, description, COLORS.SUCCESS);