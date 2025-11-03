import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Account } from './account.entity';
import { UserAccountRelation } from './user-account-relation.entity';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  userId: string;

  @BeforeInsert()
  generateId() {
    if (!this.userId) {
      this.userId = uuidv4();
    }
  }

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'user'],
    default: 'user',
    comment: '用户角色：admin-管理员，user-普通用户',
  })
  role: 'admin' | 'user';

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

  // 关联关系：一个用户可以有多个共享账号关联
  @OneToMany(() => UserAccountRelation, (relation) => relation.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  accountRelations: UserAccountRelation[];
}
