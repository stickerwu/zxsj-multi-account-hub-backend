import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Account } from './account.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  username: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  @Index()
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系：一个用户可以有多个游戏角色
  @OneToMany(() => Account, (account) => account.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  accounts: Account[];
}
