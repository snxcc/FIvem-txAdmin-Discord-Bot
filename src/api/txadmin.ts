import axios from 'axios';
import { AdminData, CreateAdminResult, AdminActionResult } from '../types';
import { TIMEOUTS } from '../constants';

export class TxAdminAPI {
    private baseUrl: string;
    private username: string;
    private password: string;
    private csrfToken: string | null = null;
    private cookies: string[] | null = null;

    constructor(baseUrl: string, username: string, password: string) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
    }

    async checkConnection(): Promise<boolean> {
        try {
            return (await axios.get(this.baseUrl, { timeout: TIMEOUTS.CONNECTION })).status === 200;
        } catch { return false; }
    }

    async authenticate(): Promise<boolean> {
        if (!(await this.checkConnection())) throw new Error('TxAdmin is not running or not accessible');
        try {
            const response = await axios.post(`${this.baseUrl}/auth/password?uiVersion=8.0.1`, 
                { username: this.username, password: this.password }, { timeout: TIMEOUTS.REQUEST });
            if (response.data.csrfToken) {
                this.csrfToken = response.data.csrfToken;
                this.cookies = response.headers['set-cookie'] || null;
                console.log('[INFO] Successfully authenticated with TxAdmin');
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('[ERROR] Authentication failed:', error.response?.data || error.message);
            return false;
        }
    }

    async createAdmin(adminData: AdminData, permissions: string[]): Promise<CreateAdminResult> {
        if (!this.csrfToken && !(await this.authenticate())) throw new Error('Failed to authenticate with TxAdmin');
        try {
            const params = new URLSearchParams();
            params.append('name', adminData.name);
            params.append('citizenfxID', adminData.citizenfxID || '');
            params.append('discordID', adminData.discordID || '');
            permissions.forEach(p => params.append('permissions[]', p));

            const response = await axios.post(`${this.baseUrl}/adminManager/add`, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-txadmin-csrftoken': this.csrfToken!, 'Cookie': this.cookies?.join('; ') || '' },
                timeout: TIMEOUTS.REQUEST
            });

            if (response.data.type === 'showPassword') return { success: true, password: response.data.password, username: adminData.name };
            if (response.data.type === 'danger' || response.data.type === 'error') return { success: false, error: response.data.message || response.data.msg || response.data.error || 'Admin creation failed' };
            return { success: false, error: `Unexpected response format: ${JSON.stringify(response.data)}` };
        } catch (error: any) {
            console.error('[ERROR] Failed to create admin:', error.response?.data || error.message);
            if (error.response?.status === 403 || error.response?.status === 401) {
                this.csrfToken = null;
                return this.createAdmin(adminData, permissions);
            }
            return { success: false, error: error.response?.data?.message || error.message };
        }
    }



    async deleteAdmin(username: string): Promise<AdminActionResult> {
        if (!this.csrfToken && !(await this.authenticate())) throw new Error('Failed to authenticate with TxAdmin');
        try {
            const params = new URLSearchParams();
            params.append('name', username);
            const response = await axios.post(`${this.baseUrl}/adminManager/delete`, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-txadmin-csrftoken': this.csrfToken!, 'Cookie': this.cookies?.join('; ') || '' },
                timeout: TIMEOUTS.REQUEST
            });
            return (response.data.type === 'success' || response.status === 200) 
                ? { success: true, message: 'Admin deleted successfully' }
                : { success: false, error: response.data.message || response.data.msg || 'Delete failed' };
        } catch (error: any) {
            console.error('[ERROR] Failed to delete admin:', error.response?.data || error.message);
            if (error.response?.status === 403 || error.response?.status === 401) {
                this.csrfToken = null;
                return this.deleteAdmin(username);
            }
            return { success: false, error: error.response?.data?.message || error.message };
        }
    }



    async editAdmin(username: string, adminData: AdminData, permissions: string[]): Promise<AdminActionResult> {
        if (!this.csrfToken && !(await this.authenticate())) throw new Error('Failed to authenticate with TxAdmin');
        try {
            const params = new URLSearchParams();
            params.append('name', username);
            params.append('newName', adminData.name);
            params.append('citizenfxID', adminData.citizenfxID || '');
            params.append('discordID', adminData.discordID || '');
            permissions.forEach(p => params.append('permissions[]', p));

            const response = await axios.post(`${this.baseUrl}/adminManager/edit`, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-txadmin-csrftoken': this.csrfToken!, 'Cookie': this.cookies?.join('; ') || '' },
                timeout: TIMEOUTS.REQUEST
            });
            return (response.data.type === 'success' || response.status === 200)
                ? { success: true, message: 'Admin updated successfully' }
                : { success: false, error: response.data.message || response.data.msg || 'Edit failed' };
        } catch (error: any) {
            console.error('[ERROR] Failed to edit admin:', error.response?.data || error.message);
            if (error.response?.status === 403 || error.response?.status === 401) {
                this.csrfToken = null;
                return this.editAdmin(username, adminData, permissions);
            }
            return { success: false, error: error.response?.data?.message || error.message };
        }
    }


}