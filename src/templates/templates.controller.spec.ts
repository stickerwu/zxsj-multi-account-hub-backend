import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { CreateDungeonTemplateDto } from './dto/create-dungeon-template.dto';
import { UpdateDungeonTemplateDto } from './dto/update-dungeon-template.dto';
import { CreateWeeklyTaskTemplateDto } from './dto/create-weekly-task-template.dto';
import { UpdateWeeklyTaskTemplateDto } from './dto/update-weekly-task-template.dto';

describe('TemplatesController', () => {
  let controller: TemplatesController;
  let service: TemplatesService;

  const mockTemplatesService = {
    // 副本模板相关方法
    createDungeonTemplate: jest.fn(),
    findAllDungeonTemplates: jest.fn(),
    findDungeonTemplateById: jest.fn(),
    updateDungeonTemplate: jest.fn(),
    removeDungeonTemplate: jest.fn(),
    searchDungeonTemplates: jest.fn(),

    // 周常任务模板相关方法
    createWeeklyTaskTemplate: jest.fn(),
    findAllWeeklyTaskTemplates: jest.fn(),
    findWeeklyTaskTemplateById: jest.fn(),
    updateWeeklyTaskTemplate: jest.fn(),
    removeWeeklyTaskTemplate: jest.fn(),
    searchWeeklyTaskTemplates: jest.fn(),

    // 统计信息
    getTemplateStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        {
          provide: TemplatesService,
          useValue: mockTemplatesService,
        },
      ],
    }).compile();

    controller = module.get<TemplatesController>(TemplatesController);
    service = module.get<TemplatesService>(TemplatesService);
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
          templateId: 'test-id',
          dungeonName: '测试副本',
          bosses: ['Boss1', 'Boss2'],
        };

        mockTemplatesService.createDungeonTemplate.mockResolvedValue(
          mockTemplate,
        );

        const result = await controller.createDungeonTemplate(createDto);

        expect(mockTemplatesService.createDungeonTemplate).toHaveBeenCalledWith(
          createDto,
        );
        expect(result).toEqual({
          code: 200,
          message: '副本模板创建成功',
          data: mockTemplate,
        });
      });
    });

    describe('findAllDungeonTemplates', () => {
      it('应该返回所有副本模板', async () => {
        const mockTemplates = [
          { templateId: '1', dungeonName: '副本1' },
          { templateId: '2', dungeonName: '副本2' },
        ];

        mockTemplatesService.findAllDungeonTemplates.mockResolvedValue(
          mockTemplates,
        );

        const result = await controller.findAllDungeonTemplates();

        expect(mockTemplatesService.findAllDungeonTemplates).toHaveBeenCalled();
        expect(result).toEqual({
          code: 200,
          message: '获取成功',
          data: mockTemplates,
        });
      });
    });

    describe('findDungeonTemplate', () => {
      it('应该返回指定ID的副本模板', async () => {
        const templateId = 'test-id';
        const mockTemplate = { templateId, dungeonName: '测试副本' };

        mockTemplatesService.findDungeonTemplateById.mockResolvedValue(
          mockTemplate,
        );

        const result = await controller.findDungeonTemplate(templateId);

        expect(
          mockTemplatesService.findDungeonTemplateById,
        ).toHaveBeenCalledWith(templateId);
        expect(result).toEqual({
          code: 200,
          message: '获取成功',
          data: mockTemplate,
        });
      });
    });

    describe('updateDungeonTemplate', () => {
      it('应该成功更新副本模板', async () => {
        const templateId = 'test-id';
        const updateDto: UpdateDungeonTemplateDto = {
          dungeonName: '更新后的副本',
        };

        const updatedTemplate = {
          templateId,
          dungeonName: '更新后的副本',
        };

        mockTemplatesService.updateDungeonTemplate.mockResolvedValue(
          updatedTemplate,
        );

        const result = await controller.updateDungeonTemplate(
          templateId,
          updateDto,
        );

        expect(mockTemplatesService.updateDungeonTemplate).toHaveBeenCalledWith(
          templateId,
          updateDto,
        );
        expect(result).toEqual({
          code: 200,
          message: '更新成功',
          data: updatedTemplate,
        });
      });
    });

    describe('removeDungeonTemplate', () => {
      it('应该成功删除副本模板', async () => {
        const templateId = 'test-id';

        mockTemplatesService.removeDungeonTemplate.mockResolvedValue(undefined);

        const result = await controller.removeDungeonTemplate(templateId);

        expect(mockTemplatesService.removeDungeonTemplate).toHaveBeenCalledWith(
          templateId,
        );
        expect(result).toEqual({
          code: 200,
          message: '删除成功',
        });
      });
    });

    describe('findAllDungeonTemplates with search', () => {
      it('应该根据副本名称搜索模板', async () => {
        const dungeonName = '测试';
        const mockTemplates = [{ templateId: '1', dungeonName: '测试副本' }];

        mockTemplatesService.searchDungeonTemplates.mockResolvedValue(
          mockTemplates,
        );

        const result = await controller.findAllDungeonTemplates(dungeonName);

        expect(
          mockTemplatesService.searchDungeonTemplates,
        ).toHaveBeenCalledWith(dungeonName);
        expect(result).toEqual({
          code: 200,
          message: '获取成功',
          data: mockTemplates,
        });
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
          templateId: 'test-id',
          taskName: '测试任务',
          targetCount: 10,
        };

        mockTemplatesService.createWeeklyTaskTemplate.mockResolvedValue(
          mockTemplate,
        );

        const result = await controller.createWeeklyTaskTemplate(createDto);

        expect(
          mockTemplatesService.createWeeklyTaskTemplate,
        ).toHaveBeenCalledWith(createDto);
        expect(result).toEqual({
          code: 200,
          message: '周常任务模板创建成功',
          data: mockTemplate,
        });
      });
    });

    describe('findAllWeeklyTaskTemplates', () => {
      it('应该返回所有周常任务模板', async () => {
        const mockTemplates = [
          { templateId: '1', taskName: '任务1' },
          { templateId: '2', taskName: '任务2' },
        ];

        mockTemplatesService.findAllWeeklyTaskTemplates.mockResolvedValue(
          mockTemplates,
        );

        const result = await controller.findAllWeeklyTaskTemplates();

        expect(
          mockTemplatesService.findAllWeeklyTaskTemplates,
        ).toHaveBeenCalled();
        expect(result).toEqual({
          code: 200,
          message: '获取成功',
          data: mockTemplates,
        });
      });
    });

    describe('findWeeklyTaskTemplate', () => {
      it('应该返回指定ID的周常任务模板', async () => {
        const templateId = 'test-id';
        const mockTemplate = { templateId, taskName: '测试任务' };

        mockTemplatesService.findWeeklyTaskTemplateById.mockResolvedValue(
          mockTemplate,
        );

        const result = await controller.findWeeklyTaskTemplate(templateId);

        expect(
          mockTemplatesService.findWeeklyTaskTemplateById,
        ).toHaveBeenCalledWith(templateId);
        expect(result).toEqual({
          code: 200,
          message: '获取成功',
          data: mockTemplate,
        });
      });
    });

    describe('updateWeeklyTaskTemplate', () => {
      it('应该成功更新周常任务模板', async () => {
        const templateId = 'test-id';
        const updateDto: UpdateWeeklyTaskTemplateDto = {
          taskName: '更新后的任务',
        };

        const updatedTemplate = {
          templateId,
          taskName: '更新后的任务',
        };

        mockTemplatesService.updateWeeklyTaskTemplate.mockResolvedValue(
          updatedTemplate,
        );

        const result = await controller.updateWeeklyTaskTemplate(
          templateId,
          updateDto,
        );

        expect(
          mockTemplatesService.updateWeeklyTaskTemplate,
        ).toHaveBeenCalledWith(templateId, updateDto);
        expect(result).toEqual({
          code: 200,
          message: '更新成功',
          data: updatedTemplate,
        });
      });
    });

    describe('removeWeeklyTaskTemplate', () => {
      it('应该成功删除周常任务模板', async () => {
        const templateId = 'test-id';

        mockTemplatesService.removeWeeklyTaskTemplate.mockResolvedValue(
          undefined,
        );

        const result = await controller.removeWeeklyTaskTemplate(templateId);

        expect(
          mockTemplatesService.removeWeeklyTaskTemplate,
        ).toHaveBeenCalledWith(templateId);
        expect(result).toEqual({
          code: 200,
          message: '删除成功',
        });
      });
    });

    describe('findAllWeeklyTaskTemplates with search', () => {
      it('应该根据任务名称搜索模板', async () => {
        const taskName = '测试';
        const mockTemplates = [{ templateId: '1', taskName: '测试任务' }];

        mockTemplatesService.searchWeeklyTaskTemplates.mockResolvedValue(
          mockTemplates,
        );

        const result = await controller.findAllWeeklyTaskTemplates(taskName);

        expect(
          mockTemplatesService.searchWeeklyTaskTemplates,
        ).toHaveBeenCalledWith(taskName);
        expect(result).toEqual({
          code: 200,
          message: '获取成功',
          data: mockTemplates,
        });
      });
    });
  });

  describe('getTemplateStats', () => {
    it('应该返回模板统计信息', async () => {
      const mockStats = {
        dungeonTemplateCount: 5,
        weeklyTaskTemplateCount: 3,
      };

      mockTemplatesService.getTemplateStats.mockResolvedValue(mockStats);

      const result = await controller.getTemplateStats();

      expect(mockTemplatesService.getTemplateStats).toHaveBeenCalled();
      expect(result).toEqual({
        code: 200,
        message: '获取成功',
        data: mockStats,
      });
    });
  });
});
