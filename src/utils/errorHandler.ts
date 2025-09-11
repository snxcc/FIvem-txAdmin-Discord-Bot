import { ChatInputCommandInteraction } from 'discord.js';
import { createEmbed } from './embedBuilder';
import { MESSAGES } from '../constants';

export const handleCommandError = async (error: any, interaction: ChatInputCommandInteraction): Promise<void> => {
    console.error(`[ERROR] Command ${interaction.commandName}:`, error);
    
    const { title, message } = getErrorDetails(error);
    const embed = createEmbed(title, message);
    
    try {
        const method = interaction.deferred || interaction.replied ? 'editReply' : 'reply';
        const options = method === 'reply' ? { embeds: [embed], ephemeral: true } : { embeds: [embed] };
        await interaction[method](options);
    } catch (replyError) {
        console.error('[ERROR] Failed to send error message:', replyError);
    }
};

const getErrorDetails = (error: any): { title: string; message: string } => {
    if (error.message?.includes('TxAdmin is not running')) {
        return { title: 'TXADMIN NOT RUNNING', message: MESSAGES.TXADMIN_OFFLINE };
    }
    if (error.message?.includes('Failed to authenticate')) {
        return { title: 'AUTHENTICATION FAILED', message: MESSAGES.AUTH_FAILED };
    }
    return { title: 'SYSTEM ERROR', message: 'An unexpected error occurred while processing your request.' };
};