/**
 * 用户与共享账号的关联类型
 */
export enum RelationType {
  OWNER = 'owner', // 所有者：拥有完全控制权
  CONTRIBUTOR = 'contributor', // 贡献者：有限权限
}

/**
 * 权限配置接口
 */
export interface PermissionConfig {
  read: boolean; // 读取权限
  write: boolean; // 写入权限
  delete?: boolean; // 删除权限（可选）
}

/**
 * 默认权限配置
 */
export const DEFAULT_PERMISSIONS: Record<RelationType, PermissionConfig> = {
  [RelationType.OWNER]: {
    read: true,
    write: true,
    delete: true,
  },
  [RelationType.CONTRIBUTOR]: {
    read: true,
    write: true,
    delete: false,
  },
};

/**
 * 权限操作类型
 */
export enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
}

/**
 * 权限验证结果
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  relationType?: 'owner' | 'contributor';
  permissions?: PermissionConfig;
  reason?: string;
}
