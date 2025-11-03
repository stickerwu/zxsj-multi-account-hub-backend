import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserListDto } from './dto/user-list.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { ExecutionContext } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    findUsersWithPagination: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAdminGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockLocalAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .overrideGuard(LocalAuthGuard)
      .useValue(mockLocalAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('应该成功注册用户', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        user: {
          userId: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
        },
        token: 'jwt-token',
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        code: 201,
        message: '注册成功',
        data: {
          ...expectedResult,
          access_token: expectedResult.token,
          id: expectedResult.user.userId,
        },
      });
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('应该成功登录用户', async () => {
      const mockUser = {
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      };

      const expectedResult = {
        user: {
          userId: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
        },
        token: 'jwt-token',
      };

      const mockRequest = {
        user: mockUser,
      };

      mockAuthService.login.mockReturnValue(expectedResult);

      const result = controller.login(mockRequest as any);

      expect(result).toEqual({
        code: 200,
        message: '登录成功',
        data: {
          ...expectedResult,
          access_token: expectedResult.token,
          id: expectedResult.user.userId,
        },
      });
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('logout', () => {
    it('应该成功登出', () => {
      const result = controller.logout();

      expect(result).toEqual({
        code: 200,
        message: '登出成功',
      });
    });
  });

  describe('findAllUsers', () => {
    it('应该返回分页的用户列表', async () => {
      const userListDto: UserListDto = {
        page: 1,
        limit: 10,
      };

      const mockPaginatedResponse = new PaginatedResponse(
        [
          {
            userId: 'user-1',
            username: 'user1',
            email: 'user1@example.com',
            phone: '13800138001',
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        1,
        1,
        10,
      );

      mockAuthService.findUsersWithPagination.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await controller.findAllUsers(userListDto);

      expect(result).toEqual({
        code: 200,
        message: '获取成功',
        data: mockPaginatedResponse.items,
        pagination: {
          total: mockPaginatedResponse.total,
          page: mockPaginatedResponse.page,
          size: mockPaginatedResponse.size,
          totalPages: Math.ceil(
            mockPaginatedResponse.total / mockPaginatedResponse.size,
          ),
        },
      });
      expect(authService.findUsersWithPagination).toHaveBeenCalledWith(
        userListDto,
      );
    });

    it('应该支持搜索和筛选参数', async () => {
      const userListDto: UserListDto = {
        page: 2,
        limit: 5,
        search: 'test',
        role: 'admin',
      };

      const mockPaginatedResponse = new PaginatedResponse([], 0, 2, 5);

      mockAuthService.findUsersWithPagination.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await controller.findAllUsers(userListDto);

      expect(result).toEqual({
        code: 200,
        message: '获取成功',
        data: mockPaginatedResponse.items,
        pagination: {
          total: mockPaginatedResponse.total,
          page: mockPaginatedResponse.page,
          size: mockPaginatedResponse.size,
          totalPages: Math.ceil(
            mockPaginatedResponse.total / mockPaginatedResponse.size,
          ),
        },
      });
      expect(authService.findUsersWithPagination).toHaveBeenCalledWith(
        userListDto,
      );
    });
  });
});
