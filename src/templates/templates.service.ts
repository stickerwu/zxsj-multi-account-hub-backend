import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DungeonTemplate } from '../entities/dungeon-template.entity';
import { WeeklyTaskTemplate } from '../entities/weekly-task-template.entity';
import { CreateDungeonTemplateDto } from './dto/create-dungeon-template.dto';
import { UpdateDungeonTemplateDto } from './dto/update-dungeon-template.dto';
import { CreateWeeklyTaskTemplateDto } from './dto/create-weekly-task-template.dto';
import { UpdateWeeklyTaskTemplateDto } from './dto/update-weekly-task-template.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(DungeonTemplate)
    private dungeonTemplateRepository: Repository<DungeonTemplate>,
    @InjectRepository(WeeklyTaskTemplate)
    private weeklyTaskTemplateRepository: Repository<WeeklyTaskTemplate>,
  ) {}

  // ==================== 副本模板管理 ====================

  /**
   * 创建副本模板
   */
  async createDungeonTemplate(
    createDungeonTemplateDto: CreateDungeonTemplateDto,
  ): Promise<DungeonTemplate> {
    const template = this.dungeonTemplateRepository.create({
      templateId: uuidv4(),
      dungeonName: createDungeonTemplateDto.dungeonName,
      bosses: createDungeonTemplateDto.bosses,
    });

    return this.dungeonTemplateRepository.save(template);
  }

  /**
   * 获取所有副本模板（支持分页和搜索）
   */
  async findAllDungeonTemplates(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<DungeonTemplate>> {
    const { page = 1, size = 10, search } = paginationDto;
    const skip = (page - 1) * size;

    const queryBuilder = this.dungeonTemplateRepository
      .createQueryBuilder('template')
      .orderBy('template.createdAt', 'DESC');

    // 如果有搜索关键词，添加搜索条件
    if (search) {
      queryBuilder.where('template.dungeonName LIKE :search', {
        search: `%${search}%`,
      });
    }

    // 获取总数和分页数据
    const [items, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return new PaginatedResponse(items, total, page, size);
  }

  /**
   * 根据ID获取副本模板
   */
  async findDungeonTemplateById(templateId: string): Promise<DungeonTemplate> {
    const template = await this.dungeonTemplateRepository.findOne({
      where: { templateId },
    });

    if (!template) {
      throw new NotFoundException('副本模板不存在');
    }

    return template;
  }

  /**
   * 更新副本模板
   */
  async updateDungeonTemplate(
    templateId: string,
    updateDungeonTemplateDto: UpdateDungeonTemplateDto,
  ): Promise<DungeonTemplate> {
    const template = await this.findDungeonTemplateById(templateId);

    Object.assign(template, updateDungeonTemplateDto);
    template.updatedAt = new Date();

    return this.dungeonTemplateRepository.save(template);
  }

  /**
   * 删除副本模板
   */
  async removeDungeonTemplate(templateId: string): Promise<void> {
    const template = await this.findDungeonTemplateById(templateId);
    await this.dungeonTemplateRepository.remove(template);
  }

  /**
   * 根据副本名称搜索模板
   */
  async searchDungeonTemplates(
    dungeonName: string,
  ): Promise<DungeonTemplate[]> {
    return this.dungeonTemplateRepository
      .createQueryBuilder('template')
      .where('template.dungeonName LIKE :name', { name: `%${dungeonName}%` })
      .orderBy('template.createdAt', 'DESC')
      .getMany();
  }

  // ==================== 周常任务模板管理 ====================

  /**
   * 创建周常任务模板
   */
  async createWeeklyTaskTemplate(
    createWeeklyTaskTemplateDto: CreateWeeklyTaskTemplateDto,
  ): Promise<WeeklyTaskTemplate> {
    const template = this.weeklyTaskTemplateRepository.create({
      templateId: uuidv4(),
      taskName: createWeeklyTaskTemplateDto.taskName,
      targetCount: createWeeklyTaskTemplateDto.targetCount,
    });

    return this.weeklyTaskTemplateRepository.save(template);
  }

  /**
   * 获取所有周常任务模板（支持分页和搜索）
   */
  async findAllWeeklyTaskTemplates(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<WeeklyTaskTemplate>> {
    const { page = 1, size = 10, search } = paginationDto;
    const skip = (page - 1) * size;

    const queryBuilder = this.weeklyTaskTemplateRepository
      .createQueryBuilder('template')
      .orderBy('template.createdAt', 'DESC');

    // 如果有搜索关键词，添加搜索条件
    if (search) {
      queryBuilder.where('template.taskName LIKE :search', {
        search: `%${search}%`,
      });
    }

    // 获取总数和分页数据
    const [items, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return new PaginatedResponse(items, total, page, size);
  }

  /**
   * 根据ID获取周常任务模板
   */
  async findWeeklyTaskTemplateById(
    templateId: string,
  ): Promise<WeeklyTaskTemplate> {
    const template = await this.weeklyTaskTemplateRepository.findOne({
      where: { templateId },
    });

    if (!template) {
      throw new NotFoundException('周常任务模板不存在');
    }

    return template;
  }

  /**
   * 更新周常任务模板
   */
  async updateWeeklyTaskTemplate(
    templateId: string,
    updateWeeklyTaskTemplateDto: UpdateWeeklyTaskTemplateDto,
  ): Promise<WeeklyTaskTemplate> {
    const template = await this.findWeeklyTaskTemplateById(templateId);

    Object.assign(template, updateWeeklyTaskTemplateDto);
    template.updatedAt = new Date();

    return this.weeklyTaskTemplateRepository.save(template);
  }

  /**
   * 删除周常任务模板
   */
  async removeWeeklyTaskTemplate(templateId: string): Promise<void> {
    const template = await this.findWeeklyTaskTemplateById(templateId);
    await this.weeklyTaskTemplateRepository.remove(template);
  }

  /**
   * 根据任务名称搜索模板
   */
  async searchWeeklyTaskTemplates(
    taskName: string,
  ): Promise<WeeklyTaskTemplate[]> {
    return this.weeklyTaskTemplateRepository
      .createQueryBuilder('template')
      .where('template.taskName LIKE :name', { name: `%${taskName}%` })
      .orderBy('template.createdAt', 'DESC')
      .getMany();
  }

  // ==================== 统计信息 ====================

  /**
   * 获取模板统计信息
   */
  async getTemplateStats(): Promise<{
    dungeonTemplateCount: number;
    weeklyTaskTemplateCount: number;
  }> {
    const [dungeonTemplateCount, weeklyTaskTemplateCount] = await Promise.all([
      this.dungeonTemplateRepository.count(),
      this.weeklyTaskTemplateRepository.count(),
    ]);

    return {
      dungeonTemplateCount,
      weeklyTaskTemplateCount,
    };
  }
}
