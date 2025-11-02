import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProgressService } from './progress.service';
import { WeeklyProgress } from '../entities/weekly-progress.entity';
import { Account } from '../entities/account.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

describe('ProgressService', () => {
  let service: ProgressService;

  const mockProgressRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  const mockAccountRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
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
    isActive: true,
    userId: 'user-1',
    user: mockUser,
  };

  const mockProgress = {
    id: 'progress-1',
    account: mockAccount,
    weekStart: new Date('2024-01-01'),
    dungeonProgress: {
      template1_0: true,
      template1_1: false,
    },
    weeklyTaskProgress: {
      task1: 5,
      task2: 3,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: getRepositoryToken(WeeklyProgress),
          useValue: mockProgressRepository,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentWeekStart', () => {
    it('应该返回当前周的开始时间（周三）', () => {
      // 模拟一个周五的日期
      const friday = new Date('2024-01-05T10:00:00'); // 2024年1月5日是周五，10:00 AM
      jest.spyOn(Date, 'now').mockReturnValue(friday.getTime());

      const result = service.getCurrentWeekStart();

      // 应该返回该周的周三 8:00 AM
      expect(result.getDay()).toBe(3); // 周三
      expect(result.getHours()).toBe(8); // 8:00 AM
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('getCurrentWeekProgress', () => {
    it('应该返回用户所有账号的当前周进度', async () => {
      const accounts = [mockAccount];
      const progresses = [mockProgress];

      mockAccountRepository.find.mockResolvedValue(accounts);
      mockProgressRepository.find.mockResolvedValue(progresses);

      const result = await service.getCurrentWeekProgress('user-1');

      expect(result).toEqual(progresses);
      expect(mockAccountRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('getAccountProgress', () => {
    it('应该返回指定账号的当前周进度', async () => {
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockProgressRepository.findOne.mockResolvedValue(mockProgress);

      const result = await service.getAccountProgress('account-1', 'user-1');

      expect(result).toEqual(mockProgress);
    });

    it('当账号不存在时应该抛出 NotFoundException', async () => {
      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAccountProgress('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('当用户无权限时应该抛出 ForbiddenException', async () => {
      const otherUserAccount = {
        ...mockAccount,
        userId: 'other-user',
      };

      mockAccountRepository.findOne.mockResolvedValue(otherUserAccount);

      await expect(
        service.getAccountProgress('account-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateDungeonProgress', () => {
    it('应该成功更新副本进度', async () => {
      const updateDto = {
        accountId: 'account-1',
        templateId: 'template1',
        bossIndex: 0,
        killCount: 1,
      };

      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockProgressRepository.findOne.mockResolvedValue(mockProgress);
      mockProgressRepository.save.mockResolvedValue({
        ...mockProgress,
        dungeonProgress: {
          ...mockProgress.dungeonProgress,
          template1_0: true,
        },
      });

      const result = await service.updateDungeonProgress(updateDto, 'user-1');

      expect(result.dungeonProgress['template1_0']).toBe(true);
      expect(mockProgressRepository.save).toHaveBeenCalled();
    });

    it('当账号不存在时应该抛出 NotFoundException', async () => {
      const updateDto = {
        accountId: 'nonexistent',
        templateId: 'template1',
        bossIndex: 0,
        killCount: 1,
      };

      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateDungeonProgress(updateDto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateWeeklyTaskProgress', () => {
    it('应该成功更新周常任务进度', async () => {
      const updateDto = {
        accountId: 'account-1',
        taskName: 'task1',
        completedCount: 10,
      };

      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockProgressRepository.findOne.mockResolvedValue(mockProgress);
      mockProgressRepository.save.mockResolvedValue({
        ...mockProgress,
        weeklyTaskProgress: {
          ...mockProgress.weeklyTaskProgress,
          task1: 10,
        },
      });

      const result = await service.updateWeeklyTaskProgress(
        updateDto,
        'user-1',
      );

      expect(result.weeklyTaskProgress['task1']).toBe(10);
      expect(mockProgressRepository.save).toHaveBeenCalled();
    });

    it('当账号不存在时应该抛出 NotFoundException', async () => {
      const updateDto = {
        accountId: 'nonexistent',
        taskName: 'task1',
        completedCount: 10,
      };

      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateWeeklyTaskProgress(updateDto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetAllWeeklyProgress', () => {
    it('应该成功重置所有周进度', async () => {
      const activeAccounts = [mockAccount];
      mockAccountRepository.find.mockResolvedValue(activeAccounts);
      mockProgressRepository.create.mockReturnValue(mockProgress);
      mockProgressRepository.save.mockResolvedValue([mockProgress]);

      await service.resetAllWeeklyProgress();

      expect(mockAccountRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(mockProgressRepository.create).toHaveBeenCalled();
      expect(mockProgressRepository.save).toHaveBeenCalled();
    });
  });

  describe('getProgressStats', () => {
    it('应该返回进度统计信息', async () => {
      const accounts = [mockAccount];

      mockAccountRepository.find.mockResolvedValueOnce(accounts); // 总账号数
      mockAccountRepository.find.mockResolvedValueOnce(accounts); // 活跃账号数
      mockProgressRepository.count.mockResolvedValue(1); // 当前周进度数

      const result = await service.getProgressStats('user-1');

      expect(result).toHaveProperty('totalAccounts');
      expect(result).toHaveProperty('activeAccounts');
      expect(result).toHaveProperty('currentWeekProgressCount');
      expect(result.totalAccounts).toBe(1);
      expect(result.activeAccounts).toBe(1);
      expect(result.currentWeekProgressCount).toBe(1);
    });
  });
});
