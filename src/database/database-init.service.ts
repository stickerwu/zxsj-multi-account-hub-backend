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

      // 无论是否缺表，均在启动时执行管理员账号验证与同步，确保与 .env 配置一致
      await this.verifyAndSyncDefaultAdmin();
      this.startDbKeepAlive();
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

      // 检查并创建默认管理员账号（首次初始化场景）
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

  private startDbKeepAlive(): void {
    const interval = parseInt(
      this.configService.get<string>('DB_IDLE_TIMEOUT') || '300000',
      10,
    );
    const timer = setInterval(() => {
      void this.dataSource
        .query('SELECT 1')
        .catch(() => this.logger.warn('数据库 keep-alive 失败'));
    }, interval);
    timer.unref();
  }

  /**
   * 验证并同步默认管理员账号到 .env 配置
   * 该方法在每次应用启动时都会执行，确保管理员账号与 .env 保持一致。
   */
  private async verifyAndSyncDefaultAdmin(): Promise<void> {
    try {
      // 从 .env 读取管理员配置，不再使用任何硬编码默认值（安全要求）
      const adminUsername = this.configService.get<string>(
        'DEFAULT_ADMIN_USERNAME',
      );
      const adminPassword = this.configService.get<string>(
        'DEFAULT_ADMIN_PASSWORD',
      );
      const adminEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');
      const nodeEnv =
        this.configService.get<string>('NODE_ENV') ||
        process.env.NODE_ENV ||
        'development';

      // 若任一关键配置缺失，则记录警告并跳过自动同步，避免使用不安全的默认值
      if (!adminUsername || !adminPassword || !adminEmail) {
        this.logger.warn(
          '默认管理员配置缺失：必须在 .env 中设置 DEFAULT_ADMIN_USERNAME / DEFAULT_ADMIN_PASSWORD / DEFAULT_ADMIN_EMAIL。已跳过自动同步。',
        );
        return;
      }

      // 生产环境下进行弱密码阻断：长度与复杂度要求（防止弱口令被使用）
      if (nodeEnv === 'production' && this.isWeakPassword(adminPassword)) {
        this.logger.error(
          '生产环境检测到弱密码：请在 .env 中为 DEFAULT_ADMIN_PASSWORD 设置更复杂的强密码。已阻断自动同步。',
        );
        return;
      }
      // 删除嵌入的弱密码检测函数，方法已移至类内部
      // 优先按用户名查找（确保与 .env 指定的用户名一致）
      const usersByUsername = await this.dataSource.query(
        'SELECT userId, username, email, passwordHash, role FROM users WHERE username = ?',
        [adminUsername],
      );

      if (usersByUsername.length > 0) {
        const user = usersByUsername[0];
        let needUpdate = false;
        let newPasswordHash = user.passwordHash;

        // 若角色不是 admin，则同步为管理员角色
        if (user.role !== 'admin') {
          needUpdate = true;
        }

        // 验证密码是否与 .env 一致，不一致则重新哈希并更新
        const passwordMatch = await bcrypt
          .compare(adminPassword, user.passwordHash)
          .catch(() => false);
        if (!passwordMatch) {
          newPasswordHash = await bcrypt.hash(adminPassword, 10);
          needUpdate = true;
        }

        // 邮箱不同则更新
        if (user.email !== adminEmail) {
          needUpdate = true;
        }

        if (needUpdate) {
          await this.dataSource.query(
            `UPDATE users SET email = ?, passwordHash = ?, role = 'admin', updatedAt = NOW() WHERE userId = ?`,
            [adminEmail, newPasswordHash, user.userId],
          );
          this.logger.log(`默认管理员账号已同步到 .env 配置: ${adminUsername}`);
        } else {
          this.logger.log(`默认管理员账号已与 .env 配置一致: ${adminUsername}`);
        }
        return;
      }

      // 若不存在 .env 指定的用户名，检查是否已有任意管理员账号
      const existingAdmin = await this.dataSource.query(
        'SELECT userId FROM users WHERE role = ? LIMIT 1',
        ['admin'],
      );

      if (existingAdmin.length > 0) {
        // 出于安全与谨慎，不强制覆盖其他管理员；提示日志供人工处理
        this.logger.warn(
          '检测到已存在管理员账号，但与 .env 指定的用户名不同。为避免风险，已跳过自动覆盖，请人工确认是否需要迁移到 .env 配置。',
        );
        return;
      }

      // 如果没有任何管理员，按 .env 创建默认管理员
      await this.createDefaultAdminUser();
    } catch (error) {
      this.logger.error('验证/同步默认管理员账号失败:', error);
      // 不抛出错误，避免影响其他初始化流程
    }
  }

  /**
   * 创建默认管理员用户
   */
  private async createDefaultAdminUser(): Promise<void> {
    try {
      // 从 .env 读取管理员配置，不再使用任何硬编码默认值（安全要求）
      const adminUsername = this.configService.get<string>(
        'DEFAULT_ADMIN_USERNAME',
      );
      const adminPassword = this.configService.get<string>(
        'DEFAULT_ADMIN_PASSWORD',
      );
      const adminEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');
      const nodeEnv =
        this.configService.get<string>('NODE_ENV') ||
        process.env.NODE_ENV ||
        'development';

      // 先检查是否提供了管理员用户名；若缺失则无法进行存在性检查
      if (!adminUsername) {
        this.logger.warn(
          '默认管理员创建被跳过：必须在 .env 中至少设置 DEFAULT_ADMIN_USERNAME；其余配置信息缺失时将无法创建。',
        );
        return;
      }

      // 检查管理员用户是否已存在（按用户名避免被其他管理员阻断创建）
      const existingUserByName = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM users WHERE username = ?',
        [adminUsername],
      );

      if (existingUserByName[0].count > 0) {
        // 与测试断言保持一致：提示已存在并跳过创建
        this.logger.log('默认管理员账号已存在，跳过创建');
        return;
      }

      // 若密码或邮箱缺失，则记录警告并跳过创建，避免使用不安全的默认值
      if (!adminPassword || !adminEmail) {
        this.logger.warn(
          '默认管理员创建被跳过：必须在 .env 中设置 DEFAULT_ADMIN_PASSWORD / DEFAULT_ADMIN_EMAIL。',
        );
        return;
      }

      // 生产环境下进行弱密码阻断：长度与复杂度要求（防止弱口令被使用）
      if (nodeEnv === 'production' && this.isWeakPassword(adminPassword)) {
        this.logger.error(
          '生产环境检测到弱密码：请在 .env 中为 DEFAULT_ADMIN_PASSWORD 设置更复杂的强密码。已阻断默认管理员创建。',
        );
        return;
      }

      this.logger.log('创建默认管理员账号...');

      // 生成密码哈希
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

      // 生成用户ID
      const userId = uuidv4();

      // 插入管理员用户（不在日志输出敏感信息）
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

  // 弱密码检测：长度>=12，且包含大小写字母、数字与特殊字符
  private isWeakPassword(password: string): boolean {
    if (!password) return true;
    const lengthOk = password.length >= 12;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^\w]/.test(password);
    return !(lengthOk && hasUpper && hasLower && hasDigit && hasSpecial);
  }
}
