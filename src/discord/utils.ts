import { EmbedBuilder, ChatInputCommandInteraction, APIEmbedField } from 'discord.js';

export const COLORS = {
    PRIMARY: 0x8B5CF6,
    SUCCESS: 0x22c55e,
    ERROR: 0xef4444
} as const;

export const MESSAGES = {
    ACCESS_DENIED: 'Access denied.',
    TXADMIN_OFFLINE: 'TxAdmin server not accessible.',
    AUTH_FAILED: 'Authentication failed.',
    FOOTER: 'TxAdmin System'
} as const;

const ERROR_PATTERNS = [
    { pattern: 'TxAdmin is not running', message: MESSAGES.TXADMIN_OFFLINE },
    { pattern: 'Failed to authenticate', message: MESSAGES.AUTH_FAILED }
] as const;

export const embed = (title: string, description: string, color: number = COLORS.PRIMARY) =>
    new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setDescription(description)
        .setFooter({ text: MESSAGES.FOOTER })
        .setTimestamp();

export const timestamp = () => `<t:${Math.floor(Date.now() / 1000)}:F>`;

export const field = (name: string, value: string, inline = true): APIEmbedField => 
    ({ name, value, inline });

const getErrorMessage = (error: any): string =>
    ERROR_PATTERNS.find(({ pattern }) => error.message?.includes(pattern))?.message || 
    'An unexpected error occurred.';

export const handleError = async (error: any, interaction: ChatInputCommandInteraction): Promise<void> => {
    console.error(`[ERROR] ${interaction.commandName}:`, error);
    
    try {
        const errorEmbed = embed('ERROR', getErrorMessage(error), COLORS.ERROR);
        const method = interaction.deferred || interaction.replied ? 'editReply' : 'reply';
        const payload = { embeds: [errorEmbed], ...(method === 'reply' && { ephemeral: true }) };
        
        await interaction[method](payload);
    } catch (err) {
        console.error('[ERROR] Error response failed:', err);
    }
};
