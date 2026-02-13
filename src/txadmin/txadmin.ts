import axios, { AxiosError } from 'axios';
import { AdminData, CreateAdminResult, AdminActionResult } from '../types/types';

const TIMEOUTS = { CONNECTION: 5000, REQUEST: 10000 } as const;
const UI_VERSION = '8.0.1';

type AuthState = {
    csrfToken: string;
    cookies: string[];
};

export class TxAdminAPI {
    private auth: AuthState | null = null;

    constructor(
        private readonly baseUrl: string,
        private readonly username: string,
        private readonly password: string
    ) {}

    private async checkConnection(): Promise<boolean> {
        try {
            const { status } = await axios.get(this.baseUrl, { timeout: TIMEOUTS.CONNECTION });
            return status === 200;
        } catch {
            return false;
        }
    }

    private async authenticate(): Promise<boolean> {
        if (!await this.checkConnection()) {
            throw new Error('TxAdmin is not running or not accessible');
        }

        try {
            const { data, headers } = await axios.post(
                `${this.baseUrl}/auth/password?uiVersion=${UI_VERSION}`,
                { username: this.username, password: this.password },
                { timeout: TIMEOUTS.REQUEST }
            );

            if (data.csrfToken) {
                this.auth = {
                    csrfToken: data.csrfToken,
                    cookies: headers['set-cookie'] || []
                };
                console.log('[INFO] Authenticated with TxAdmin');
                return true;
            }

            return false;
        } catch (error: any) {
            console.error('[ERROR] Authentication failed:', error.response?.data || error.message);
            return false;
        }
    }

    private getHeaders() {
        if (!this.auth) throw new Error('Not authenticated');
        
        return {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-txadmin-csrftoken': this.auth.csrfToken,
            'Cookie': this.auth.cookies.join('; ')
        };
    }

    private async ensureAuth(): Promise<void> {
        if (!this.auth && !await this.authenticate()) {
            throw new Error('Failed to authenticate with TxAdmin');
        }
    }

    private async retryWithAuth<T>(fn: () => Promise<T>, error: AxiosError): Promise<T> {
        if (error.response?.status === 403 || error.response?.status === 401) {
            this.auth = null;
            return fn();
        }
        throw error;
    }

    private buildParams(data: Record<string, string>, arrays?: Record<string, string[]>): URLSearchParams {
        const params = new URLSearchParams(data);
        if (arrays) {
            Object.entries(arrays).forEach(([key, values]) => {
                values.forEach(value => params.append(key, value));
            });
        }
        return params;
    }

    private extractError(error: any): string {
        return error.response?.data?.message || 
               error.response?.data?.msg || 
               error.response?.data?.error || 
               error.message;
    }

    async createAdmin(adminData: AdminData, permissions: string[]): Promise<CreateAdminResult> {
        await this.ensureAuth();

        try {
            const params = this.buildParams(
                {
                    name: adminData.name,
                    citizenfxID: adminData.citizenfxID || '',
                    discordID: adminData.discordID || ''
                },
                { 'permissions[]': permissions }
            );

            const { data } = await axios.post(
                `${this.baseUrl}/adminManager/add`,
                params.toString(),
                { headers: this.getHeaders(), timeout: TIMEOUTS.REQUEST }
            );

            if (data.type === 'showPassword') {
                return { success: true, password: data.password, username: adminData.name };
            }

            if (data.type === 'danger' || data.type === 'error') {
                return { success: false, error: data.message || data.msg || data.error || 'Creation failed' };
            }

            return { success: false, error: `Unexpected response: ${JSON.stringify(data)}` };
        } catch (error: any) {
            console.error('[ERROR] Create admin failed:', this.extractError(error));
            return this.retryWithAuth(() => this.createAdmin(adminData, permissions), error)
                .catch(() => ({ success: false, error: this.extractError(error) }));
        }
    }

    async editAdmin(username: string, adminData: AdminData, permissions: string[]): Promise<AdminActionResult> {
        await this.ensureAuth();

        try {
            const params = this.buildParams(
                {
                    name: username,
                    newName: adminData.name,
                    citizenfxID: adminData.citizenfxID || '',
                    discordID: adminData.discordID || ''
                },
                { 'permissions[]': permissions }
            );

            const { data, status } = await axios.post(
                `${this.baseUrl}/adminManager/edit`,
                params.toString(),
                { headers: this.getHeaders(), timeout: TIMEOUTS.REQUEST }
            );

            return data.type === 'success' || status === 200
                ? { success: true, message: 'Admin updated' }
                : { success: false, error: data.message || data.msg || 'Edit failed' };
        } catch (error: any) {
            console.error('[ERROR] Edit admin failed:', this.extractError(error));
            return this.retryWithAuth(() => this.editAdmin(username, adminData, permissions), error)
                .catch(() => ({ success: false, error: this.extractError(error) }));
        }
    }

    async deleteAdmin(username: string): Promise<AdminActionResult> {
        await this.ensureAuth();

        try {
            const params = this.buildParams({ name: username });

            const { data, status } = await axios.post(
                `${this.baseUrl}/adminManager/delete`,
                params.toString(),
                { headers: this.getHeaders(), timeout: TIMEOUTS.REQUEST }
            );

            return data.type === 'success' || status === 200
                ? { success: true, message: 'Admin deleted' }
                : { success: false, error: data.message || data.msg || 'Delete failed' };
        } catch (error: any) {
            console.error('[ERROR] Delete admin failed:', this.extractError(error));
            return this.retryWithAuth(() => this.deleteAdmin(username), error)
                .catch(() => ({ success: false, error: this.extractError(error) }));
        }
    }
}



