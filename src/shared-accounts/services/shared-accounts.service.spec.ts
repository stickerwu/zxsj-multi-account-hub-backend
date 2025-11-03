import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SharedAccountsService } from './shared-accounts.service';
import { SharedAccountPermissionService } from './shared-account-permission.service';
import { SharedAccount } from '../../entities/shared-account.entity';
import { UserAccountRelation } from '../../entities/user-account-relation.entity';
import { RelationType, DEFAULT_PERMISSIONS } from '../types/permission.types';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../common/dto/pagination.dto';

describe('SharedAccountsService', () => {
  let service: SharedAccountsService;
  let sharedAccountRepository: jest.Mocked<Repository<SharedAccount>>;
  let userAccountRelationRepository: jest.Mocked<
    Repository<UserAccountRelation>
  >;
  let permissionService: jest.Mocked<SharedAccountPermissionService>;
  let dataSource: jest.Mocked<DataSource>;

  // Mock数据
  const mockSharedAccount: SharedAccount = {
    accountName: 'test-account',
    displayName: '测试账号',
    serverName: '测试服务器',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    userRelations: [],
  };

  const mockUserRelation: UserAccountRelation = {
    id: 'relation-id',
    userId: 'user-id',
    accountName: 'test-account',
    relationType: RelationType.OWNER,
    permissions: DEFAULT_PERMISSIONS[RelationType.OWNER],
    joinedAt: new Date(),
    user: null,
    sharedAccount: null,
  };

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const mockSharedAccountRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockUserAccountRelationRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockPermissionService = {
      canRead: jest.fn(),
      canWrite: jest.fn(),
      canDelete: jest.fn(),
      isOwner: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharedAccountsService,
        {
          provide: getRepositoryToken(SharedAccount),
          useValue: mockSharedAccountRepository,
        },
        {
          provide: getRepositoryToken(UserAccountRelation),
          useValue: mockUserAccountRelationRepository,
        },
        {
          provide: SharedAccountPermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SharedAccountsService>(SharedAccountsService);
    sharedAccountRepository = module.get(getRepositoryToken(SharedAccount));
    userAccountRelationRepository = module.get(
      getRepositoryToken(UserAccountRelation),
    );
    permissionService = module.get(SharedAccountPermissionService);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSharedAccount', () => {
    const createDto = {
      accountName: 'test-account',
      displayName: '测试账号',
      serverName: '测试服务器',
    };
    const creatorUserId = 'creator-id';

    it('should create a shared account successfully', async () => {
      // 模拟账号不存在
      sharedAccountRepository.findOne.mockResolvedValue(null);

      // 模拟事务
      const mockManager = {
        create: jest.fn(),
        save: jest.fn(),
      };
      mockManager.create.mockReturnValueOnce(mockSharedAccount);
      mockManager.save.mockResolvedValueOnce(mockSharedAccount);
      mockManager.create.mockReturnValueOnce(mockUserRelation);
      mockManager.save.mockResolvedValueOnce(mockUserRelation);

      dataSource.transaction.mockImplementation((callback) => {
        return callback(mockManager);
      });

      const result = await service.createSharedAccount(
        createDto,
        creatorUserId,
      );

      expect(result).toEqual(mockSharedAccount);
      expect(sharedAccountRepository.findOne).toHaveBeenCalledWith({
        where: { accountName: createDto.accountName },
      });
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if account already exists', async () => {
      sharedAccountRepository.findOne.mockResolvedValue(mockSharedAccount);

      await expect(
        service.createSharedAccount(createDto, creatorUserId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserAccessibleAccounts', () => {
    const userId = 'user-id';
    const paginationDto: PaginationDto = { page: 1, size: 10 };

    it('should return paginated accessible accounts', async () => {
      const mockAccounts = [
        { ...mockSharedAccount, userRelations: [mockUserRelation] },
      ];

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue(mockAccounts);

      const result = await service.getUserAccessibleAccounts(
        userId,
        paginationDto,
      );

      expect(result).toBeInstanceOf(PaginatedResponse);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].userCount).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should handle search parameter', async () => {
      const paginationWithSearch: PaginationDto = {
        page: 1,
        size: 10,
        search: 'test',
      };

      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getUserAccessibleAccounts(
        userId,
        paginationWithSearch,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(sa.accountName LIKE :search OR sa.displayName LIKE :search OR sa.serverName LIKE :search)',
        { search: '%test%' },
      );
      expect(result.items).toHaveLength(0);
    });
  });

  describe('getSharedAccountDetail', () => {
    const accountName = 'test-account';
    const userId = 'user-id';

    it('should return account detail when user has permission', async () => {
      permissionService.canRead.mockResolvedValue(true);
      sharedAccountRepository.findOne.mockResolvedValue({
        ...mockSharedAccount,
        userRelations: [mockUserRelation],
      });

      const result = await service.getSharedAccountDetail(accountName, userId);

      expect(result.userCount).toBe(1);
      expect(permissionService.canRead).toHaveBeenCalledWith(
        userId,
        accountName,
      );
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      permissionService.canRead.mockResolvedValue(false);

      await expect(
        service.getSharedAccountDetail(accountName, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      permissionService.canRead.mockResolvedValue(true);
      sharedAccountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getSharedAccountDetail(accountName, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSharedAccount', () => {
    const accountName = 'test-account';
    const updateDto = { displayName: '更新的显示名称' };
    const userId = 'user-id';

    it('should update account when user has permission', async () => {
      permissionService.canWrite.mockResolvedValue(true);
      sharedAccountRepository.findOne.mockResolvedValue(mockSharedAccount);
      sharedAccountRepository.save.mockResolvedValue({
        ...mockSharedAccount,
        ...updateDto,
      });

      const result = await service.updateSharedAccount(
        accountName,
        updateDto,
        userId,
      );

      expect(result.displayName).toBe(updateDto.displayName);
      expect(permissionService.canWrite).toHaveBeenCalledWith(
        userId,
        accountName,
      );
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      permissionService.canWrite.mockResolvedValue(false);

      await expect(
        service.updateSharedAccount(accountName, updateDto, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      permissionService.canWrite.mockResolvedValue(true);
      sharedAccountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSharedAccount(accountName, updateDto, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSharedAccount', () => {
    const accountName = 'test-account';
    const userId = 'user-id';

    it('should delete account when user has permission', async () => {
      permissionService.canDelete.mockResolvedValue(true);
      sharedAccountRepository.findOne.mockResolvedValue(mockSharedAccount);

      const mockManager = {
        delete: jest.fn(),
      };
      dataSource.transaction.mockImplementation((callback) => {
        return callback(mockManager);
      });

      await service.deleteSharedAccount(accountName, userId);

      expect(permissionService.canDelete).toHaveBeenCalledWith(
        userId,
        accountName,
      );
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      permissionService.canDelete.mockResolvedValue(false);

      await expect(
        service.deleteSharedAccount(accountName, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      permissionService.canDelete.mockResolvedValue(true);
      sharedAccountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteSharedAccount(accountName, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addUserToAccount', () => {
    const accountName = 'test-account';
    const addUserDto = {
      userId: 'new-user-id',
      relationType: RelationType.CONTRIBUTOR,
    };
    const operatorUserId = 'operator-id';

    it('should add user to account when operator is owner', async () => {
      permissionService.isOwner.mockResolvedValue(true);
      sharedAccountRepository.findOne.mockResolvedValue(mockSharedAccount);
      userAccountRelationRepository.findOne.mockResolvedValue(null);
      userAccountRelationRepository.create.mockReturnValue(mockUserRelation);
      userAccountRelationRepository.save.mockResolvedValue(mockUserRelation);

      const result = await service.addUserToAccount(
        accountName,
        addUserDto,
        operatorUserId,
      );

      expect(result).toEqual(mockUserRelation);
      expect(permissionService.isOwner).toHaveBeenCalledWith(
        operatorUserId,
        accountName,
      );
    });

    it('should throw ForbiddenException when operator is not owner', async () => {
      permissionService.isOwner.mockResolvedValue(false);

      await expect(
        service.addUserToAccount(accountName, addUserDto, operatorUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when user already exists', async () => {
      permissionService.isOwner.mockResolvedValue(true);
      sharedAccountRepository.findOne.mockResolvedValue(mockSharedAccount);
      userAccountRelationRepository.findOne.mockResolvedValue(mockUserRelation);

      await expect(
        service.addUserToAccount(accountName, addUserDto, operatorUserId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeUserFromAccount', () => {
    const accountName = 'test-account';
    const targetUserId = 'target-user-id';
    const operatorUserId = 'operator-id';

    it('should remove user when operator is owner', async () => {
      permissionService.isOwner.mockResolvedValue(true);
      userAccountRelationRepository.findOne.mockResolvedValue({
        ...mockUserRelation,
        relationType: RelationType.CONTRIBUTOR,
      });
      userAccountRelationRepository.remove.mockResolvedValue(undefined);

      await service.removeUserFromAccount(
        accountName,
        targetUserId,
        operatorUserId,
      );

      expect(userAccountRelationRepository.remove).toHaveBeenCalled();
    });

    it('should allow user to remove themselves', async () => {
      permissionService.isOwner.mockResolvedValue(false);
      userAccountRelationRepository.findOne.mockResolvedValue({
        ...mockUserRelation,
        relationType: RelationType.CONTRIBUTOR,
      });
      userAccountRelationRepository.remove.mockResolvedValue(undefined);

      await service.removeUserFromAccount(
        accountName,
        operatorUserId,
        operatorUserId,
      );

      expect(userAccountRelationRepository.remove).toHaveBeenCalled();
    });

    it('should throw ConflictException when removing last owner', async () => {
      permissionService.isOwner.mockResolvedValue(true);
      userAccountRelationRepository.findOne.mockResolvedValue({
        ...mockUserRelation,
        relationType: RelationType.OWNER,
      });
      userAccountRelationRepository.count.mockResolvedValue(1);

      await expect(
        service.removeUserFromAccount(
          accountName,
          targetUserId,
          operatorUserId,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateUserPermissions', () => {
    const accountName = 'test-account';
    const targetUserId = 'target-user-id';
    const newPermissions = { read: true, write: false };
    const operatorUserId = 'operator-id';

    it('should update permissions when operator is owner', async () => {
      permissionService.isOwner.mockResolvedValue(true);
      userAccountRelationRepository.findOne.mockResolvedValue(mockUserRelation);
      userAccountRelationRepository.save.mockResolvedValue({
        ...mockUserRelation,
        permissions: { ...mockUserRelation.permissions, ...newPermissions },
      });

      const result = await service.updateUserPermissions(
        accountName,
        targetUserId,
        newPermissions,
        operatorUserId,
      );

      expect(result.permissions).toEqual(
        expect.objectContaining(newPermissions),
      );
    });

    it('should throw ForbiddenException when operator is not owner', async () => {
      permissionService.isOwner.mockResolvedValue(false);

      await expect(
        service.updateUserPermissions(
          accountName,
          targetUserId,
          newPermissions,
          operatorUserId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAccountUsers', () => {
    const accountName = 'test-account';
    const userId = 'user-id';
    const paginationDto: PaginationDto = { page: 1, size: 10 };

    it('should return paginated user list when user has permission', async () => {
      permissionService.canRead.mockResolvedValue(true);
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockUserRelation]);

      const result = await service.getAccountUsers(
        accountName,
        userId,
        paginationDto,
      );

      expect(result).toBeInstanceOf(PaginatedResponse);
      expect(result.items).toHaveLength(1);
      expect(permissionService.canRead).toHaveBeenCalledWith(
        userId,
        accountName,
      );
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      permissionService.canRead.mockResolvedValue(false);

      await expect(
        service.getAccountUsers(accountName, userId, paginationDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle search parameter', async () => {
      const paginationWithSearch: PaginationDto = {
        page: 1,
        size: 10,
        search: 'test',
      };

      permissionService.canRead.mockResolvedValue(true);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getAccountUsers(
        accountName,
        userId,
        paginationWithSearch,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(uar.userId LIKE :search OR user.username LIKE :search)',
        { search: '%test%' },
      );
      expect(result.items).toHaveLength(0);
    });
  });
});
