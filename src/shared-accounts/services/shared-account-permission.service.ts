import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccountRelation } from '../../entities/user-account-relation.entity';
import {
  PermissionAction,
  PermissionCheckResult,
  RelationType,
  PermissionConfig,
  DEFAULT_PERMISSIONS,
} from '../types/permission.types';

/**
 * 共享账号权限验证服务
 * 负责验证用户对共享账号的各种操作权限
 */
@Injectable()
export class SharedAccountPermissionService {
  private readonly logger = new Logger(SharedAccountPermissionService.name);

  constructor(
    @InjectRepository(UserAccountRelation)
    private readonly userAccountRelationRepository: Repository<UserAccountRelation>,
  ) {}

  /**
   * 检查用户是否有权限执行指定操作
   * @param userId 用户ID
   * @param accountName 共享账号名称
   * @param action 操作类型
   * @returns 权限检查结果
   */
  async checkPermission(
    userId: string,
    accountName: string,
    action: PermissionAction,
  ): Promise<PermissionCheckResult> {
    try {
      // 查找用户与共享账号的关联关系
      const relation = await this.userAccountRelationRepository.findOne({
        where: {
          userId,
          accountName,
        },
      });

      if (!relation) {
        return {
          hasPermission: false,
          reason: '用户未关联到此共享账号',
        };
      }

      // 获取用户权限配置
      const permissions = relation.permissions as PermissionConfig;

      // 检查具体权限
      const hasPermission = permissions[action] === true;

      return {
        hasPermission,
        relationType: relation.relationType,
        permissions,
        reason: hasPermission ? undefined : `用户没有 ${action} 权限`,
      };
    } catch (error) {
      this.logger.error(
        `权限检查失败: userId=${userId}, accountName=${accountName}, action=${action}`,
        error.stack,
      );
      return {
        hasPermission: false,
        reason: '权限检查过程中发生错误',
      };
    }
  }

  /**
   * 检查用户是否为共享账号的所有者
   * @param userId 用户ID
   * @param accountName 共享账号名称
   * @returns 是否为所有者
   */
  async isOwner(userId: string, accountName: string): Promise<boolean> {
    try {
      const relation = await this.userAccountRelationRepository.findOne({
        where: {
          userId,
          accountName,
          relationType: RelationType.OWNER,
        },
      });

      return !!relation;
    } catch (error) {
      this.logger.error(
        `所有者检查失败: userId=${userId}, accountName=${accountName}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * 检查用户是否有读取权限
   * @param userId 用户ID
   * @param accountName 共享账号名称
   * @returns 是否有读取权限
   */
  async canRead(userId: string, accountName: string): Promise<boolean> {
    const result = await this.checkPermission(
      userId,
      accountName,
      PermissionAction.READ,
    );
    return result.hasPermission;
  }

  /**
   * 检查用户是否有写入权限
   * @param userId 用户ID
   * @param accountName 共享账号名称
   * @returns 是否有写入权限
   */
  async canWrite(userId: string, accountName: string): Promise<boolean> {
    const result = await this.checkPermission(
      userId,
      accountName,
      PermissionAction.WRITE,
    );
    return result.hasPermission;
  }

  /**
   * 检查用户是否有删除权限
   * @param userId 用户ID
   * @param accountName 共享账号名称
   * @returns 是否有删除权限
   */
  async canDelete(userId: string, accountName: string): Promise<boolean> {
    const result = await this.checkPermission(
      userId,
      accountName,
      PermissionAction.DELETE,
    );
    return result.hasPermission;
  }

  /**
   * 获取用户对共享账号的所有权限信息
   * @param userId 用户ID
   * @param accountName 共享账号名称
   * @returns 权限信息
   */
  async getUserPermissions(
    userId: string,
    accountName: string,
  ): Promise<PermissionCheckResult> {
    return this.checkPermission(userId, accountName, PermissionAction.READ);
  }

  /**
   * 批量检查用户对多个共享账号的权限
   * @param userId 用户ID
   * @param accountNames 共享账号名称列表
   * @param action 操作类型
   * @returns 权限检查结果映射
   */
  async batchCheckPermissions(
    userId: string,
    accountNames: string[],
    action: PermissionAction,
  ): Promise<Record<string, PermissionCheckResult>> {
    const results: Record<string, PermissionCheckResult> = {};

    // 并行检查所有权限
    const promises = accountNames.map(async (accountName) => {
      const result = await this.checkPermission(userId, accountName, action);
      results[accountName] = result;
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * 获取用户有权限访问的共享账号列表
   * @param userId 用户ID
   * @param action 操作类型（可选，默认为读取权限）
   * @returns 有权限的共享账号名称列表
   */
  async getAccessibleAccounts(
    userId: string,
    action: PermissionAction = PermissionAction.READ,
  ): Promise<string[]> {
    try {
      const relations = await this.userAccountRelationRepository.find({
        where: { userId },
      });

      const accessibleAccounts: string[] = [];

      for (const relation of relations) {
        const permissions = relation.permissions as PermissionConfig;
        if (permissions[action] === true) {
          accessibleAccounts.push(relation.accountName);
        }
      }

      return accessibleAccounts;
    } catch (error) {
      this.logger.error(
        `获取可访问账号列表失败: userId=${userId}, action=${action}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * 验证并抛出权限异常（用于装饰器或中间件）
   * @param userId 用户ID
   * @param accountName 共享账号名称
   * @param action 操作类型
   * @throws 如果没有权限则抛出异常
   */
  async validatePermissionOrThrow(
    userId: string,
    accountName: string,
    action: PermissionAction,
  ): Promise<void> {
    const result = await this.checkPermission(userId, accountName, action);

    if (!result.hasPermission) {
      throw new Error(`权限不足: ${result.reason}`);
    }
  }
}
