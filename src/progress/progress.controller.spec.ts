import { Test, TestingModule } from '@nestjs/testing';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

describe('ProgressController', () => {
  let controller: ProgressController;
  let service: ProgressService;

  const mockProgressService = {
    getCurrentWeekProgress: jest.fn(),
    getAccountProgress: jest.fn(),
    updateDungeonProgress: jest.fn(),
    updateWeeklyTaskProgress: jest.fn(),
    getProgressStats: jest.fn(),
    getHistoricalProgress: jest.fn(),
    resetAllWeeklyProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        {
          provide: ProgressService,
          useValue: mockProgressService,
        },
      ],
    }).compile();

    controller = module.get<ProgressController>(ProgressController);
    service = module.get<ProgressService>(ProgressService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentWeekProgress', () => {
    it('应该返回当前用户的当前周进度', async () => {
      const mockRequest = {
        user: { userId: 'user-1' },
      };
      const mockProgress = [
        { progressId: '1', accountId: 'account-1' },
        { progressId: '2', accountId: 'account-2' },
      ];

      mockProgressService.getCurrentWeekProgress.mockResolvedValue(
        mockProgress,
      );

      const result = await controller.getCurrentWeekProgress(
        mockRequest as any,
      );

      expect(mockProgressService.getCurrentWeekProgress).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual(mockProgress);
    });
  });

  describe('getAccountProgress', () => {
    it('应该返回指定账号的当前周进度', async () => {
      const accountId = 'account-1';
      const mockRequest = {
        user: { userId: 'user-1' },
      };
      const mockProgress = {
        progressId: 'progress-1',
        accountId,
      };

      mockProgressService.getAccountProgress.mockResolvedValue(mockProgress);

      const result = await controller.getAccountProgress(
        accountId,
        mockRequest as any,
      );

      expect(mockProgressService.getAccountProgress).toHaveBeenCalledWith(
        accountId,
        'user-1',
      );
      expect(result).toEqual(mockProgress);
    });
  });

  describe('getProgressStats', () => {
    it('应该返回进度统计信息', async () => {
      const mockRequest = {
        user: { userId: 'user-1' },
      };
      const mockStats = {
        totalAccounts: 5,
        activeAccounts: 3,
        currentWeekProgressCount: 2,
      };

      mockProgressService.getProgressStats.mockResolvedValue(mockStats);

      const result = await controller.getProgressStats(mockRequest as any);

      expect(mockProgressService.getProgressStats).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual(mockStats);
    });
  });
});
