export const COLORS = {
    PRIMARY: 0x8B5CF6,
    SUCCESS: 0x22c55e,
    ERROR: 0xef4444
} as const;

export const MESSAGES = {
    ACCESS_DENIED: 'Access denied: You do not have permission to use this command.',
    TXADMIN_OFFLINE: 'TxAdmin server is not running or not accessible. Please start TxAdmin first.',
    AUTH_FAILED: 'Failed to authenticate with TxAdmin. Check your credentials in the configuration.',
    FOOTER: 'TxAdmin Administration System'
} as const;

export const TIMEOUTS = {
    CONNECTION: 5000,
    REQUEST: 10000
} as const;