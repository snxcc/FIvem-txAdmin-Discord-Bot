import 'dotenv/config';
import { Bot } from '../discord/discord';

try {
    const bot = new Bot({
        url: process.env.TXADMIN_URL!,
        username: process.env.TXADMIN_USERNAME!,
        password: process.env.TXADMIN_PASSWORD!,
        guildId: process.env.DISCORD_GUILD_ID,
        adminRoleId: process.env.ADMIN_ROLE_ID
    });

    const shutdown = async (signal: string) => {
        console.log(`\n[INFO] Received ${signal}, shutting down gracefully...`);
        await bot.stop();
        process.exit(0);
    };

    ['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, () => shutdown(signal)));

    console.log('[INFO] Starting FiveM TxAdmin Bot...');
    bot.start(process.env.DISCORD_TOKEN!);
} catch (error) {
    console.error('[ERROR] Failed to start bot:', error);
    process.exit(1);
}


