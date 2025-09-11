import { BaseCommand } from '../commands/base';
import { CreateAdminCommand, DeleteAdminCommand, EditAdminCommand } from '../commands';
import { TxAdminAPI } from '../api/txadmin';
import { GroupManager } from '../managers/groupManager';
import { Logger } from '../services/logger';

export class CommandFactory {
    static createCommands(txAdmin: TxAdminAPI, groupManager: GroupManager, logger: Logger, adminRoleId?: string): BaseCommand[] {
        return [
            new CreateAdminCommand(txAdmin, groupManager, logger, adminRoleId),
            new DeleteAdminCommand(txAdmin, logger, adminRoleId),
            new EditAdminCommand(txAdmin, groupManager, logger, adminRoleId)
        ];
    }
}