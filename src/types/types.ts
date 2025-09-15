export interface TxAdminConfig {
  url: string;
  username: string;
  password: string;
  guildId?: string;
  adminRoleId?: string;
}

export interface AdminData {
  name: string;
  citizenfxID?: string;
  discordID?: string;
}

export interface CreateAdminResult {
  success: boolean;
  password?: string;
  username?: string;
  error?: string;
}

export interface AdminActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface TxAdminAuthResponse {
  name: string;
  permissions: string[];
  isMaster: boolean;
  isTempPassword: boolean;
  csrfToken: string;
}

export interface TxAdminCreateResponse {
  type: 'showPassword' | 'error' | 'danger' | 'success';
  password?: string;
  message?: string;
  msg?: string;
  error?: string;
}

export interface Group {
  name: string;
  description: string;
  permissions: string[];
}

export interface GroupsConfig {
  groups: {
    [key: string]: Group;
  };
}


