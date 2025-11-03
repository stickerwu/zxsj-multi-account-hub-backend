import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Account } from './account.entity';

// 副本进度数据结构：{ "templateId_bossIndex": boolean }
export interface DungeonProgressData {
  [key: string]: boolean; // key 格式：templateId_bossIndex
}

// 周常任务进度数据结构：{ "templateId": number }
export interface WeeklyTaskProgressData {
  [templateId: string]: number; // 已完成次数
}

@Entity('weekly_progress')
@Unique(['accountId', 'weekStart']) // 确保每个角色每周只有一条进度记录
export class WeeklyProgress {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  progressId: string;

  @BeforeInsert()
  generateId() {
    if (!this.progressId) {
      this.progressId = uuidv4();
    }
  }

  @Column({ type: 'varchar', length: 36 })
  @Index()
  accountId: string;

  @Column({ type: 'date' })
  @Index()
  weekStart: Date; // 本周的起始日期（用于判断重置周期）

  @Column({ type: 'json', nullable: true })
  dungeonProgress: DungeonProgressData; // 副本进度数据

  @Column({ type: 'json', nullable: true })
  weeklyTaskProgress: WeeklyTaskProgressData; // 周常任务进度数据

  @UpdateDateColumn()
  lastUpdated: Date;

  // 关联关系：多个进度记录属于一个角色
  @ManyToOne(() => Account, (account) => account.weeklyProgresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;
}
