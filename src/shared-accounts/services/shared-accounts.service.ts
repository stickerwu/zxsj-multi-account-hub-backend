import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SharedAccount } from '../../entities/shared-account.entity';
import { UserAccountRelation } from '../../entities/user-account-relation.entity';
import { SharedAccountPermissionService } from './shared-account-permission.service';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../common/dto/pagination.dto';
import {
  RelationType,
  DEFAULT_PERMISSIONS,
  PermissionConfig,
} from '../types/permission.types';

/**
 * 创建共享账号的数据传输对象
 */
export interface CreateSharedAccountDto {
  accountName: string;
  displayName: string;
  serverName: string;
}

/**
 * 更新共享账号的数据传输对象
 */
export interface UpdateSharedAccountDto {
  displayName?: string;
  serverName?: string;
  isActive?: boolean;
}

/**
 * 添加用户到共享账号的数据传输对象
 */
export interface AddUserToAccountDto {
  userId: string;
  relationType?: RelationType;
  permissions?: Partial<PermissionConfig>;
}

/**
 * 共享账号详细信息
 */
export interface SharedAccountDetail extends SharedAccount {
  userRelations: UserAccountRelation[];
  userCount?: number;
}

/**
 * 共享账号业务逻辑服务
 * 负责共享账号的创建、管理、用户关联等核心业务逻辑
 */
@Injectable()
export class SharedAccountsService {
  private readonly logger = new Logger(SharedAccountsService.name);

  constructor(
    @InjectRepository(SharedAccount)
    private readonly sharedAccountRepository: Repository<SharedAccount>,
    @InjectRepository(UserAccountRelation)
    private readonly userAccountRelationRepository: Repository<UserAccountRelation>,
    private readonly permissionService: SharedAccountPermissionService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 创建共享账号
   * @param createDto 创建数据
   * @param creatorUserId 创建者用户ID
   * @returns 创建的共享账号
   */
  async createSharedAccount(
    createDto: CreateSharedAccountDto,
    creatorUserId: string,
  ): Promise<SharedAccount> {
    const { accountName, displayName, serverName } = createDto;

    // 检查账号名是否已存在
    const existingAccount = await this.sharedAccountRepository.findOne({
      where: { accountName },
    });

    if (existingAccount) {
      throw new ConflictException(`共享账号 "${accountName}" 已存在`);
    }

    // 使用事务确保数据一致性
    return await this.dataSource.transaction(async (manager) => {
      // 创建共享账号
      const sharedAccount = manager.create(SharedAccount, {
        accountName,
        displayName,
        serverName,
        isActive: true,
      });

      const savedAccount = await manager.save(SharedAccount, sharedAccount);

      // 创建创建者的关联关系（所有者）
      const ownerRelation = manager.create(UserAccountRelation, {
        id: uuidv4(),
        userId: creatorUserId,
        accountName,
        relationType: RelationType.OWNER,
        permissions: DEFAULT_PERMISSIONS[RelationType.OWNER],
      });

      await manager.save(UserAccountRelation, ownerRelation);

      this.logger.log(
        `共享账号创建成功: ${accountName}, 创建者: ${creatorUserId}`,
      );
      return savedAccount;
    });
  }

  /**
   * 获取用户可访问的共享账号列表
   * @param userId 用户ID
   * @param includeInactive 是否包含非活跃账号
   * @returns 共享账号列表
   */
  /**
   * 获取用户可访问的共享账号列表（支持分页）
   * @param userId 用户ID
   * @param paginationDto 分页参数
   * @param includeInactive 是否包含非活跃账号
   * @returns 分页的共享账号列表
   */
  async getUserAccessibleAccounts(
    userId: string,
    paginationDto: PaginationDto,
    includeInactive: boolean = false,
  ): Promise<PaginatedResponse<SharedAccountDetail>> {
    const { page = 1, size = 20, search } = paginationDto;
    const skip = (page - 1) * size;

    const queryBuilder = this.sharedAccountRepository
      .createQueryBuilder('sa')
      .innerJoin('sa.userRelations', 'uar', 'uar.userId = :userId', { userId })
      .leftJoinAndSelect('sa.userRelations', 'allRelations')
      .leftJoinAndSelect('allRelations.user', 'user');

    if (!includeInactive) {
      queryBuilder.andWhere('sa.isActive = :isActive', { isActive: true });
    }

    // 添加搜索功能
    if (search) {
      queryBuilder.andWhere(
        '(sa.accountName LIKE :search OR sa.displayName LIKE :search OR sa.serverName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 获取总数
    const total = await queryBuilder.getCount();

    // 获取分页数据
    const accounts = await queryBuilder
      .orderBy('sa.updatedAt', 'DESC')
      .skip(skip)
      .take(size)
      .getMany();

    // 添加用户数量统计
    const items = accounts.map((account) => ({
      ...account,
      userCount: account.userRelations?.length || 0,
    }));

    return new PaginatedResponse(items, total, page, size);
  }

  /**
   * 根据账号名获取共享账号详情
   * @param accountName 账号名
   * @param userId 请求用户ID（用于权限验证）
   * @returns 共享账号详情
   */
  async getSharedAccountDetail(
    accountName: string,
    userId: string,
  ): Promise<SharedAccountDetail> {
    // 验证用户是否有读取权限
    const hasPermission = await this.permissionService.canRead(
      userId,
      accountName,
    );
    if (!hasPermission) {
      throw new ForbiddenException('没有权限访问此共享账号');
    }

    const account = await this.sharedAccountRepository.findOne({
      where: { accountName },
      relations: ['userRelations', 'userRelations.user'],
    });

    if (!account) {
      throw new NotFoundException(`共享账号 "${accountName}" 不存在`);
    }

    return {
      ...account,
      userCount: account.userRelations?.length || 0,
    };
  }

  /**
   * 更新共享账号信息
   * @param accountName 账号名
   * @param updateDto 更新数据
   * @param userId 操作用户ID
   * @returns 更新后的共享账号
   */
  async updateSharedAccount(
    accountName: string,
    updateDto: UpdateSharedAccountDto,
    userId: string,
  ): Promise<SharedAccount> {
    // 验证用户是否有写入权限
    const hasPermission = await this.permissionService.canWrite(
      userId,
      accountName,
    );
    if (!hasPermission) {
      throw new ForbiddenException('没有权限修改此共享账号');
    }

    const account = await this.sharedAccountRepository.findOne({
      where: { accountName },
    });

    if (!account) {
      throw new NotFoundException(`共享账号 "${accountName}" 不存在`);
    }

    // 更新字段
    Object.assign(account, updateDto);
    const updatedAccount = await this.sharedAccountRepository.save(account);

    this.logger.log(`共享账号更新成功: ${accountName}, 操作者: ${userId}`);
    return updatedAccount;
  }

  /**
   * 删除共享账号
   * @param accountName 账号名
   * @param userId 操作用户ID
   */
  async deleteSharedAccount(
    accountName: string,
    userId: string,
  ): Promise<void> {
    // 验证用户是否有删除权限
    const hasPermission = await this.permissionService.canDelete(
      userId,
      accountName,
    );
    if (!hasPermission) {
      throw new ForbiddenException('没有权限删除此共享账号');
    }

    const account = await this.sharedAccountRepository.findOne({
      where: { accountName },
    });

    if (!account) {
      throw new NotFoundException(`共享账号 "${accountName}" 不存在`);
    }

    // 使用事务删除相关数据
    await this.dataSource.transaction(async (manager) => {
      // 删除所有用户关联关系
      await manager.delete(UserAccountRelation, { accountName });

      // 删除共享账号
      await manager.delete(SharedAccount, { accountName });
    });

    this.logger.log(`共享账号删除成功: ${accountName}, 操作者: ${userId}`);
  }

  /**
   * 添加用户到共享账号
   * @param accountName 账号名
   * @param addUserDto 添加用户数据
   * @param operatorUserId 操作者用户ID
   * @returns 创建的用户关联关系
   */
  async addUserToAccount(
    accountName: string,
    addUserDto: AddUserToAccountDto,
    operatorUserId: string,
  ): Promise<UserAccountRelation> {
    const {
      userId,
      relationType = RelationType.CONTRIBUTOR,
      permissions,
    } = addUserDto;

    // 验证操作者是否有权限添加用户（通常需要是所有者）
    const isOwner = await this.permissionService.isOwner(
      operatorUserId,
      accountName,
    );
    if (!isOwner) {
      throw new ForbiddenException('只有所有者可以添加用户到共享账号');
    }

    // 检查共享账号是否存在
    const account = await this.sharedAccountRepository.findOne({
      where: { accountName },
    });

    if (!account) {
      throw new NotFoundException(`共享账号 "${accountName}" 不存在`);
    }

    // 检查用户是否已经关联到此账号
    const existingRelation = await this.userAccountRelationRepository.findOne({
      where: { userId, accountName },
    });

    if (existingRelation) {
      throw new ConflictException('用户已经关联到此共享账号');
    }

    // 创建用户关联关系
    const finalPermissions = permissions
      ? { ...DEFAULT_PERMISSIONS[relationType], ...permissions }
      : DEFAULT_PERMISSIONS[relationType];

    const relation = this.userAccountRelationRepository.create({
      id: uuidv4(),
      userId,
      accountName,
      relationType,
      permissions: finalPermissions,
    });

    const savedRelation =
      await this.userAccountRelationRepository.save(relation);

    this.logger.log(
      `用户添加到共享账号成功: userId=${userId}, accountName=${accountName}, 操作者=${operatorUserId}`,
    );

    return savedRelation;
  }

  /**
   * 从共享账号移除用户
   * @param accountName 账号名
   * @param targetUserId 要移除的用户ID
   * @param operatorUserId 操作者用户ID
   */
  async removeUserFromAccount(
    accountName: string,
    targetUserId: string,
    operatorUserId: string,
  ): Promise<void> {
    // 验证操作者是否有权限移除用户
    const isOwner = await this.permissionService.isOwner(
      operatorUserId,
      accountName,
    );
    const isSelf = operatorUserId === targetUserId;

    if (!isOwner && !isSelf) {
      throw new ForbiddenException(
        '只有所有者可以移除其他用户，或用户可以移除自己',
      );
    }

    // 检查目标用户关联关系是否存在
    const relation = await this.userAccountRelationRepository.findOne({
      where: { userId: targetUserId, accountName },
    });

    if (!relation) {
      throw new NotFoundException('用户未关联到此共享账号');
    }

    // 如果要移除的是所有者，需要确保至少还有一个所有者
    if (relation.relationType === 'owner') {
      const ownerCount = await this.userAccountRelationRepository.count({
        where: { accountName, relationType: 'owner' },
      });

      if (ownerCount <= 1) {
        throw new ConflictException('不能移除最后一个所有者');
      }
    }

    await this.userAccountRelationRepository.remove(relation);

    this.logger.log(
      `用户从共享账号移除成功: userId=${targetUserId}, accountName=${accountName}, 操作者=${operatorUserId}`,
    );
  }

  /**
   * 更新用户在共享账号中的权限
   * @param accountName 账号名
   * @param targetUserId 目标用户ID
   * @param newPermissions 新权限配置
   * @param operatorUserId 操作者用户ID
   * @returns 更新后的用户关联关系
   */
  async updateUserPermissions(
    accountName: string,
    targetUserId: string,
    newPermissions: Partial<PermissionConfig>,
    operatorUserId: string,
  ): Promise<UserAccountRelation> {
    // 验证操作者是否有权限修改用户权限（通常需要是所有者）
    const isOwner = await this.permissionService.isOwner(
      operatorUserId,
      accountName,
    );
    if (!isOwner) {
      throw new ForbiddenException('只有所有者可以修改用户权限');
    }

    const relation = await this.userAccountRelationRepository.findOne({
      where: { userId: targetUserId, accountName },
    });

    if (!relation) {
      throw new NotFoundException('用户未关联到此共享账号');
    }

    // 更新权限配置
    const currentPermissions = relation.permissions as PermissionConfig;
    relation.permissions = { ...currentPermissions, ...newPermissions };

    const updatedRelation =
      await this.userAccountRelationRepository.save(relation);

    this.logger.log(
      `用户权限更新成功: userId=${targetUserId}, accountName=${accountName}, 操作者=${operatorUserId}`,
    );

    return updatedRelation;
  }

  /**
   * 获取共享账号的所有用户关联关系
   * @param accountName 账号名
   * @param userId 请求用户ID
   * @returns 用户关联关系列表
   */
  /**
   * 获取共享账号的用户列表（支持分页）
   * @param accountName 账号名
   * @param userId 请求用户ID（用于权限验证）
   * @param paginationDto 分页参数
   * @returns 分页的用户关系列表
   */
  async getAccountUsers(
    accountName: string,
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<UserAccountRelation>> {
    // 验证用户是否有读取权限
    const hasPermission = await this.permissionService.canRead(
      userId,
      accountName,
    );
    if (!hasPermission) {
      throw new ForbiddenException('没有权限查看此共享账号的用户列表');
    }

    const { page = 1, size = 20, search } = paginationDto;
    const skip = (page - 1) * size;

    const queryBuilder = this.userAccountRelationRepository
      .createQueryBuilder('uar')
      .leftJoinAndSelect('uar.user', 'user')
      .where('uar.accountName = :accountName', { accountName });

    // 添加搜索功能（搜索用户名或用户ID）
    if (search) {
      queryBuilder.andWhere(
        '(uar.userId LIKE :search OR user.username LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 获取总数
    const total = await queryBuilder.getCount();

    // 获取分页数据
    const items = await queryBuilder
      .orderBy('uar.joinedAt', 'ASC')
      .skip(skip)
      .take(size)
      .getMany();

    return new PaginatedResponse(items, total, page, size);
  }
}
