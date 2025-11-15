import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DatabaseInitService } from './database-init.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

describe('DatabaseInitService', () => {
  let service: DatabaseInitService;
  let configService: ConfigService;
  let dataSource: DataSource;
  let logger: Logger;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockDataSource = {
    query: jest.fn(),
    isInitialized: true,
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseInitService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DatabaseInitService>(DatabaseInitService);
    configService = module.get<ConfigService>(ConfigService);
    dataSource = module.get<DataSource>(DataSource);

    // 手动替换 logger
    (service as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDatabase', () => {
    it('应该成功初始化数据库', async () => {
      // Mock 数据库查询结果 - 所有表都存在
      mockDataSource.query
        .mockResolvedValueOnce([{ count: 1 }]) // users 表存在
        .mockResolvedValueOnce([{ count: 1 }]) // accounts 表存在
        .mockResolvedValueOnce([{ count: 1 }]) // dungeon_templates 表存在
        .mockResolvedValueOnce([{ count: 1 }]) // weekly_task_templates 表存在
        .mockResolvedValueOnce([{ count: 1 }]) // weekly_progress 表存在
        .mockResolvedValueOnce([{ count: 1 }]) // shared_accounts 表存在
        .mockResolvedValueOnce([{ count: 1 }]); // user_account_relations 表存在

      await service.initializeDatabase();

      expect(mockLogger.log).toHaveBeenCalledWith('开始检查数据库表结构...');
      expect(mockLogger.log).toHaveBeenCalledWith('所有必要的表都已存在');
    });

    it('当缺失表时应该创建表和插入数据', async () => {
      // Mock 数据库查询结果 - 所有表都不存在
      mockDataSource.query
        .mockResolvedValueOnce([{ count: 0 }]) // users 表不存在
        .mockResolvedValueOnce([{ count: 0 }]) // accounts 表不存在
        .mockResolvedValueOnce([{ count: 0 }]) // dungeon_templates 表不存在
        .mockResolvedValueOnce([{ count: 0 }]) // weekly_task_templates 表不存在
        .mockResolvedValueOnce([{ count: 0 }]) // weekly_progress 表不存在
        .mockResolvedValueOnce([{ count: 0 }]) // shared_accounts 表不存在
        .mockResolvedValueOnce([{ count: 0 }]) // user_account_relations 表不存在
        .mockResolvedValue(undefined); // 其他所有查询都成功

      // 模拟 fs 操作
      const fs = jest.requireActual('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValue('CREATE TABLE test (id INT);');

      await service.initializeDatabase();

      expect(mockLogger.log).toHaveBeenCalledWith('开始检查数据库表结构...');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '发现缺失的表: users, accounts, dungeon_templates, weekly_task_templates, weekly_progress, shared_accounts, user_account_relations',
      );
      expect(mockLogger.log).toHaveBeenCalledWith('数据库初始化完成');
    });
  });

  describe('createDefaultAdminUser', () => {
    it('应该创建默认管理员用户', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: 0 }]) // 管理员不存在
        .mockResolvedValueOnce(undefined); // 创建管理员

      mockConfigService.get
        .mockReturnValueOnce('admin') // DEFAULT_ADMIN_USERNAME
        .mockReturnValueOnce('password123') // DEFAULT_ADMIN_PASSWORD
        .mockReturnValueOnce('admin@test.com'); // DEFAULT_ADMIN_EMAIL

      (
        bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>
      ).mockResolvedValue('hashed-password' as never);

      // 使用反射访问私有方法进行测试
      const createDefaultAdminUser = (
        service as any
      ).createDefaultAdminUser.bind(service);
      await createDefaultAdminUser();

      expect(mockLogger.log).toHaveBeenCalledWith('创建默认管理员账号...');
      expect(mockLogger.log).toHaveBeenCalledWith(
        '默认管理员账号创建成功: admin',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('当管理员已存在时应该跳过创建', async () => {
      mockDataSource.query.mockResolvedValueOnce([{ count: 1 }]); // 管理员已存在

      mockConfigService.get.mockReturnValueOnce('admin'); // DEFAULT_ADMIN_USERNAME

      const createDefaultAdminUser = (
        service as any
      ).createDefaultAdminUser.bind(service);
      await createDefaultAdminUser();

      expect(mockLogger.log).toHaveBeenCalledWith(
        '默认管理员账号已存在，跳过创建',
      );
    });

    it('应该处理创建管理员用户时的错误', async () => {
      const error = new Error('Failed to create admin user');
      mockDataSource.query
        .mockResolvedValueOnce([{ count: 0 }]) // 管理员不存在
        .mockRejectedValueOnce(error); // 创建时出错

      mockConfigService.get
        .mockReturnValueOnce('admin') // DEFAULT_ADMIN_USERNAME
        .mockReturnValueOnce('password123') // DEFAULT_ADMIN_PASSWORD
        .mockReturnValueOnce('admin@test.com'); // DEFAULT_ADMIN_EMAIL

      (
        bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>
      ).mockResolvedValue('hashed-password' as never);

      const createDefaultAdminUser = (
        service as any
      ).createDefaultAdminUser.bind(service);
      await createDefaultAdminUser();

      expect(mockLogger.error).toHaveBeenCalledWith(
        '创建默认管理员账号失败:',
        error,
      );
    });
  });

  describe('createMissingTables', () => {
    it('应该创建缺失的表', async () => {
      // 模拟读取 SQL 文件
      const fs = jest.requireActual('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync')
        .mockReturnValue(`CREATE TABLE users (id INT PRIMARY KEY);
CREATE TABLE accounts (id INT PRIMARY KEY);
-- 这是注释
INSERT INTO users VALUES (1);`);

      mockDataSource.query.mockResolvedValue(undefined);

      const createMissingTables = (service as any).createMissingTables.bind(
        service,
      );
      await createMissingTables();

      expect(mockLogger.log).toHaveBeenCalledWith('开始创建缺失的数据库表...');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'CREATE TABLE users (id INT PRIMARY KEY)',
      );
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'CREATE TABLE accounts (id INT PRIMARY KEY)',
      );
      // 只检查调用次数，因为 INSERT 语句可能被过滤掉了
      expect(mockDataSource.query).toHaveBeenCalledTimes(2);
    });

    it('当SQL文件不存在时应该抛出错误', async () => {
      const fs = jest.requireActual('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const createMissingTables = (service as any).createMissingTables.bind(
        service,
      );

      await expect(createMissingTables()).rejects.toThrow(
        'SQL初始化文件不存在',
      );
    });
  });
});
