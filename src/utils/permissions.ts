import { ChatInputCommandInteraction, GuildMember } from 'discord.js';

import { MESSAGES } from '../constants';

export const checkPermissions = async (interaction: ChatInputCommandInteraction, adminRoleId?: string): Promise<boolean> => {
    const member = interaction.member as GuildMember;
    if (adminRoleId && member && !member.roles.cache.has(adminRoleId)) {
        await interaction.reply({ content: MESSAGES.ACCESS_DENIED, ephemeral: true });
        return false;
    }
    return true;
};