import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharedAccountPermissionService } from './shared-account-permission.service';
import { UserAccountRelation } from '../../entities/user-account-relation.entity';
import {
  PermissionAction,
  RelationType,
  DEFAULT_PERMISSIONS,
  PermissionConfig,
} from '../types/permission.types';

describe('SharedAccountPermissionService', () => {
  let service: SharedAccountPermissionService;
  let userAccountRelationRepository: jest.Mocked<
    Repository<UserAccountRelation>
  >;

  // Mock数据
  const mockOwnerRelation: UserAccountRelation = {
    id: 'owner-relation-id',
    userId: 'owner-user-id',
    accountName: 'test-account',
    relationType: RelationType.OWNER,
    permissions: DEFAULT_PERMISSIONS[RelationType.OWNER],
    joinedAt: new Date(),
    user: null,
    sharedAccount: null,
  };

  const mockContributorRelation: UserAccountRelation = {
    id: 'contributor-relation-id',
    userId: 'contributor-user-id',
    accountName: 'test-account',
    relationType: RelationType.CONTRIBUTOR,
    permissions: DEFAULT_PERMISSIONS[RelationType.CONTRIBUTOR],
    joinedAt: new Date(),
    user: null,
    sharedAccount: null,
  };

  // 创建一个自定义权限的关系（只有读权限）
  const mockReadOnlyRelation: UserAccountRelation = {
    id: 'readonly-relation-id',
    userId: 'readonly-user-id',
    accountName: 'test-account',
    relationType: RelationType.CONTRIBUTOR,
    permissions: { read: true, write: false, delete: false },
    joinedAt: new Date(),
    user: null,
    sharedAccount: null,
  };

  beforeEach(async () => {
    const mockUserAccountRelationRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharedAccountPermissionService,
        {
          provide: getRepositoryToken(UserAccountRelation),
          useValue: mockUserAccountRelationRepository,
        },
      ],
    }).compile();

    service = module.get<SharedAccountPermissionService>(
      SharedAccountPermissionService,
    );
    userAccountRelationRepository = module.get(
      getRepositoryToken(UserAccountRelation),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkPermission', () => {
    const userId = 'test-user-id';
    const accountName = 'test-account';

    it('should return permission granted for owner with read permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockOwnerRelation,
      );

      const result = await service.checkPermission(
        userId,
        accountName,
        PermissionAction.READ,
      );

      expect(result.hasPermission).toBe(true);
      expect(result.relationType).toBe(RelationType.OWNER);
      expect(result.reason).toBeUndefined();
    });

    it('should return permission granted for owner with write permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockOwnerRelation,
      );

      const result = await service.checkPermission(
        userId,
        accountName,
        PermissionAction.WRITE,
      );

      expect(result.hasPermission).toBe(true);
      expect(result.relationType).toBe(RelationType.OWNER);
    });

    it('should return permission granted for owner with delete permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockOwnerRelation,
      );

      const result = await service.checkPermission(
        userId,
        accountName,
        PermissionAction.DELETE,
      );

      expect(result.hasPermission).toBe(true);
      expect(result.relationType).toBe(RelationType.OWNER);
    });

    it('should return permission granted for contributor with read permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockContributorRelation,
      );

      const result = await service.checkPermission(
        userId,
        accountName,
        PermissionAction.READ,
      );

      expect(result.hasPermission).toBe(true);
      expect(result.relationType).toBe(RelationType.CONTRIBUTOR);
    });

    it('should return permission granted for contributor with write permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockContributorRelation,
      );

      const result = await service.checkPermission(
        userId,
        accountName,
        PermissionAction.WRITE,
      );

      expect(result.hasPermission).toBe(true);
      expect(result.relationType).toBe(RelationType.CONTRIBUTOR);
    });

    it('should return permission denied for contributor with delete permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockContributorRelation,
      );

      const result = await service.checkPermission(
        userId,
        accountName,
        PermissionAction.DELETE,
      );

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toContain('没有 delete 权限');
    });

    it('should return permission granted for read-only user with read permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockReadOnlyRelation,
      );

      const result = await service.checkPermission(
        userId,
        accountName,
        PermissionAction.READ,
      );

      expect(result.hasPermission).toBe(true);
      expect(result.relationType).toBe(RelationType.CONTRIBUTOR);
    });

    it('should return permission denied for read-only user with write permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockReadOnlyRelation,
      );

      const result = await service.checkPermission(
        userId,
        accountName,
        PermissionAction.WRITE,
      );

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toContain('没有 write 权限');
    });

    it('should return permission denied when user is not associated with account', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(null);

      const result = await service.checkPermission(
        userId,
        accountName,
        PermissionAction.READ,
      );

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toBe('用户未关联到此共享账号');
    });

    it('should handle database errors gracefully', async () => {
      userAccountRelationRepository.findOne.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.checkPermission(
        userId,
        accountName,
        PermissionAction.READ,
      );

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toBe('权限检查过程中发生错误');
    });
  });

  describe('isOwner', () => {
    const userId = 'test-user-id';
    const accountName = 'test-account';

    it('should return true when user is owner', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockOwnerRelation,
      );

      const result = await service.isOwner(userId, accountName);

      expect(result).toBe(true);
      expect(userAccountRelationRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          accountName,
          relationType: RelationType.OWNER,
        },
      });
    });

    it('should return false when user is not owner', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(null);

      const result = await service.isOwner(userId, accountName);

      expect(result).toBe(false);
    });

    it('should return false when database error occurs', async () => {
      userAccountRelationRepository.findOne.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.isOwner(userId, accountName);

      expect(result).toBe(false);
    });
  });

  describe('canRead', () => {
    const userId = 'test-user-id';
    const accountName = 'test-account';

    it('should return true when user has read permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockOwnerRelation,
      );

      const result = await service.canRead(userId, accountName);

      expect(result).toBe(true);
    });

    it('should return false when user has no read permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(null);

      const result = await service.canRead(userId, accountName);

      expect(result).toBe(false);
    });
  });

  describe('canWrite', () => {
    const userId = 'test-user-id';
    const accountName = 'test-account';

    it('should return true when user has write permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockOwnerRelation,
      );

      const result = await service.canWrite(userId, accountName);

      expect(result).toBe(true);
    });

    it('should return false when user has no write permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockReadOnlyRelation,
      );

      const result = await service.canWrite(userId, accountName);

      expect(result).toBe(false);
    });
  });

  describe('canDelete', () => {
    const userId = 'test-user-id';
    const accountName = 'test-account';

    it('should return true when user has delete permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockOwnerRelation,
      );

      const result = await service.canDelete(userId, accountName);

      expect(result).toBe(true);
    });

    it('should return false when user has no delete permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockContributorRelation,
      );

      const result = await service.canDelete(userId, accountName);

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    const userId = 'test-user-id';
    const accountName = 'test-account';

    it('should return user permissions information', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockOwnerRelation,
      );

      const result = await service.getUserPermissions(userId, accountName);

      expect(result.hasPermission).toBe(true);
      expect(result.relationType).toBe(RelationType.OWNER);
      expect(result.permissions).toEqual(
        DEFAULT_PERMISSIONS[RelationType.OWNER],
      );
    });

    it('should return no permission when user is not associated', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserPermissions(userId, accountName);

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toBe('用户未关联到此共享账号');
    });
  });

  describe('batchCheckPermissions', () => {
    const userId = 'test-user-id';
    const accountNames = ['account1', 'account2', 'account3'];

    it('should check permissions for multiple accounts', async () => {
      // 模拟不同账号的权限结果
      userAccountRelationRepository.findOne
        .mockResolvedValueOnce(mockOwnerRelation)
        .mockResolvedValueOnce(mockContributorRelation)
        .mockResolvedValueOnce(null);

      const result = await service.batchCheckPermissions(
        userId,
        accountNames,
        PermissionAction.READ,
      );

      expect(Object.keys(result)).toHaveLength(3);
      expect(result['account1'].hasPermission).toBe(true);
      expect(result['account2'].hasPermission).toBe(true);
      expect(result['account3'].hasPermission).toBe(false);
    });
  });

  describe('getAccessibleAccounts', () => {
    const userId = 'test-user-id';

    it('should return accounts with read permission', async () => {
      const mockRelations = [
        { ...mockOwnerRelation, accountName: 'account1' },
        { ...mockContributorRelation, accountName: 'account2' },
        { ...mockReadOnlyRelation, accountName: 'account3' },
      ];

      userAccountRelationRepository.find.mockResolvedValue(mockRelations);

      const result = await service.getAccessibleAccounts(
        userId,
        PermissionAction.READ,
      );

      expect(result).toEqual(['account1', 'account2', 'account3']);
    });

    it('should return accounts with write permission', async () => {
      const mockRelations = [
        { ...mockOwnerRelation, accountName: 'account1' },
        { ...mockContributorRelation, accountName: 'account2' },
        { ...mockReadOnlyRelation, accountName: 'account3' },
      ];

      userAccountRelationRepository.find.mockResolvedValue(mockRelations);

      const result = await service.getAccessibleAccounts(
        userId,
        PermissionAction.WRITE,
      );

      // 只有owner和contributor有写权限
      expect(result).toEqual(['account1', 'account2']);
    });

    it('should return accounts with delete permission', async () => {
      const mockRelations = [
        { ...mockOwnerRelation, accountName: 'account1' },
        { ...mockContributorRelation, accountName: 'account2' },
        { ...mockReadOnlyRelation, accountName: 'account3' },
      ];

      userAccountRelationRepository.find.mockResolvedValue(mockRelations);

      const result = await service.getAccessibleAccounts(
        userId,
        PermissionAction.DELETE,
      );

      // 只有owner有删除权限
      expect(result).toEqual(['account1']);
    });

    it('should return empty array when database error occurs', async () => {
      userAccountRelationRepository.find.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getAccessibleAccounts(userId);

      expect(result).toEqual([]);
    });
  });

  describe('validatePermissionOrThrow', () => {
    const userId = 'test-user-id';
    const accountName = 'test-account';

    it('should not throw when user has permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(
        mockOwnerRelation,
      );

      await expect(
        service.validatePermissionOrThrow(
          userId,
          accountName,
          PermissionAction.READ,
        ),
      ).resolves.not.toThrow();
    });

    it('should throw error when user has no permission', async () => {
      userAccountRelationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validatePermissionOrThrow(
          userId,
          accountName,
          PermissionAction.READ,
        ),
      ).rejects.toThrow('权限不足: 用户未关联到此共享账号');
    });
  });
});
