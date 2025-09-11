import * as fs from 'fs';
import * as path from 'path';
import { GroupsConfig, Group } from '../types';

export class GroupManager {
    private groups!: GroupsConfig;
    private groupsPath: string;

    constructor() {
        this.groupsPath = path.join(process.cwd(), 'groups.json');
        this.loadGroups();
    }

    private loadGroups(): void {
        try {
            const data = fs.readFileSync(this.groupsPath, 'utf8');
            this.groups = JSON.parse(data);
        } catch (error) {
            console.error('[ERROR] Failed to load groups.json:', error);
            throw new Error('Could not load group configuration');
        }
    }

    getAvailableGroups(): string[] {
        return Object.keys(this.groups.groups);
    }

    getGroup(groupName: string): Group | null {
        return this.groups.groups[groupName] || null;
    }

    getGroupPermissions(groupName: string): string[] {
        const group = this.getGroup(groupName);
        return group ? group.permissions : [];
    }

    getGroupDescription(groupName: string): string {
        const group = this.getGroup(groupName);
        return group ? `${group.name} - ${group.description}` : 'Unknown group';
    }

    validateGroup(groupName: string): boolean {
        return this.groups.groups.hasOwnProperty(groupName);
    }

    getGroupChoices(): Array<{ name: string; value: string }> {
        return Object.entries(this.groups.groups).map(([key, group]) => ({
            name: `${group.name} - ${group.description}`,
            value: key
        }));
    }
}