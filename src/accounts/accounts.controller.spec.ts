import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountListDto } from './dto/account-list.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

describe('AccountsController', () => {
  let controller: AccountsController;
  let accountsService: AccountsService;

  const mockAccountsService = {
    create: jest.fn(),
    findAccountsWithPaginationByUser: jest.fn(),
    findAllAccountsWithPagination: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllByUser: jest.fn(),
    getActiveAccountCount: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAdminGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockUser = {
    userId: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockAccount = {
    accountId: 'account-1',
    name: '测试账号1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<AccountsController>(AccountsController);
    accountsService = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建账号', async () => {
      const createAccountDto: CreateAccountDto = {
        accountName: '新测试账号',
        isActive: true,
      };

      const mockRequest = {
        user: mockUser,
      };

      mockAccountsService.create.mockResolvedValue(mockAccount);

      const result = await controller.create(
        mockRequest as AuthenticatedRequest,
        createAccountDto,
      );

      expect(result).toEqual({
        code: 201,
        message: '账号创建成功',
        data: {
          ...mockAccount,
          id: mockAccount.accountId,
        },
      });
      expect(mockAccountsService.create).toHaveBeenCalledWith(
        mockUser.userId,
        createAccountDto,
      );
    });
  });

  describe('findAll', () => {
    it('应该返回用户的分页账号列表', async () => {
      const accountListDto: AccountListDto = {
        page: 1,
        limit: 10,
      };

      const mockRequest = {
        user: mockUser,
      };

      const mockPaginatedResponse = new PaginatedResponse(
        [
          {
            accountId: 'account-1',
            name: '测试账号1',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              userId: 'user-1',
              username: 'testuser',
              email: 'test@example.com',
              phone: '13800138001',
              role: 'user',
            },
          },
        ],
        1,
        1,
        10,
      );

      mockAccountsService.findAccountsWithPaginationByUser.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await controller.findAll(
        mockRequest as AuthenticatedRequest,
        accountListDto,
      );

      expect(result).toEqual({
        code: 200,
        message: '获取成功',
        data: mockPaginatedResponse.items,
        pagination: {
          total: mockPaginatedResponse.total,
          page: mockPaginatedResponse.page,
          limit: mockPaginatedResponse.size,
          totalPages: Math.ceil(
            mockPaginatedResponse.total / mockPaginatedResponse.size,
          ),
        },
      });
      expect(
        accountsService.findAccountsWithPaginationByUser,
      ).toHaveBeenCalledWith(mockUser.userId, accountListDto);
    });
  });

  describe('findAllForAdmin', () => {
    it('应该返回所有账号的分页列表（管理员专用）', async () => {
      const accountListDto: AccountListDto = {
        page: 1,
        limit: 10,
      };

      const mockPaginatedResponse = new PaginatedResponse(
        [
          {
            accountId: 'account-1',
            name: '测试账号1',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              userId: 'user-1',
              username: 'testuser',
              email: 'test@example.com',
              phone: '13800138001',
              role: 'user',
            },
          },
          {
            accountId: 'account-2',
            name: '测试账号2',
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              userId: 'user-2',
              username: 'testuser2',
              email: 'test2@example.com',
              phone: '13800138002',
              role: 'admin',
            },
          },
        ],
        2,
        1,
        10,
      );

      mockAccountsService.findAllAccountsWithPagination.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await controller.findAllForAdmin(accountListDto);

      expect(result).toEqual({
        code: 200,
        message: '获取成功',
        data: mockPaginatedResponse.items,
        pagination: {
          total: mockPaginatedResponse.total,
          page: mockPaginatedResponse.page,
          limit: mockPaginatedResponse.size,
          totalPages: Math.ceil(
            mockPaginatedResponse.total / mockPaginatedResponse.size,
          ),
        },
      });
      expect(
        accountsService.findAllAccountsWithPagination,
      ).toHaveBeenCalledWith(accountListDto);
    });

    it('应该支持搜索和筛选参数', async () => {
      const accountListDto: AccountListDto = {
        page: 2,
        limit: 5,
        search: 'test',
        isActive: true,
      };

      const mockPaginatedResponse = new PaginatedResponse([], 0, 2, 5);

      mockAccountsService.findAllAccountsWithPagination.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await controller.findAllForAdmin(accountListDto);

      expect(result).toEqual({
        code: 200,
        message: '获取成功',
        data: mockPaginatedResponse.items,
        pagination: {
          total: mockPaginatedResponse.total,
          page: mockPaginatedResponse.page,
          limit: mockPaginatedResponse.size,
          totalPages: Math.ceil(
            mockPaginatedResponse.total / mockPaginatedResponse.size,
          ),
        },
      });
      expect(
        accountsService.findAllAccountsWithPagination,
      ).toHaveBeenCalledWith(accountListDto);
    });
  });

  describe('findOne', () => {
    it('应该返回指定的账号', async () => {
      const mockRequest = {
        user: mockUser,
      };

      mockAccountsService.findOne.mockResolvedValue(mockAccount);

      const result = await controller.findOne('account-1', mockRequest as any);

      expect(result).toEqual({
        code: 200,
        message: '获取成功',
        data: mockAccount,
      });
      expect(accountsService.findOne).toHaveBeenCalledWith(
        'account-1',
        mockUser.userId,
      );
    });
  });

  describe('getStats', () => {
    it('应该返回账号统计信息', async () => {
      const mockRequest = {
        user: mockUser,
      };

      const mockAllAccounts = [
        mockAccount,
        { ...mockAccount, accountId: 'account-2' },
      ];
      const mockActiveCount = 1;

      mockAccountsService.findAllByUser.mockResolvedValue(mockAllAccounts);
      mockAccountsService.getActiveAccountCount.mockResolvedValue(
        mockActiveCount,
      );

      const result = await controller.getStats(
        mockRequest as AuthenticatedRequest,
      );

      expect(result).toEqual({
        code: 200,
        message: '获取成功',
        data: {
          totalCount: mockAllAccounts.length,
          activeCount: mockActiveCount,
          inactiveCount: mockAllAccounts.length - mockActiveCount,
        },
      });
      expect(accountsService.findAllByUser).toHaveBeenCalledWith(
        mockUser.userId,
      );
      expect(accountsService.getActiveAccountCount).toHaveBeenCalledWith(
        mockUser.userId,
      );
    });
  });

  describe('update', () => {
    it('应该成功更新账号', async () => {
      const updateAccountDto: UpdateAccountDto = {
        accountName: '更新后的账号名',
        isActive: false,
      };

      const mockRequest = {
        user: mockUser,
      };

      const updatedAccount = {
        ...mockAccount,
        name: updateAccountDto.accountName,
        isActive: updateAccountDto.isActive,
      };

      mockAccountsService.update.mockResolvedValue(updatedAccount);

      const result = await controller.update(
        'account-1',
        updateAccountDto,
        mockRequest as any,
      );

      expect(result).toEqual({
        code: 200,
        message: '更新成功',
        data: updatedAccount,
      });
      expect(accountsService.update).toHaveBeenCalledWith(
        'account-1',
        mockUser.userId,
        updateAccountDto,
      );
    });
  });

  describe('remove', () => {
    it('应该成功删除账号', async () => {
      const mockRequest = {
        user: mockUser,
      };

      mockAccountsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('account-1', mockRequest as any);

      expect(result).toEqual({
        code: 200,
        message: '删除成功',
      });
      expect(accountsService.remove).toHaveBeenCalledWith(
        'account-1',
        mockUser.userId,
      );
    });
  });
});
