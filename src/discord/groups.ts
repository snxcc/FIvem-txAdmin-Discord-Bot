import { GroupsConfig, Group } from '../types/types';
import * as fs from 'fs';
import * as path from 'path';

export class Groups {
    private data!: GroupsConfig;

    constructor() {
        try {
            this.data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'groups.json'), 'utf8'));
        } catch (error) {
            console.error('[ERROR] Failed to load groups.json:', error);
            throw new Error('Could not load group configuration');
        }
    }

    getAll(): string[] {
        return Object.keys(this.data.groups);
    }

    get(name: string): Group | null {
        return this.data.groups[name] || null;
    }

    getPermissions(name: string): string[] {
        return this.get(name)?.permissions || [];
    }

    isValid(name: string): boolean {
        return name in this.data.groups;
    }

    getChoices(): Array<{ name: string; value: string }> {
        return Object.entries(this.data.groups).map(([key, group]) => ({
            name: `${group.name} - ${group.description}`,
            value: key
        }));
    }
}
