import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { COLORS } from './utils';

export type LogData = {
    action: string;
    username: string;
    executor: string;
    executorId: string;
    success: boolean;
    group?: string;
    citizenfxId?: string;
    discordId?: string;
    discordUser?: string;
    error?: string;
};

export class Logger {
    constructor(private client: Client) {}

    async log(data: LogData): Promise<void> {
        const status = data.success ? '' : '_FAILED';
        const group = data.group ? `(${data.group})` : '';
        const error = data.error ? `: ${data.error}` : '';
        console.log(`[${data.action}${status}] ${data.username} ${group} by ${data.executor}${error}`);
        
        const channelId = process.env[`${data.action}_LOGS`];
        if (!channelId) return;

        try {
            const channel = await this.client.channels.fetch(channelId) as TextChannel;
            if (!channel) return;

            const fields = [
                { name: 'USER', value: `\`${data.username}\``, inline: true },
                { name: 'BY', value: `<@${data.executorId}>`, inline: true },
                { name: 'WHEN', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                ...(data.group ? [{ name: 'GROUP', value: `\`${data.group}\``, inline: true }] : []),
                ...(data.citizenfxId ? [{ name: 'CFX ID', value: data.citizenfxId, inline: true }] : []),
                ...(data.discordUser ? [{ name: 'DISCORD', value: data.discordUser, inline: true }] : []),
                ...(!data.success && data.error ? [{ name: 'ERROR', value: `\`\`\`${data.error}\`\`\``, inline: false }] : [])
            ];

            await channel.send({
                embeds: [new EmbedBuilder()
                    .setTitle(`ADMIN ${data.action.replace('_', ' ')}${status}`)
                    .setColor(data.success ? COLORS.SUCCESS : COLORS.ERROR)
                    .addFields(fields)
                    .setFooter({ text: 'TxAdmin System' })
                    .setTimestamp()]
            });
        } catch (error) {
            console.error('[ERROR] Log channel send failed:', error);
        }
    }
}
