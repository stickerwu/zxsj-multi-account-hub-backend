import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DatabaseInitService {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  /**
   * 初始化数据库表和数据
   */
  async initializeDatabase(): Promise<void> {
    try {
      this.logger.log('开始检查数据库表结构...');

      // 检查必要的表是否存在
      const requiredTables = [
        'users',
        'accounts',
        'dungeon_templates',
        'weekly_task_templates',
        'weekly_progress',
      ];

      const missingTables: string[] = [];

      for (const tableName of requiredTables) {
        const exists = await this.tableExists(tableName);
        if (!exists) {
          missingTables.push(tableName);
        }
      }

      if (missingTables.length > 0) {
        this.logger.warn(`发现缺失的表: ${missingTables.join(', ')}`);
        await this.createMissingTables();
        await this.insertDefaultData();
        this.logger.log('数据库初始化完成');
      } else {
        this.logger.log('所有必要的表都已存在');
      }
    } catch (error) {
      this.logger.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查表是否存在
   */
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [tableName],
      );
      return result[0].count > 0;
    } catch (error) {
      this.logger.error(`检查表 ${tableName} 是否存在时出错:`, error);
      return false;
    }
  }

  /**
   * 创建缺失的表
   */
  private async createMissingTables(): Promise<void> {
    this.logger.log('开始创建缺失的数据库表...');

    const sqlFilePath = path.join(process.cwd(), 'init-mysql.sql');

    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL初始化文件不存在: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // 分割SQL语句（以分号分隔）
    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        if (
          statement.toLowerCase().includes('create table') ||
          statement.toLowerCase().includes('insert into')
        ) {
          await this.dataSource.query(statement);
        }
      } catch (error) {
        // 忽略表已存在的错误
        if (!error.message.includes('already exists')) {
          this.logger.error(
            `执行SQL语句失败: ${statement.substring(0, 100)}...`,
            error,
          );
        }
      }
    }
  }

  /**
   * 插入默认数据
   */
  private async insertDefaultData(): Promise<void> {
    this.logger.log('开始插入默认数据...');

    try {
      // 检查是否已有默认数据
      const dungeonCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM dungeon_templates',
      );

      const taskCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM weekly_task_templates',
      );

      if (dungeonCount[0].count === 0) {
        this.logger.log('插入默认副本模板数据...');
        await this.insertDefaultDungeonTemplates();
      }

      if (taskCount[0].count === 0) {
        this.logger.log('插入默认周常任务模板数据...');
        await this.insertDefaultWeeklyTaskTemplates();
      }

      // 检查并创建默认管理员账号
      await this.createDefaultAdminUser();
    } catch (error) {
      this.logger.error('插入默认数据失败:', error);
    }
  }

  /**
   * 插入默认副本模板
   */
  private async insertDefaultDungeonTemplates(): Promise<void> {
    const defaultDungeons = [
      {
        templateId: 'dungeon-001',
        dungeonName: '青云门',
        bosses: JSON.stringify(['守山弟子', '青云长老', '道玄真人']),
      },
      {
        templateId: 'dungeon-002',
        dungeonName: '天音寺',
        bosses: JSON.stringify(['天音弟子', '普智大师', '普泓方丈']),
      },
      {
        templateId: 'dungeon-003',
        dungeonName: '焚香谷',
        bosses: JSON.stringify(['焚香弟子', '云易岚', '云翼清']),
      },
      {
        templateId: 'dungeon-004',
        dungeonName: '合欢派',
        bosses: JSON.stringify(['合欢弟子', '金瓶儿', '三妙夫人']),
      },
    ];

    for (const dungeon of defaultDungeons) {
      await this.dataSource.query(
        `INSERT INTO dungeon_templates (templateId, dungeonName, bosses, createdAt, updatedAt) 
         VALUES (?, ?, ?, NOW(), NOW())`,
        [dungeon.templateId, dungeon.dungeonName, dungeon.bosses],
      );
    }
  }

  /**
   * 插入默认周常任务模板
   */
  private async insertDefaultWeeklyTaskTemplates(): Promise<void> {
    const defaultTasks = [
      { templateId: 'task-001', taskName: '日常修炼', targetCount: 7 },
      { templateId: 'task-002', taskName: '副本挑战', targetCount: 5 },
      { templateId: 'task-003', taskName: '帮派任务', targetCount: 10 },
      { templateId: 'task-004', taskName: '竞技场战斗', targetCount: 3 },
      { templateId: 'task-005', taskName: '世界BOSS', targetCount: 2 },
      { templateId: 'task-006', taskName: '师门任务', targetCount: 20 },
    ];

    for (const task of defaultTasks) {
      await this.dataSource.query(
        `INSERT INTO weekly_task_templates (templateId, taskName, targetCount, createdAt, updatedAt) 
         VALUES (?, ?, ?, NOW(), NOW())`,
        [task.templateId, task.taskName, task.targetCount],
      );
    }
  }

  /**
   * 创建默认管理员用户
   */
  private async createDefaultAdminUser(): Promise<void> {
    try {
      // 从环境变量获取管理员配置
      const adminUsername = this.configService.get<string>(
        'DEFAULT_ADMIN_USERNAME',
        'stickerwu',
      );
      const adminPassword = this.configService.get<string>(
        'DEFAULT_ADMIN_PASSWORD',
        'wuCHANGWEI0519',
      );
      const adminEmail = this.configService.get<string>(
        'DEFAULT_ADMIN_EMAIL',
        'admin@zxsj.com',
      );

      // 检查管理员用户是否已存在
      const existingAdmin = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM users WHERE username = ? OR role = ?',
        [adminUsername, 'admin'],
      );

      if (existingAdmin[0].count > 0) {
        this.logger.log('默认管理员账号已存在，跳过创建');
        return;
      }

      this.logger.log('创建默认管理员账号...');

      // 生成密码哈希
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

      // 生成用户ID
      const userId = uuidv4();

      // 插入管理员用户
      await this.dataSource.query(
        `INSERT INTO users (userId, username, email, passwordHash, role, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, 'admin', NOW(), NOW())`,
        [userId, adminUsername, adminEmail, passwordHash],
      );

      this.logger.log(`默认管理员账号创建成功: ${adminUsername}`);
    } catch (error) {
      this.logger.error('创建默认管理员账号失败:', error);
      // 不抛出错误，避免影响其他初始化流程
    }
  }
}
