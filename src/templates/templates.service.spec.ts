import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { DungeonTemplate } from '../entities/dungeon-template.entity';
import { WeeklyTaskTemplate } from '../entities/weekly-task-template.entity';
import { CreateDungeonTemplateDto } from './dto/create-dungeon-template.dto';
import { UpdateDungeonTemplateDto } from './dto/update-dungeon-template.dto';
import { CreateWeeklyTaskTemplateDto } from './dto/create-weekly-task-template.dto';
import { UpdateWeeklyTaskTemplateDto } from './dto/update-weekly-task-template.dto';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

describe('TemplatesService', () => {
  let service: TemplatesService;

  const mockDungeonTemplateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockWeeklyTaskTemplateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getRepositoryToken(DungeonTemplate),
          useValue: mockDungeonTemplateRepository,
        },
        {
          provide: getRepositoryToken(WeeklyTaskTemplate),
          useValue: mockWeeklyTaskTemplateRepository,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    dungeonTemplateRepository = module.get<Repository<DungeonTemplate>>(
      getRepositoryToken(DungeonTemplate),
    );
    weeklyTaskTemplateRepository = module.get<Repository<WeeklyTaskTemplate>>(
      getRepositoryToken(WeeklyTaskTemplate),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('副本模板管理', () => {
    describe('createDungeonTemplate', () => {
      it('应该成功创建副本模板', async () => {
        const createDto: CreateDungeonTemplateDto = {
          dungeonName: '测试副本',
          bosses: ['Boss1', 'Boss2'],
        };

        const mockTemplate = {
          templateId: 'mock-uuid-v4',
          dungeonName: '测试副本',
          bosses: ['Boss1', 'Boss2'],
        };

        mockDungeonTemplateRepository.create.mockReturnValue(mockTemplate);
        mockDungeonTemplateRepository.save.mockResolvedValue(mockTemplate);

        const result = await service.createDungeonTemplate(createDto);

        expect(mockDungeonTemplateRepository.create).toHaveBeenCalledWith({
          templateId: 'mock-uuid-v4',
          dungeonName: '测试副本',
          bosses: ['Boss1', 'Boss2'],
        });
        expect(mockDungeonTemplateRepository.save).toHaveBeenCalledWith(
          mockTemplate,
        );
        expect(result).toEqual(mockTemplate);
      });
    });

    describe('findAllDungeonTemplates', () => {
      it('应该返回所有副本模板', async () => {
        const mockTemplates = [
          { templateId: '1', dungeonName: '副本1' },
          { templateId: '2', dungeonName: '副本2' },
        ];
        const paginationDto = { page: 1, size: 10 };

        const mockQueryBuilder = {
          createQueryBuilder: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([mockTemplates, 2]),
        };

        mockDungeonTemplateRepository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder,
        );

        const result = await service.findAllDungeonTemplates(paginationDto);

        expect(
          mockDungeonTemplateRepository.createQueryBuilder,
        ).toHaveBeenCalledWith('template');
        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
          'template.createdAt',
          'DESC',
        );
        expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
        expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        expect(result.items).toEqual(mockTemplates);
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
        expect(result.size).toBe(10);
      });
    });

    describe('findDungeonTemplateById', () => {
      it('应该成功返回指定ID的副本模板', async () => {
        const templateId = 'test-id';
        const mockTemplate = { templateId, dungeonName: '测试副本' };

        mockDungeonTemplateRepository.findOne.mockResolvedValue(mockTemplate);

        const result = await service.findDungeonTemplateById(templateId);

        expect(mockDungeonTemplateRepository.findOne).toHaveBeenCalledWith({
          where: { templateId },
        });
        expect(result).toEqual(mockTemplate);
      });

      it('当副本模板不存在时应该抛出NotFoundException', async () => {
        const templateId = 'non-existent-id';

        mockDungeonTemplateRepository.findOne.mockResolvedValue(null);

        await expect(
          service.findDungeonTemplateById(templateId),
        ).rejects.toThrow(new NotFoundException('副本模板不存在'));
      });
    });

    describe('updateDungeonTemplate', () => {
      it('应该成功更新副本模板', async () => {
        const templateId = 'test-id';
        const updateDto: UpdateDungeonTemplateDto = {
          dungeonName: '更新后的副本',
        };

        const mockTemplate: DungeonTemplate = {
          templateId,
          dungeonName: '原副本名',
          bosses: ['Boss1'],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedTemplate = {
          ...mockTemplate,
          dungeonName: '更新后的副本',
        };

        jest
          .spyOn(service, 'findDungeonTemplateById')
          .mockResolvedValue(mockTemplate);
        mockDungeonTemplateRepository.save.mockResolvedValue(updatedTemplate);

        const result = await service.updateDungeonTemplate(
          templateId,
          updateDto,
        );

        expect(service.findDungeonTemplateById).toHaveBeenCalledWith(
          templateId,
        );
        expect(mockDungeonTemplateRepository.save).toHaveBeenCalled();
        expect(result).toEqual(updatedTemplate);
      });
    });

    describe('removeDungeonTemplate', () => {
      it('应该成功删除副本模板', async () => {
        const templateId = 'test-id';
        const mockTemplate: DungeonTemplate = {
          templateId,
          dungeonName: '测试副本',
          bosses: ['Boss1'],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        jest
          .spyOn(service, 'findDungeonTemplateById')
          .mockResolvedValue(mockTemplate);
        mockDungeonTemplateRepository.remove.mockResolvedValue(mockTemplate);

        await service.removeDungeonTemplate(templateId);

        expect(service.findDungeonTemplateById).toHaveBeenCalledWith(
          templateId,
        );
        expect(mockDungeonTemplateRepository.remove).toHaveBeenCalledWith(
          mockTemplate,
        );
      });
    });

    describe('searchDungeonTemplates', () => {
      it('应该根据副本名称搜索模板', async () => {
        const dungeonName = '测试';
        const mockTemplates: DungeonTemplate[] = [
          {
            templateId: '1',
            dungeonName: '测试副本',
            bosses: ['Boss1'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockTemplates),
        };

        mockDungeonTemplateRepository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder,
        );

        const result = await service.searchDungeonTemplates(dungeonName);

        expect(
          mockDungeonTemplateRepository.createQueryBuilder,
        ).toHaveBeenCalledWith('template');
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'template.dungeonName LIKE :name',
          { name: `%${dungeonName}%` },
        );
        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
          'template.createdAt',
          'DESC',
        );
        expect(result).toEqual(mockTemplates);
      });
    });
  });

  describe('周常任务模板管理', () => {
    describe('createWeeklyTaskTemplate', () => {
      it('应该成功创建周常任务模板', async () => {
        const createDto: CreateWeeklyTaskTemplateDto = {
          taskName: '测试任务',
          targetCount: 10,
        };

        const mockTemplate = {
          templateId: 'mock-uuid-v4',
          taskName: '测试任务',
          targetCount: 10,
        };

        mockWeeklyTaskTemplateRepository.create.mockReturnValue(mockTemplate);
        mockWeeklyTaskTemplateRepository.save.mockResolvedValue(mockTemplate);

        const result = await service.createWeeklyTaskTemplate(createDto);

        expect(mockWeeklyTaskTemplateRepository.create).toHaveBeenCalledWith({
          templateId: 'mock-uuid-v4',
          taskName: '测试任务',
          targetCount: 10,
        });
        expect(mockWeeklyTaskTemplateRepository.save).toHaveBeenCalledWith(
          mockTemplate,
        );
        expect(result).toEqual(mockTemplate);
      });
    });

    describe('findAllWeeklyTaskTemplates', () => {
      it('应该返回所有周常任务模板', async () => {
        const mockTemplates: WeeklyTaskTemplate[] = [
          {
            templateId: '1',
            taskName: '任务1',
            targetCount: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            templateId: '2',
            taskName: '任务2',
            targetCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        const paginationDto = { page: 1, size: 10 };

        const mockQueryBuilder = {
          createQueryBuilder: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([mockTemplates, 2]),
        };

        mockWeeklyTaskTemplateRepository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder,
        );

        const result = await service.findAllWeeklyTaskTemplates(paginationDto);

        expect(
          mockWeeklyTaskTemplateRepository.createQueryBuilder,
        ).toHaveBeenCalledWith('template');
        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
          'template.createdAt',
          'DESC',
        );
        expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
        expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        expect(result.items).toEqual(mockTemplates);
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
        expect(result.size).toBe(10);
      });
    });

    describe('findWeeklyTaskTemplateById', () => {
      it('应该成功返回指定ID的周常任务模板', async () => {
        const templateId = 'test-id';
        const mockTemplate: WeeklyTaskTemplate = {
          templateId,
          taskName: '测试任务',
          targetCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockWeeklyTaskTemplateRepository.findOne.mockResolvedValue(
          mockTemplate,
        );

        const result = await service.findWeeklyTaskTemplateById(templateId);

        expect(mockWeeklyTaskTemplateRepository.findOne).toHaveBeenCalledWith({
          where: { templateId },
        });
        expect(result).toEqual(mockTemplate);
      });

      it('当周常任务模板不存在时应该抛出NotFoundException', async () => {
        const templateId = 'non-existent-id';

        mockWeeklyTaskTemplateRepository.findOne.mockResolvedValue(null);

        await expect(
          service.findWeeklyTaskTemplateById(templateId),
        ).rejects.toThrow(new NotFoundException('周常任务模板不存在'));
      });
    });

    describe('updateWeeklyTaskTemplate', () => {
      it('应该成功更新周常任务模板', async () => {
        const templateId = 'test-id';
        const updateDto: UpdateWeeklyTaskTemplateDto = {
          taskName: '更新后的任务',
        };

        const mockTemplate: WeeklyTaskTemplate = {
          templateId,
          taskName: '原任务名',
          targetCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedTemplate = {
          ...mockTemplate,
          taskName: '更新后的任务',
        };

        jest
          .spyOn(service, 'findWeeklyTaskTemplateById')
          .mockResolvedValue(mockTemplate);
        mockWeeklyTaskTemplateRepository.save.mockResolvedValue(
          updatedTemplate,
        );

        const result = await service.updateWeeklyTaskTemplate(
          templateId,
          updateDto,
        );

        expect(service.findWeeklyTaskTemplateById).toHaveBeenCalledWith(
          templateId,
        );
        expect(mockWeeklyTaskTemplateRepository.save).toHaveBeenCalled();
        expect(result).toEqual(updatedTemplate);
      });
    });

    describe('removeWeeklyTaskTemplate', () => {
      it('应该成功删除周常任务模板', async () => {
        const templateId = 'test-id';
        const mockTemplate: WeeklyTaskTemplate = {
          templateId,
          taskName: '测试任务',
          targetCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        jest
          .spyOn(service, 'findWeeklyTaskTemplateById')
          .mockResolvedValue(mockTemplate);
        mockWeeklyTaskTemplateRepository.remove.mockResolvedValue(mockTemplate);

        await service.removeWeeklyTaskTemplate(templateId);

        expect(service.findWeeklyTaskTemplateById).toHaveBeenCalledWith(
          templateId,
        );
        expect(mockWeeklyTaskTemplateRepository.remove).toHaveBeenCalledWith(
          mockTemplate,
        );
      });
    });

    describe('searchWeeklyTaskTemplates', () => {
      it('应该根据任务名称搜索模板', async () => {
        const taskName = '测试';
        const mockTemplates: WeeklyTaskTemplate[] = [
          {
            templateId: '1',
            taskName: '测试任务',
            targetCount: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockTemplates),
        };

        mockWeeklyTaskTemplateRepository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder,
        );

        const result = await service.searchWeeklyTaskTemplates(taskName);

        expect(
          mockWeeklyTaskTemplateRepository.createQueryBuilder,
        ).toHaveBeenCalledWith('template');
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'template.taskName LIKE :name',
          { name: `%${taskName}%` },
        );
        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
          'template.createdAt',
          'DESC',
        );
        expect(result).toEqual(mockTemplates);
      });
    });
  });

  describe('getTemplateStats', () => {
    it('应该返回模板统计信息', async () => {
      mockDungeonTemplateRepository.count.mockResolvedValue(5);
      mockWeeklyTaskTemplateRepository.count.mockResolvedValue(3);

      const result = await service.getTemplateStats();

      expect(mockDungeonTemplateRepository.count).toHaveBeenCalled();
      expect(mockWeeklyTaskTemplateRepository.count).toHaveBeenCalled();
      expect(result).toEqual({
        dungeonTemplateCount: 5,
        weeklyTaskTemplateCount: 3,
      });
    });
  });
});
