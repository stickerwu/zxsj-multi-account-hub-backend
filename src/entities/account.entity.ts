import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { WeeklyProgress } from './weekly-progress.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  accountId: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系：多个角色属于一个用户
  @ManyToOne(() => User, (user) => user.accounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 关联关系：一个角色可以有多个周进度记录
  @OneToMany(() => WeeklyProgress, (progress) => progress.account, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  weeklyProgresses: WeeklyProgress[];
}