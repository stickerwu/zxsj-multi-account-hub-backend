/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { Account } from '../entities/account.entity';
import { User } from '../entities/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

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
    id: 'account-1',
    accountName: '测试账号1',
    serverName: '测试服务器',
    characterName: '测试角色',
    isEnabled: true,
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

  describe('findAll', () => {
    it('应该返回用户的所有账号', async () => {
      const accounts = [mockAccount];
      mockAccountRepository.find.mockResolvedValue(accounts);

      const result = await service.findAll('user-1');

      expect(result).toEqual(accounts);
      expect(mockAccountRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' } },
        relations: ['user'],
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
        where: { id: 'account-1', user: { id: 'user-1' } },
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
        accountName: '新测试账号',
        serverName: '新测试服务器',
        characterName: '新测试角色',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAccountRepository.create.mockReturnValue({
        ...createAccountDto,
        user: mockUser,
        isEnabled: true,
      });
      mockAccountRepository.save.mockResolvedValue({
        id: 'new-account-1',
        ...createAccountDto,
        user: mockUser,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createAccountDto, 'user-1');

      expect(result.accountName).toBe(createAccountDto.accountName);
      expect(result.serverName).toBe(createAccountDto.serverName);
      expect(result.characterName).toBe(createAccountDto.characterName);
      expect(result.isEnabled).toBe(true);
    });

    it('当用户不存在时应该抛出 NotFoundException', async () => {
      const createAccountDto = {
        accountName: '新测试账号',
        serverName: '新测试服务器',
        characterName: '新测试角色',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(createAccountDto, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('应该成功更新账号', async () => {
      const updateAccountDto = {
        accountName: '更新后的账号名',
        isEnabled: false,
      };

      const updatedAccount = {
        ...mockAccount,
        ...updateAccountDto,
      };

      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockAccountRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.update(
        'account-1',
        updateAccountDto,
        'user-1',
      );

      expect(result.accountName).toBe(updateAccountDto.accountName);
      expect(result.isEnabled).toBe(updateAccountDto.isEnabled);
    });

    it('当账号不存在时应该抛出 NotFoundException', async () => {
      const updateAccountDto = {
        accountName: '更新后的账号名',
      };

      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateAccountDto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('当用户无权限时应该抛出 ForbiddenException', async () => {
      const updateAccountDto = {
        accountName: '更新后的账号名',
      };

      const otherUserAccount = {
        ...mockAccount,
        user: { id: 'other-user', username: 'otheruser' },
      };

      mockAccountRepository.findOne.mockResolvedValue(otherUserAccount);

      await expect(
        service.update('account-1', updateAccountDto, 'user-1'),
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
        user: { id: 'other-user', username: 'otheruser' },
      };

      mockAccountRepository.findOne.mockResolvedValue(otherUserAccount);

      await expect(service.remove('account-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
