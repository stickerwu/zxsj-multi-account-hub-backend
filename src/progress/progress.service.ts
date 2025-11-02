import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { WeeklyProgress, DungeonProgressData, WeeklyTaskProgressData } from '../entities/weekly-progress.entity';
import { Account } from '../entities/account.entity';
import { UpdateDungeonProgressDto } from './dto/update-dungeon-progress.dto';
import { UpdateWeeklyTaskProgressDto } from './dto/update-weekly-task-progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(WeeklyProgress)
    private weeklyProgressRepository: Repository<WeeklyProgress>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  /**
   * 获取当前周的开始时间（周三 8:00 AM）
   */
  private getCurrentWeekStart(): Date {
    const now = new Date();
    const currentDay = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const daysToWednesday = (3 - currentDay + 7) % 7; // 计算到周三的天数
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToWednesday);
    weekStart.setHours(8, 0, 0, 0); // 设置为 8:00 AM
    
    // 如果当前时间早于本周三 8:00 AM，则使用上周三
    if (weekStart > now) {
      weekStart.setDate(weekStart.getDate() - 7);
    }
    
    return weekStart;
  }

  /**
   * 验证账号权限
   */
  private async validateAccountAccess(accountId: string, userId: string): Promise<Account> {
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
   * 获取或创建周进度记录
   */
  private async getOrCreateWeeklyProgress(accountId: string, weekStart: Date): Promise<WeeklyProgress> {
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
   * 获取用户所有账号的当前周进度
   */
  async getCurrentWeekProgress(userId: string): Promise<WeeklyProgress[]> {
    const weekStart = this.getCurrentWeekStart();
    
    // 获取用户的所有账号
    const accounts = await this.accountRepository.find({
      where: { userId },
    });

    const accountIds = accounts.map(account => account.accountId);
    
    if (accountIds.length === 0) {
      return [];
    }

    // 获取所有账号的当前周进度
    const progressList = await this.weeklyProgressRepository.find({
      where: { accountId: accountIds as any, weekStart },
      relations: ['account'],
      order: { lastUpdated: 'DESC' },
    });

    // 为没有进度记录的账号创建空记录
    const existingAccountIds = progressList.map(p => p.accountId);
    const missingAccountIds = accountIds.filter(id => !existingAccountIds.includes(id));

    for (const accountId of missingAccountIds) {
      const newProgress = await this.getOrCreateWeeklyProgress(accountId, weekStart);
      const account = accounts.find(acc => acc.accountId === accountId);
      if (account) {
        newProgress.account = account;
      }
      progressList.push(newProgress);
    }

    return progressList;
  }

  /**
   * 获取指定账号的当前周进度
   */
  async getAccountProgress(accountId: string, userId: string): Promise<WeeklyProgress> {
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
   * 更新副本进度
   */
  async updateDungeonProgress(
    updateDungeonProgressDto: UpdateDungeonProgressDto,
    userId: string,
  ): Promise<WeeklyProgress> {
    const { accountId, dungeonName, bossName, killCount } = updateDungeonProgressDto;
    
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
   * 更新周常任务进度
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
   * 重置所有账号的周进度（定时任务使用）
   */
  async resetAllWeeklyProgress(): Promise<void> {
    const newWeekStart = this.getCurrentWeekStart();
    
    // 获取所有活跃账号
    const activeAccounts = await this.accountRepository.find({
      where: { isActive: true },
    });

    // 为每个活跃账号创建新的周进度记录
    const newProgressRecords = activeAccounts.map(account => 
      this.weeklyProgressRepository.create({
        progressId: uuidv4(),
        accountId: account.accountId,
        weekStart: newWeekStart,
        dungeonProgress: {},
        weeklyTaskProgress: {},
      })
    );

    await this.weeklyProgressRepository.save(newProgressRecords);
  }

  /**
   * 获取进度统计信息
   */
  async getProgressStats(userId: string): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    currentWeekProgressCount: number;
  }> {
    const accounts = await this.accountRepository.find({
      where: { userId },
    });

    const activeAccounts = accounts.filter(account => account.isActive);
    const weekStart = this.getCurrentWeekStart();
    
    const currentWeekProgressCount = await this.weeklyProgressRepository.count({
      where: { 
        accountId: accounts.map(acc => acc.accountId) as any,
        weekStart,
      },
    });

    return {
      totalAccounts: accounts.length,
      activeAccounts: activeAccounts.length,
      currentWeekProgressCount,
    };
  }

  /**
   * 获取历史周进度
   */
  async getHistoricalProgress(userId: string, weeks: number = 4): Promise<WeeklyProgress[]> {
    const accounts = await this.accountRepository.find({
      where: { userId },
    });

    if (accounts.length === 0) {
      return [];
    }

    const accountIds = accounts.map(account => account.accountId);
    
    return this.weeklyProgressRepository.find({
      where: { accountId: accountIds as any },
      relations: ['account'],
      order: { weekStart: 'DESC' },
      take: weeks * accountIds.length,
    });
  }
}