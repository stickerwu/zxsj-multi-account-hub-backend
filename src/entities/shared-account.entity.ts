import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserAccountRelation } from './user-account-relation.entity';
import { WeeklyProgress } from './weekly-progress.entity';

/**
 * 共享账号实体
 * 支持多用户共同管理同一个游戏账号
 */
@Entity('shared_accounts')
export class SharedAccount {
  @PrimaryColumn({ type: 'varchar', length: 50, comment: '账号名称，作为主键' })
  accountName: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '显示名称，用于界面展示',
  })
  displayName: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '服务器名称',
  })
  serverName: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: '是否激活状态',
  })
  @Index('idx_shared_accounts_is_active')
  isActive: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  // 关联关系：一个共享账号可以有多个用户关联
  @OneToMany(() => UserAccountRelation, (relation) => relation.sharedAccount, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  userRelations: UserAccountRelation[];

  // 关联关系：一个共享账号可以有多个周进度记录
  @OneToMany(() => WeeklyProgress, (progress) => progress.sharedAccount, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  weeklyProgresses: WeeklyProgress[];
}
