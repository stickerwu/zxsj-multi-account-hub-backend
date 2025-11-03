import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';
import { SharedAccount } from './shared-account.entity';

/**
 * 用户账号关联关系实体
 * 定义用户与共享账号之间的关系和权限
 */
@Entity('user_account_relations')
@Index('unique_user_account', ['userId', 'accountName'], { unique: true })
export class UserAccountRelation {
  @PrimaryColumn({ type: 'varchar', length: 36, comment: '关联关系唯一标识' })
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @Column({ type: 'varchar', length: 36, comment: '用户ID' })
  @Index('idx_user_account_relations_user_id')
  userId: string;

  @Column({ type: 'varchar', length: 50, comment: '共享账号名称' })
  @Index('idx_user_account_relations_account_name')
  accountName: string;

  @Column({
    type: 'enum',
    enum: ['owner', 'contributor'],
    default: 'contributor',
    comment: '关系类型：owner-所有者，contributor-贡献者',
  })
  relationType: 'owner' | 'contributor';

  @Column({
    type: 'json',
    default: () => '\'{"read": true, "write": true}\'',
    comment: '权限配置：read-读取权限，write-写入权限，delete-删除权限',
  })
  permissions: {
    read: boolean;
    write: boolean;
    delete?: boolean;
  };

  @CreateDateColumn({ comment: '加入时间' })
  joinedAt: Date;

  // 关联关系：多个关联关系属于一个用户
  @ManyToOne(() => User, (user) => user.accountRelations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 关联关系：多个关联关系属于一个共享账号
  @ManyToOne(() => SharedAccount, (account) => account.userRelations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountName' })
  sharedAccount: SharedAccount;
}
