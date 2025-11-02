import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateDungeonTemplateDto } from './dto/create-dungeon-template.dto';
import { UpdateDungeonTemplateDto } from './dto/update-dungeon-template.dto';
import { CreateWeeklyTaskTemplateDto } from './dto/create-weekly-task-template.dto';
import { UpdateWeeklyTaskTemplateDto } from './dto/update-weekly-task-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('模板管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // ==================== 副本模板接口 ====================

  @Post('dungeons')
  @ApiOperation({ summary: '创建副本模板' })
  @ApiResponse({ status: 201, description: '副本模板创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createDungeonTemplate(
    @Body() createDungeonTemplateDto: CreateDungeonTemplateDto,
  ) {
    const template = await this.templatesService.createDungeonTemplate(
      createDungeonTemplateDto,
    );
    return {
      code: 200,
      message: '副本模板创建成功',
      data: template,
    };
  }

  @Get('dungeons')
  @ApiOperation({ summary: '获取所有副本模板' })
  @ApiQuery({ name: 'search', required: false, description: '搜索副本名称' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAllDungeonTemplates(@Query('search') search?: string) {
    const templates = search
      ? await this.templatesService.searchDungeonTemplates(search)
      : await this.templatesService.findAllDungeonTemplates();

    return {
      code: 200,
      message: '获取成功',
      data: templates,
    };
  }

  @Get('dungeons/:id')
  @ApiOperation({ summary: '获取指定副本模板详情' })
  @ApiParam({ name: 'id', description: '副本模板ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '副本模板不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findDungeonTemplate(@Param('id') id: string) {
    const template = await this.templatesService.findDungeonTemplateById(id);
    return {
      code: 200,
      message: '获取成功',
      data: template,
    };
  }

  @Patch('dungeons/:id')
  @ApiOperation({ summary: '更新副本模板' })
  @ApiParam({ name: 'id', description: '副本模板ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '副本模板不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async updateDungeonTemplate(
    @Param('id') id: string,
    @Body() updateDungeonTemplateDto: UpdateDungeonTemplateDto,
  ) {
    const template = await this.templatesService.updateDungeonTemplate(
      id,
      updateDungeonTemplateDto,
    );
    return {
      code: 200,
      message: '更新成功',
      data: template,
    };
  }

  @Delete('dungeons/:id')
  @ApiOperation({ summary: '删除副本模板' })
  @ApiParam({ name: 'id', description: '副本模板ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '副本模板不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async removeDungeonTemplate(@Param('id') id: string) {
    await this.templatesService.removeDungeonTemplate(id);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  // ==================== 周常任务模板接口 ====================

  @Post('weekly-tasks')
  @ApiOperation({ summary: '创建周常任务模板' })
  @ApiResponse({ status: 201, description: '周常任务模板创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createWeeklyTaskTemplate(
    @Body() createWeeklyTaskTemplateDto: CreateWeeklyTaskTemplateDto,
  ) {
    const template = await this.templatesService.createWeeklyTaskTemplate(
      createWeeklyTaskTemplateDto,
    );
    return {
      code: 200,
      message: '周常任务模板创建成功',
      data: template,
    };
  }

  @Get('weekly-tasks')
  @ApiOperation({ summary: '获取所有周常任务模板' })
  @ApiQuery({ name: 'search', required: false, description: '搜索任务名称' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAllWeeklyTaskTemplates(@Query('search') search?: string) {
    const templates = search
      ? await this.templatesService.searchWeeklyTaskTemplates(search)
      : await this.templatesService.findAllWeeklyTaskTemplates();

    return {
      code: 200,
      message: '获取成功',
      data: templates,
    };
  }

  @Get('weekly-tasks/:id')
  @ApiOperation({ summary: '获取指定周常任务模板详情' })
  @ApiParam({ name: 'id', description: '周常任务模板ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '周常任务模板不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findWeeklyTaskTemplate(@Param('id') id: string) {
    const template = await this.templatesService.findWeeklyTaskTemplateById(id);
    return {
      code: 200,
      message: '获取成功',
      data: template,
    };
  }

  @Patch('weekly-tasks/:id')
  @ApiOperation({ summary: '更新周常任务模板' })
  @ApiParam({ name: 'id', description: '周常任务模板ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '周常任务模板不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async updateWeeklyTaskTemplate(
    @Param('id') id: string,
    @Body() updateWeeklyTaskTemplateDto: UpdateWeeklyTaskTemplateDto,
  ) {
    const template = await this.templatesService.updateWeeklyTaskTemplate(
      id,
      updateWeeklyTaskTemplateDto,
    );
    return {
      code: 200,
      message: '更新成功',
      data: template,
    };
  }

  @Delete('weekly-tasks/:id')
  @ApiOperation({ summary: '删除周常任务模板' })
  @ApiParam({ name: 'id', description: '周常任务模板ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '周常任务模板不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async removeWeeklyTaskTemplate(@Param('id') id: string) {
    await this.templatesService.removeWeeklyTaskTemplate(id);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  // ==================== 统计信息接口 ====================

  @Get('stats')
  @ApiOperation({ summary: '获取模板统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getTemplateStats() {
    const stats = await this.templatesService.getTemplateStats();
    return {
      code: 200,
      message: '获取成功',
      data: stats,
    };
  }
}
