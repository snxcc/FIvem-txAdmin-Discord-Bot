import { TxAdminConfig } from '../types';

export const validateConfig = (config: TxAdminConfig): void => {
    const required = ['url', 'username', 'password'];
    const missing = required.filter(key => !config[key as keyof TxAdminConfig]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required config: ${missing.join(', ')}`);
    }
    
    if (!config.url.startsWith('http')) {
        throw new Error('TxAdmin URL must start with http:// or https://');
    }
};

export const createConfig = (): TxAdminConfig => {
    const config: TxAdminConfig = {
        url: process.env.TXADMIN_URL!,
        username: process.env.TXADMIN_USERNAME!,
        password: process.env.TXADMIN_PASSWORD!,
        guildId: process.env.DISCORD_GUILD_ID,
        adminRoleId: process.env.ADMIN_ROLE_ID
    };
    
    validateConfig(config);
    return config;
};