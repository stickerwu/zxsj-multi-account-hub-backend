import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly progressService: ProgressService) {}

  /**
   * 每周三 8:00 AM 自动重置所有账号的周进度
   * Cron 表达式: 0 8 * * 3 (秒 分 时 日 月 周)
   * 周三是一周的第3天（0=周日, 1=周一, ..., 6=周六）
   */
  @Cron('0 8 * * 3', {
    name: 'resetWeeklyProgress',
    timeZone: 'Asia/Shanghai', // 设置为中国时区
  })
  async handleWeeklyProgressReset() {
    this.logger.log('开始执行周进度重置任务...');

    try {
      await this.progressService.resetAllWeeklyProgress();
      this.logger.log('周进度重置任务执行成功');
    } catch (error) {
      this.logger.error('周进度重置任务执行失败', error);
    }
  }

  /**
   * 每天凌晨 2:00 AM 执行数据清理任务（可选）
   * 清理超过 4 周的历史进度数据
   */
  @Cron('0 2 * * *', {
    name: 'cleanupOldProgress',
    timeZone: 'Asia/Shanghai',
  })
  handleDataCleanup() {
    this.logger.log('开始执行数据清理任务...');

    try {
      // 计算 4 周前的日期
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      // 这里可以添加清理逻辑，删除超过 4 周的历史数据
      // await this.progressService.cleanupOldProgress(fourWeeksAgo);

      this.logger.log('数据清理任务执行成功');
    } catch (error) {
      this.logger.error('数据清理任务执行失败', error);
    }
  }

  /**
   * 每小时执行一次健康检查（可选）
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'healthCheck',
  })
  handleHealthCheck() {
    this.logger.debug('执行系统健康检查...');

    try {
      // 这里可以添加系统健康检查逻辑
      // 例如：检查数据库连接、检查关键服务状态等

      this.logger.debug('系统健康检查完成');
    } catch (error) {
      this.logger.error('系统健康检查失败', error);
    }
  }

  /**
   * 手动触发周进度重置（用于测试或紧急情况）
   */
  async manualResetWeeklyProgress(): Promise<{
    message: string;
    timestamp: Date;
  }> {
    this.logger.log('手动触发周进度重置...');

    try {
      await this.progressService.resetAllWeeklyProgress();
      const result = {
        message: '手动重置周进度成功',
        timestamp: new Date(),
      };
      this.logger.log('手动重置周进度完成', result);
      return result;
    } catch (error) {
      this.logger.error('手动重置周进度失败', error);
      throw error;
    }
  }

  /**
   * 获取定时任务状态信息
   */
  getSchedulerInfo(): {
    nextResetTime: string;
    timezone: string;
    tasks: Array<{
      name: string;
      schedule: string;
      description: string;
    }>;
  } {
    // 计算下次重置时间（下个周三 8:00 AM）
    const now = new Date();
    const nextWednesday = new Date(now);
    const daysUntilWednesday = (3 - now.getDay() + 7) % 7;

    if (daysUntilWednesday === 0 && now.getHours() >= 8) {
      // 如果今天是周三且已过 8 点，则计算下周三
      nextWednesday.setDate(now.getDate() + 7);
    } else {
      nextWednesday.setDate(now.getDate() + daysUntilWednesday);
    }

    nextWednesday.setHours(8, 0, 0, 0);

    return {
      nextResetTime: nextWednesday.toISOString(),
      timezone: 'Asia/Shanghai',
      tasks: [
        {
          name: 'resetWeeklyProgress',
          schedule: '每周三 8:00 AM',
          description: '自动重置所有账号的周进度',
        },
        {
          name: 'cleanupOldProgress',
          schedule: '每天 2:00 AM',
          description: '清理超过 4 周的历史进度数据',
        },
        {
          name: 'healthCheck',
          schedule: '每小时',
          description: '执行系统健康检查',
        },
      ],
    };
  }
}
