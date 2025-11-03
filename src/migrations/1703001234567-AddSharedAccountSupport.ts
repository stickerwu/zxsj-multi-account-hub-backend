import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class AddSharedAccountSupport1703001234567
  implements MigrationInterface
{
  name = 'AddSharedAccountSupport1703001234567';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 创建共享账号表
    await queryRunner.createTable(
      new Table({
        name: 'shared_accounts',
        columns: [
          {
            name: 'accountName',
            type: 'varchar',
            length: '50',
            isPrimary: true,
            comment: '共享账号名称（主键）',
          },
          {
            name: 'displayName',
            type: 'varchar',
            length: '100',
            comment: '显示名称',
          },
          {
            name: 'serverName',
            type: 'varchar',
            length: '50',
            comment: '服务器名称',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            comment: '是否激活',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: '创建时间',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: '更新时间',
          },
        ],
        indices: [
          new TableIndex({
            name: 'idx_shared_accounts_server_name',
            columnNames: ['serverName'],
          }),
          new TableIndex({
            name: 'idx_shared_accounts_is_active',
            columnNames: ['isActive'],
          }),
        ],
      }),
      true,
    );

    // 2. 创建用户账号关联表
    await queryRunner.createTable(
      new Table({
        name: 'user_account_relations',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: '关联ID',
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '36',
            comment: '用户ID',
          },
          {
            name: 'accountName',
            type: 'varchar',
            length: '50',
            comment: '共享账号名称',
          },
          {
            name: 'relationType',
            type: 'enum',
            enum: ['owner', 'contributor'],
            default: "'contributor'",
            comment: '关联类型：owner-所有者，contributor-贡献者',
          },
          {
            name: 'permissions',
            type: 'json',
            comment:
              '权限配置：{read: boolean, write: boolean, delete: boolean}',
          },
          {
            name: 'joinedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: '加入时间',
          },
        ],
        indices: [
          new TableIndex({
            name: 'idx_user_account_relations_user_id',
            columnNames: ['userId'],
          }),
          new TableIndex({
            name: 'idx_user_account_relations_account_name',
            columnNames: ['accountName'],
          }),
          new TableIndex({
            name: 'idx_user_account_relations_relation_type',
            columnNames: ['relationType'],
          }),
        ],
        uniques: [
          {
            name: 'uk_user_account_relations_user_account',
            columnNames: ['userId', 'accountName'],
          },
        ],
      }),
      true,
    );

    // 3. 为用户账号关联表添加外键约束
    await queryRunner.createForeignKey(
      'user_account_relations',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['userId'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'fk_user_account_relations_user_id',
      }),
    );

    await queryRunner.createForeignKey(
      'user_account_relations',
      new TableForeignKey({
        columnNames: ['accountName'],
        referencedColumnNames: ['accountName'],
        referencedTableName: 'shared_accounts',
        onDelete: 'CASCADE',
        name: 'fk_user_account_relations_account_name',
      }),
    );

    // 4. 修改 weekly_progress 表以支持共享账号
    // 添加共享账号名称字段
    await queryRunner.query(`
      ALTER TABLE weekly_progress 
      ADD COLUMN sharedAccountName VARCHAR(50) NULL COMMENT '共享账号名称' AFTER accountId
    `);

    // 修改 accountId 字段为可空
    await queryRunner.query(`
      ALTER TABLE weekly_progress 
      MODIFY COLUMN accountId VARCHAR(36) NULL COMMENT '账号ID（向后兼容）'
    `);

    // 添加索引
    await queryRunner.createIndex(
      'weekly_progress',
      new TableIndex({
        name: 'idx_weekly_progress_shared_account_name',
        columnNames: ['sharedAccountName'],
      }),
    );

    // 添加唯一约束确保每个共享账号每周只有一条进度记录
    await queryRunner.query(`
      ALTER TABLE weekly_progress 
      ADD CONSTRAINT uk_weekly_progress_shared_account_week 
      UNIQUE (sharedAccountName, weekStart)
    `);

    // 5. 为 weekly_progress 表添加共享账号外键约束
    await queryRunner.createForeignKey(
      'weekly_progress',
      new TableForeignKey({
        columnNames: ['sharedAccountName'],
        referencedColumnNames: ['accountName'],
        referencedTableName: 'shared_accounts',
        onDelete: 'CASCADE',
        name: 'fk_weekly_progress_shared_account_name',
      }),
    );

    console.log('✅ 共享账号功能数据库结构创建完成');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作：按相反顺序删除

    // 1. 删除 weekly_progress 表的外键约束
    await queryRunner.dropForeignKey(
      'weekly_progress',
      'fk_weekly_progress_shared_account_name',
    );

    // 2. 删除 weekly_progress 表的唯一约束和索引
    await queryRunner.query(`
      ALTER TABLE weekly_progress 
      DROP CONSTRAINT uk_weekly_progress_shared_account_week
    `);

    await queryRunner.dropIndex(
      'weekly_progress',
      'idx_weekly_progress_shared_account_name',
    );

    // 3. 删除 weekly_progress 表的共享账号字段
    await queryRunner.query(`
      ALTER TABLE weekly_progress 
      DROP COLUMN sharedAccountName
    `);

    // 4. 恢复 accountId 字段为非空
    await queryRunner.query(`
      ALTER TABLE weekly_progress 
      MODIFY COLUMN accountId VARCHAR(36) NOT NULL COMMENT '账号ID'
    `);

    // 5. 删除用户账号关联表的外键约束
    await queryRunner.dropForeignKey(
      'user_account_relations',
      'fk_user_account_relations_account_name',
    );
    await queryRunner.dropForeignKey(
      'user_account_relations',
      'fk_user_account_relations_user_id',
    );

    // 6. 删除用户账号关联表
    await queryRunner.dropTable('user_account_relations');

    // 7. 删除共享账号表
    await queryRunner.dropTable('shared_accounts');

    console.log('✅ 共享账号功能数据库结构回滚完成');
  }
}
