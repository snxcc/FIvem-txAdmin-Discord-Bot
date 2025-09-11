import { EmbedBuilder, TextChannel, Client } from 'discord.js';

export interface LogData {
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
}

export class Logger {
    private client: Client;
    private createLogs: boolean;
    private logChannelId?: string;

    constructor(client: Client) {
        this.client = client;
        this.createLogs = process.env.CREATE_LOGS === 'true';
        this.logChannelId = process.env.LOG_CHANNEL_ID;
    }

    async logAdminAction(data: LogData): Promise<void> {
        if (!this.createLogs) return;
        
        const status = data.success ? '' : '_FAILED';
        console.log(`[${data.action}${status}] ${data.username} ${data.group ? `(${data.group})` : ''} by ${data.executor}${data.error ? `: ${data.error}` : ''}`);

        if (this.logChannelId) {
            try {
                const channel = await this.client.channels.fetch(this.logChannelId) as TextChannel;
                if (!channel) return;

                const embed = new EmbedBuilder()
                    .setTitle(`ADMIN ${data.action.replace('_', ' ')}${data.success ? '' : ' FAILED'}`)
                    .setColor(data.success ? 0x22c55e : 0xef4444)
                    .addFields(
                        { name: 'USERNAME', value: `\`${data.username}\``, inline: true },
                        { name: 'EXECUTOR', value: `<@${data.executorId}>`, inline: true },
                        { name: 'TIMESTAMP', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                    )
                    .setFooter({ text: 'TxAdmin Administration System' })
                    .setTimestamp();

                if (data.group) embed.addFields({ name: 'GROUP', value: `\`${data.group}\``, inline: true });
                if (data.citizenfxId) embed.addFields({ name: 'CITIZENFX ID', value: data.citizenfxId, inline: true });
                if (data.discordUser) embed.addFields({ name: 'DISCORD USER', value: data.discordUser, inline: true });
                if (!data.success && data.error) embed.addFields({ name: 'ERROR DETAILS', value: `\`\`\`${data.error}\`\`\``, inline: false });

                await channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('[ERROR] Failed to send channel log:', error);
            }
        }
    }
}