import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { WeeklyProgress } from '../entities/weekly-progress.entity';
import { Account } from '../entities/account.entity';
import { SharedAccount } from '../entities/shared-account.entity';
import { UpdateDungeonProgressDto } from './dto/update-dungeon-progress.dto';
import { UpdateWeeklyTaskProgressDto } from './dto/update-weekly-task-progress.dto';
import { SharedAccountPermissionService } from '../shared-accounts/services/shared-account-permission.service';
import { PermissionAction } from '../shared-accounts/types/permission.types';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(WeeklyProgress)
    private weeklyProgressRepository: Repository<WeeklyProgress>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(SharedAccount)
    private sharedAccountRepository: Repository<SharedAccount>,
    private sharedAccountPermissionService: SharedAccountPermissionService,
  ) {}

  /**
   * 获取当前周的开始时间（周三 8:00 AM）
   */
  private getCurrentWeekStart(): Date {
    const now = new Date();
    const currentDay = now.getDay(); // 0=周日, 1=周一, ..., 6=周六

    // 计算到本周周三的天数差
    let daysFromWednesday;
    if (currentDay >= 3) {
      // 如果是周三或之后，计算从周三开始的天数
      daysFromWednesday = currentDay - 3;
    } else {
      // 如果是周三之前（周日、周一、周二），使用上周三
      daysFromWednesday = currentDay + 7 - 3; // 到上周三的天数
    }

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromWednesday);
    weekStart.setHours(8, 0, 0, 0); // 设置为 8:00 AM

    // 如果当前时间早于本周三 8:00 AM，则使用上周三
    if (weekStart > now) {
      weekStart.setDate(weekStart.getDate() - 7);
    }

    return weekStart;
  }

  /**
   * 验证个人账号权限
   */
  private async validateAccountAccess(
    accountId: string,
    userId: string,
  ): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { accountId },
      relations: ['user'],
    });

    if (!account) {
      throw new NotFoundException('账号不存在');
    }

    if (account.userId !== userId) {
      throw new ForbiddenException('无权访问此账号');
    }

    return account;
  }

  /**
   * 验证共享账号权限
   */
  private async validateSharedAccountAccess(
    accountName: string,
    userId: string,
    action: PermissionAction = PermissionAction.READ,
  ): Promise<SharedAccount> {
    const sharedAccount = await this.sharedAccountRepository.findOne({
      where: { accountName },
    });

    if (!sharedAccount) {
      throw new NotFoundException('共享账号不存在');
    }

    const hasPermission =
      await this.sharedAccountPermissionService.checkPermission(
        userId,
        accountName,
        action,
      );

    if (!hasPermission.hasPermission) {
      throw new ForbiddenException(
        hasPermission.reason || '无权访问此共享账号',
      );
    }

    return sharedAccount;
  }

  /**
   * 获取或创建周进度记录（个人账号）
   */
  private async getOrCreateWeeklyProgress(
    accountId: string,
    weekStart: Date,
  ): Promise<WeeklyProgress> {
    let progress = await this.weeklyProgressRepository.findOne({
      where: { accountId, weekStart },
    });

    if (!progress) {
      // 创建新的周进度记录
      progress = this.weeklyProgressRepository.create({
        progressId: uuidv4(),
        accountId,
        weekStart,
        dungeonProgress: {},
        weeklyTaskProgress: {},
      });
      progress = await this.weeklyProgressRepository.save(progress);
    }

    return progress;
  }

  /**
   * 获取或创建周进度记录（共享账号）
   */
  private async getOrCreateSharedWeeklyProgress(
    sharedAccountName: string,
    weekStart: Date,
  ): Promise<WeeklyProgress> {
    let progress = await this.weeklyProgressRepository.findOne({
      where: { sharedAccountName, weekStart },
    });

    if (!progress) {
      // 创建新的周进度记录
      progress = this.weeklyProgressRepository.create({
        progressId: uuidv4(),
        sharedAccountName,
        weekStart,
        dungeonProgress: {},
        weeklyTaskProgress: {},
      });
      progress = await this.weeklyProgressRepository.save(progress);
    }

    return progress;
  }

  /**
   * 获取用户所有账号的当前周进度（包括个人账号和共享账号）
   */
  /**
   * 获取当前周进度（支持分页）
   */
  async getCurrentWeekProgress(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<WeeklyProgress>> {
    const { page = 1, size = 10, search } = paginationDto;
    const skip = (page - 1) * size;
    const weekStart = this.getCurrentWeekStart();

    // 1. 获取用户的个人账号ID列表
    const accounts = await this.accountRepository.find({
      where: { userId },
    });
    const accountIds = accounts.map((account) => account.accountId);

    // 2. 获取用户有权限访问的共享账号名称列表
    const accessibleSharedAccounts =
      await this.sharedAccountPermissionService.getAccessibleAccounts(
        userId,
        PermissionAction.READ,
      );

    // 3. 构建查询条件
    const queryBuilder = this.weeklyProgressRepository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.account', 'account')
      .leftJoinAndSelect('progress.sharedAccount', 'sharedAccount')
      .where('progress.weekStart = :weekStart', { weekStart });

    // 添加账号过滤条件
    if (accountIds.length > 0 && accessibleSharedAccounts.length > 0) {
      queryBuilder.andWhere(
        '(progress.accountId IN (:...accountIds) OR progress.sharedAccountName IN (:...sharedAccountNames))',
        { accountIds, sharedAccountNames: accessibleSharedAccounts },
      );
    } else if (accountIds.length > 0) {
      queryBuilder.andWhere('progress.accountId IN (:...accountIds)', {
        accountIds,
      });
    } else if (accessibleSharedAccounts.length > 0) {
      queryBuilder.andWhere(
        'progress.sharedAccountName IN (:...sharedAccountNames)',
        {
          sharedAccountNames: accessibleSharedAccounts,
        },
      );
    } else {
      // 用户没有任何账号，返回空结果
      return {
        total: 0,
        items: [],
        page,
        size,
        totalPages: 0,
      };
    }

    // 添加搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(account.accountName LIKE :search OR sharedAccount.accountName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 获取总数
    const total = await queryBuilder.getCount();

    // 获取分页数据
    const items = await queryBuilder
      .orderBy('progress.lastUpdated', 'DESC')
      .skip(skip)
      .take(size)
      .getMany();

    // 为没有进度记录的账号创建空记录（仅在第一页且无搜索时）
    if (page === 1 && !search) {
      const existingAccountIds = items
        .filter((p) => p.accountId)
        .map((p) => p.accountId);
      const existingSharedAccountNames = items
        .filter((p) => p.sharedAccountName)
        .map((p) => p.sharedAccountName);

      const missingAccountIds = accountIds.filter(
        (id) => !existingAccountIds.includes(id),
      );
      const missingSharedAccountNames = accessibleSharedAccounts.filter(
        (name) => !existingSharedAccountNames.includes(name),
      );

      // 创建缺失的个人账号进度记录
      for (const accountId of missingAccountIds) {
        if (items.length < size) {
          const newProgress = await this.getOrCreateWeeklyProgress(
            accountId,
            weekStart,
          );
          const account = accounts.find((acc) => acc.accountId === accountId);
          if (account) {
            newProgress.account = account;
          }
          items.push(newProgress);
        }
      }

      // 创建缺失的共享账号进度记录
      for (const sharedAccountName of missingSharedAccountNames) {
        if (items.length < size) {
          const newProgress = await this.getOrCreateSharedWeeklyProgress(
            sharedAccountName,
            weekStart,
          );
          const sharedAccount = await this.sharedAccountRepository.findOne({
            where: { accountName: sharedAccountName },
          });
          if (sharedAccount) {
            newProgress.sharedAccount = sharedAccount;
          }
          items.push(newProgress);
        }
      }
    }

    const totalPages = Math.ceil(total / size);

    return {
      total,
      items,
      page,
      size,
      totalPages,
    };
  }

  /**
   * 获取指定个人账号的当前周进度
   */
  async getAccountProgress(
    accountId: string,
    userId: string,
  ): Promise<WeeklyProgress> {
    await this.validateAccountAccess(accountId, userId);

    const weekStart = this.getCurrentWeekStart();
    const progress = await this.getOrCreateWeeklyProgress(accountId, weekStart);

    // 加载账号信息
    const account = await this.accountRepository.findOne({
      where: { accountId },
    });
    if (account) {
      progress.account = account;
    }

    return progress;
  }

  /**
   * 获取指定共享账号的当前周进度
   */
  async getSharedAccountProgress(
    accountName: string,
    userId: string,
  ): Promise<WeeklyProgress> {
    await this.validateSharedAccountAccess(
      accountName,
      userId,
      PermissionAction.READ,
    );

    const weekStart = this.getCurrentWeekStart();
    const progress = await this.getOrCreateSharedWeeklyProgress(
      accountName,
      weekStart,
    );

    // 加载共享账号信息
    const sharedAccount = await this.sharedAccountRepository.findOne({
      where: { accountName },
    });
    if (sharedAccount) {
      progress.sharedAccount = sharedAccount;
    }

    return progress;
  }

  /**
   * 更新副本进度（个人账号）
   */
  async updateDungeonProgress(
    updateDungeonProgressDto: UpdateDungeonProgressDto,
    userId: string,
  ): Promise<WeeklyProgress> {
    const { accountId, dungeonName, bossName, killCount } =
      updateDungeonProgressDto;

    await this.validateAccountAccess(accountId, userId);

    const weekStart = this.getCurrentWeekStart();
    const progress = await this.getOrCreateWeeklyProgress(accountId, weekStart);

    // 更新副本进度 - 使用 templateId_bossIndex 作为 key，boolean 作为值
    const dungeonProgress = progress.dungeonProgress || {};
    const progressKey = `${dungeonName}_${bossName}`;

    // 如果击杀次数大于0，则标记为已完成
    dungeonProgress[progressKey] = killCount > 0;

    progress.dungeonProgress = dungeonProgress;
    progress.lastUpdated = new Date();

    return this.weeklyProgressRepository.save(progress);
  }

  /**
   * 更新副本进度（共享账号）
   */
  async updateSharedDungeonProgress(
    updateSharedDungeonProgressDto: {
      sharedAccountName: string;
      dungeonName: string;
      bossName: string;
      killCount: number;
    },
    userId: string,
  ): Promise<WeeklyProgress> {
    const { sharedAccountName, dungeonName, bossName, killCount } =
      updateSharedDungeonProgressDto;

    await this.validateSharedAccountAccess(
      sharedAccountName,
      userId,
      PermissionAction.WRITE,
    );

    const weekStart = this.getCurrentWeekStart();
    const progress = await this.getOrCreateSharedWeeklyProgress(
      sharedAccountName,
      weekStart,
    );

    // 更新副本进度 - 使用 templateId_bossIndex 作为 key，boolean 作为值
    const dungeonProgress = progress.dungeonProgress || {};
    const progressKey = `${dungeonName}_${bossName}`;

    // 如果击杀次数大于0，则标记为已完成
    dungeonProgress[progressKey] = killCount > 0;

    progress.dungeonProgress = dungeonProgress;
    progress.lastUpdated = new Date();

    return this.weeklyProgressRepository.save(progress);
  }

  /**
   * 更新周常任务进度（个人账号）
   */
  async updateWeeklyTaskProgress(
    updateWeeklyTaskProgressDto: UpdateWeeklyTaskProgressDto,
    userId: string,
  ): Promise<WeeklyProgress> {
    const { accountId, taskName, completedCount } = updateWeeklyTaskProgressDto;

    await this.validateAccountAccess(accountId, userId);

    const weekStart = this.getCurrentWeekStart();
    const progress = await this.getOrCreateWeeklyProgress(accountId, weekStart);

    // 更新周常任务进度 - 使用 templateId 作为 key，number 作为值
    const weeklyTaskProgress = progress.weeklyTaskProgress || {};

    weeklyTaskProgress[taskName] = completedCount;

    progress.weeklyTaskProgress = weeklyTaskProgress;
    progress.lastUpdated = new Date();

    return this.weeklyProgressRepository.save(progress);
  }

  /**
   * 更新周常任务进度（共享账号）
   */
  async updateSharedWeeklyTaskProgress(
    updateSharedWeeklyTaskProgressDto: {
      sharedAccountName: string;
      taskName: string;
      completedCount: number;
    },
    userId: string,
  ): Promise<WeeklyProgress> {
    const { sharedAccountName, taskName, completedCount } =
      updateSharedWeeklyTaskProgressDto;

    await this.validateSharedAccountAccess(
      sharedAccountName,
      userId,
      PermissionAction.WRITE,
    );

    const weekStart = this.getCurrentWeekStart();
    const progress = await this.getOrCreateSharedWeeklyProgress(
      sharedAccountName,
      weekStart,
    );

    // 更新周常任务进度 - 使用 templateId 作为 key，number 作为值
    const weeklyTaskProgress = progress.weeklyTaskProgress || {};

    weeklyTaskProgress[taskName] = completedCount;

    progress.weeklyTaskProgress = weeklyTaskProgress;
    progress.lastUpdated = new Date();

    return this.weeklyProgressRepository.save(progress);
  }

  /**
   * 重置所有账号的周进度（定时任务使用）
   */
  async resetAllWeeklyProgress(): Promise<void> {
    const newWeekStart = this.getCurrentWeekStart();
    const newProgressRecords: WeeklyProgress[] = [];

    // 1. 获取所有活跃的个人账号
    const activeAccounts = await this.accountRepository.find({
      where: { isActive: true },
    });

    // 为每个活跃的个人账号创建新的周进度记录
    const personalProgressRecords = activeAccounts.map((account) =>
      this.weeklyProgressRepository.create({
        progressId: uuidv4(),
        accountId: account.accountId,
        weekStart: newWeekStart,
        dungeonProgress: {},
        weeklyTaskProgress: {},
      }),
    );

    newProgressRecords.push(...personalProgressRecords);

    // 2. 获取所有活跃的共享账号
    const activeSharedAccounts = await this.sharedAccountRepository.find({
      where: { isActive: true },
    });

    // 为每个活跃的共享账号创建新的周进度记录
    const sharedProgressRecords = activeSharedAccounts.map((sharedAccount) =>
      this.weeklyProgressRepository.create({
        progressId: uuidv4(),
        sharedAccountName: sharedAccount.accountName,
        weekStart: newWeekStart,
        dungeonProgress: {},
        weeklyTaskProgress: {},
      }),
    );

    newProgressRecords.push(...sharedProgressRecords);

    // 批量保存所有新的周进度记录
    if (newProgressRecords.length > 0) {
      await this.weeklyProgressRepository.save(newProgressRecords);
    }
  }

  /**
   * 获取进度统计信息（包括个人账号和共享账号）
   */
  async getProgressStats(userId: string): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    totalSharedAccounts: number;
    activeSharedAccounts: number;
    currentWeekProgressCount: number;
  }> {
    // 1. 个人账号统计
    const accounts = await this.accountRepository.find({
      where: { userId },
    });

    const activeAccounts = accounts.filter((account) => account.isActive);
    const weekStart = this.getCurrentWeekStart();

    // 2. 共享账号统计
    const accessibleSharedAccounts =
      await this.sharedAccountPermissionService.getAccessibleAccounts(
        userId,
        PermissionAction.READ,
      );

    const sharedAccounts = await this.sharedAccountRepository.find({
      where: { accountName: In(accessibleSharedAccounts) },
    });

    const activeSharedAccounts = sharedAccounts.filter(
      (account) => account.isActive,
    );

    // 3. 当前周进度统计
    let currentWeekProgressCount = 0;

    // 个人账号进度统计
    if (accounts.length > 0) {
      const personalProgressCount = await this.weeklyProgressRepository.count({
        where: {
          accountId: In(accounts.map((acc) => acc.accountId)),
          weekStart,
        },
      });
      currentWeekProgressCount += personalProgressCount;
    }

    // 共享账号进度统计
    if (accessibleSharedAccounts.length > 0) {
      const sharedProgressCount = await this.weeklyProgressRepository.count({
        where: {
          sharedAccountName: In(accessibleSharedAccounts),
          weekStart,
        },
      });
      currentWeekProgressCount += sharedProgressCount;
    }

    return {
      totalAccounts: accounts.length,
      activeAccounts: activeAccounts.length,
      totalSharedAccounts: sharedAccounts.length,
      activeSharedAccounts: activeSharedAccounts.length,
      currentWeekProgressCount,
    };
  }

  /**
   * 获取历史周进度（包括个人账号和共享账号）
   */
  /**
   * 获取历史进度（支持分页）
   */
  async getHistoricalProgress(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<WeeklyProgress>> {
    const { page = 1, size = 10, search } = paginationDto;
    const skip = (page - 1) * size;

    // 1. 获取用户的个人账号ID列表
    const accounts = await this.accountRepository.find({
      where: { userId },
    });
    const accountIds = accounts.map((account) => account.accountId);

    // 2. 获取用户有权限访问的共享账号名称列表
    const accessibleSharedAccounts =
      await this.sharedAccountPermissionService.getAccessibleAccounts(
        userId,
        PermissionAction.READ,
      );

    // 3. 构建查询条件
    const queryBuilder = this.weeklyProgressRepository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.account', 'account')
      .leftJoinAndSelect('progress.sharedAccount', 'sharedAccount');

    // 添加账号过滤条件
    if (accountIds.length > 0 && accessibleSharedAccounts.length > 0) {
      queryBuilder.where(
        '(progress.accountId IN (:...accountIds) OR progress.sharedAccountName IN (:...sharedAccountNames))',
        { accountIds, sharedAccountNames: accessibleSharedAccounts },
      );
    } else if (accountIds.length > 0) {
      queryBuilder.where('progress.accountId IN (:...accountIds)', {
        accountIds,
      });
    } else if (accessibleSharedAccounts.length > 0) {
      queryBuilder.where(
        'progress.sharedAccountName IN (:...sharedAccountNames)',
        {
          sharedAccountNames: accessibleSharedAccounts,
        },
      );
    } else {
      // 用户没有任何账号，返回空结果
      return {
        total: 0,
        items: [],
        page,
        size,
        totalPages: 0,
      };
    }

    // 添加搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(account.accountName LIKE :search OR sharedAccount.accountName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 获取总数
    const total = await queryBuilder.getCount();

    // 获取分页数据
    const items = await queryBuilder
      .orderBy('progress.weekStart', 'DESC')
      .addOrderBy('progress.lastUpdated', 'DESC')
      .skip(skip)
      .take(size)
      .getMany();

    const totalPages = Math.ceil(total / size);

    return {
      total,
      items,
      page,
      size,
      totalPages,
    };
  }
}
