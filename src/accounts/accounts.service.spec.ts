/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { Account } from '../entities/account.entity';
import { User } from '../entities/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

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
});
