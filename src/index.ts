import * as dotenv from 'dotenv';
import { TxAdminBot } from './core/bot';
import { createConfig } from './utils/config';

dotenv.config();

const requiredEnvVars = ['DISCORD_TOKEN', 'TXADMIN_USERNAME', 'TXADMIN_PASSWORD', 'TXADMIN_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('[ERROR] Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
}

try {
    const config = createConfig();
    const bot = new TxAdminBot(config);

    process.on('SIGINT', async () => {
        console.log('\n[INFO] Received SIGINT, shutting down gracefully...');
        await bot.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n[INFO] Received SIGTERM, shutting down gracefully...');
        await bot.stop();
        process.exit(0);
    });

    console.log('[INFO] Starting FiveM TxAdmin Bot...');
    bot.start(process.env.DISCORD_TOKEN!);
} catch (error) {
    console.error('[ERROR] Failed to start bot:', error);
    process.exit(1);
}