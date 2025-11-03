import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { Account } from '../entities/account.entity';
import { User } from '../entities/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AccountListDto } from './dto/account-list.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

// Mock UUID module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

describe('AccountsService', () => {
  let service: AccountsService;

  const mockAccountRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockAccount = {
    accountId: 'account-1',
    userId: 'user-1',
    name: '测试账号1',
    isActive: true,
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('应该返回用户的所有账号', async () => {
      const accounts = [mockAccount];
      mockAccountRepository.find.mockResolvedValue(accounts);

      const result = await service.findAllByUser('user-1');

      expect(result).toEqual(accounts);
      expect(mockAccountRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('应该返回指定的账号', async () => {
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findOne('account-1', 'user-1');

      expect(result).toEqual(mockAccount);
      expect(mockAccountRepository.findOne).toHaveBeenCalledWith({
        where: { accountId: 'account-1' },
        relations: ['user'],
      });
    });

    it('当账号不存在时应该抛出 NotFoundException', async () => {
      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('应该成功创建新账号', async () => {
      const createAccountDto = {
        name: '新测试账号',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAccountRepository.create.mockReturnValue({
        accountId: 'mock-uuid-v4',
        userId: 'user-1',
        name: createAccountDto.name,
        isActive: createAccountDto.isActive,
      });
      mockAccountRepository.save.mockResolvedValue({
        accountId: 'mock-uuid-v4',
        userId: 'user-1',
        name: createAccountDto.name,
        isActive: createAccountDto.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create('user-1', createAccountDto);

      expect(result.name).toBe(createAccountDto.name);
      expect(result.isActive).toBe(true);
    });

    it('当用户不存在时应该抛出 NotFoundException', async () => {
      const createAccountDto = {
        name: '新测试账号',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('nonexistent', createAccountDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('应该成功更新账号', async () => {
      const updateAccountDto = {
        name: '更新后的账号名',
        isActive: false,
      };

      const updatedAccount = {
        ...mockAccount,
        ...updateAccountDto,
      };

      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockAccountRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.update(
        'account-1',
        'user-1',
        updateAccountDto,
      );

      expect(result.name).toBe(updateAccountDto.name);
      expect(result.isActive).toBe(updateAccountDto.isActive);
    });

    it('当账号不存在时应该抛出 NotFoundException', async () => {
      const updateAccountDto = {
        name: '更新后的账号名',
      };

      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'user-1', updateAccountDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('当用户无权限时应该抛出 ForbiddenException', async () => {
      const updateAccountDto = {
        name: '更新后的账号名',
      };

      const otherUserAccount = {
        ...mockAccount,
        userId: 'other-user',
      };

      mockAccountRepository.findOne.mockResolvedValue(otherUserAccount);

      await expect(
        service.update('account-1', 'user-1', updateAccountDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('应该成功删除账号', async () => {
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockAccountRepository.remove.mockResolvedValue(mockAccount);

      await service.remove('account-1', 'user-1');

      expect(mockAccountRepository.remove).toHaveBeenCalledWith(mockAccount);
    });

    it('当账号不存在时应该抛出 NotFoundException', async () => {
      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('当用户无权限时应该抛出 ForbiddenException', async () => {
      const otherUserAccount = {
        ...mockAccount,
        userId: 'other-user',
      };

      mockAccountRepository.findOne.mockResolvedValue(otherUserAccount);

      await expect(service.remove('account-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAccountsWithPaginationByUser', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      mockAccountRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
    });

    it('应该返回用户的分页账号列表', async () => {
      const accountListDto: AccountListDto = {
        page: 1,
        limit: 10,
      };

      const mockAccounts = [
        {
          accountId: 'account-1',
          name: '测试账号1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: mockUser,
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockAccounts, 1]);

      const result = await service.findAccountsWithPaginationByUser(
        'user-1',
        accountListDto,
      );

      expect(result).toBeInstanceOf(PaginatedResponse);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'account.userId = :userId',
        { userId: 'user-1' },
      );
    });

    it('应该支持搜索功能', async () => {
      const accountListDto: AccountListDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAccountsWithPaginationByUser('user-1', accountListDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'account.name LIKE :search',
        { search: '%test%' },
      );
    });

    it('应该支持状态筛选', async () => {
      const accountListDto: AccountListDto = {
        page: 1,
        limit: 10,
        isActive: true,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAccountsWithPaginationByUser('user-1', accountListDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'account.isActive = :isActive',
        { isActive: true },
      );
    });
  });

  describe('findAllAccountsWithPagination', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      mockAccountRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
    });

    it('应该返回所有账号的分页列表（管理员专用）', async () => {
      const accountListDto: AccountListDto = {
        page: 1,
        limit: 10,
      };

      const mockAccounts = [
        {
          accountId: 'account-1',
          name: '测试账号1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: mockUser,
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
            role: 'user',
          },
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockAccounts, 2]);

      const result =
        await service.findAllAccountsWithPagination(accountListDto);

      expect(result).toBeInstanceOf(PaginatedResponse);
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'account.createdAt',
        'DESC',
      );
    });

    it('应该支持搜索功能（账号名、用户名、邮箱）', async () => {
      const accountListDto: AccountListDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllAccountsWithPagination(accountListDto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(account.name LIKE :search OR user.username LIKE :search OR user.email LIKE :search)',
        { search: '%test%' },
      );
    });

    it('应该支持状态筛选', async () => {
      const accountListDto: AccountListDto = {
        page: 1,
        limit: 10,
        isActive: false,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllAccountsWithPagination(accountListDto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'account.isActive = :isActive',
        { isActive: false },
      );
    });

    it('应该支持搜索和状态筛选组合', async () => {
      const accountListDto: AccountListDto = {
        page: 1,
        limit: 10,
        search: 'test',
        isActive: true,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllAccountsWithPagination(accountListDto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(account.name LIKE :search OR user.username LIKE :search OR user.email LIKE :search)',
        { search: '%test%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'account.isActive = :isActive',
        { isActive: true },
      );
    });
  });
});
