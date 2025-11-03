import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { ConflictException } from '@nestjs/common';
import { UserListDto } from './dto/user-list.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let bcryptHashSpy: jest.SpyInstance;
  let bcryptCompareSpy: jest.SpyInstance;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // 获取 bcrypt mock 函数的引用
    bcryptHashSpy = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
    bcryptCompareSpy = bcrypt.compare as jest.MockedFunction<
      typeof bcrypt.compare
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        userId: 'mock-uuid-v4',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      });
      mockUserRepository.save.mockResolvedValue({
        userId: 'mock-uuid-v4',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Mock bcrypt.hash
      bcryptHashSpy.mockResolvedValue('hashedPassword' as never);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        token: 'jwt-token',
        user: {
          userId: 'mock-uuid-v4',
          username: 'testuser',
          email: 'test@example.com',
        },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [{ username: 'testuser' }, { email: 'test@example.com' }],
      });
    });

    it('当用户名已存在时应该抛出 ConflictException', async () => {
      const registerDto = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        username: 'existinguser',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('应该成功登录用户', () => {
      const user = {
        userId: '1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      };

      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = service.login(user);

      expect(result).toEqual({
        user: {
          userId: '1',
          username: 'testuser',
          email: 'test@example.com',
        },
        token: 'jwt-token',
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        username: 'testuser',
      });
    });
  });

  describe('validateUser', () => {
    it('应该返回用户信息（不包含密码）', async () => {
      const user = {
        userId: '1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      bcryptCompareSpy.mockResolvedValue(true as never);

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toEqual({
        userId: '1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      });
    });

    it('当用户不存在时应该返回 null', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');

      expect(result).toBeNull();
    });

    it('当密码错误时应该返回 null', async () => {
      const user = {
        userId: '1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      bcryptCompareSpy.mockResolvedValue(false as never);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('应该根据用户ID返回用户信息', async () => {
      const userId = 'user-1';
      const user = {
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findUserById(userId);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('当用户不存在时应该返回 null', async () => {
      const userId = 'nonexistent-user';

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('findUsersWithPagination', () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('应该返回分页的用户列表', async () => {
      const userListDto: UserListDto = {
        page: 1,
        limit: 10,
      };

      const mockUsers = [
        {
          userId: 'user-1',
          username: 'user1',
          email: 'user1@example.com',
          phone: '13800138001',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 'user-2',
          username: 'user2',
          email: 'user2@example.com',
          phone: '13800138002',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);

      const result = await service.findUsersWithPagination(userListDto);

      expect(result).toBeInstanceOf(PaginatedResponse);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('应该支持搜索功能', async () => {
      const userListDto: UserListDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findUsersWithPagination(userListDto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(user.username LIKE :search OR user.email LIKE :search)',
        { search: '%test%' },
      );
    });

    it('应该支持角色筛选', async () => {
      const userListDto: UserListDto = {
        page: 1,
        limit: 10,
        role: 'admin',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findUsersWithPagination(userListDto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.role = :role', {
        role: 'admin',
      });
    });

    it('应该支持搜索和角色筛选组合', async () => {
      const userListDto: UserListDto = {
        page: 1,
        limit: 10,
        search: 'test',
        role: 'admin',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findUsersWithPagination(userListDto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(user.username LIKE :search OR user.email LIKE :search)',
        { search: '%test%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.role = :role',
        {
          role: 'admin',
        },
      );
    });
  });
});
