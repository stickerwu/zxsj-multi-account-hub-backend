import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateDungeonProgressDto } from './dto/update-dungeon-progress.dto';
import { UpdateWeeklyTaskProgressDto } from './dto/update-weekly-task-progress.dto';
import { UpdateSharedDungeonProgressDto } from './dto/update-shared-dungeon-progress.dto';
import { UpdateSharedWeeklyTaskProgressDto } from './dto/update-shared-weekly-task-progress.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { WeeklyProgress } from '../entities/weekly-progress.entity';

// 定义认证后的请求接口
interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
  };
}

@ApiTags('进度跟踪')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('current-week')
  @ApiOperation({ summary: '获取当前周进度（支持分页）' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码，默认为1',
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: '每页数量，默认为10',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词（账号名称）',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: '总记录数' },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/WeeklyProgress' },
          description: '当前周进度列表',
        },
        page: { type: 'number', description: '当前页码' },
        size: { type: 'number', description: '每页数量' },
        totalPages: { type: 'number', description: '总页数' },
      },
    },
  })
  async getCurrentWeekProgress(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<WeeklyProgress>> {
    return this.progressService.getCurrentWeekProgress(
      req.user.userId,
      paginationDto,
    );
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: '获取指定账号的当前周进度' })
  @ApiParam({ name: 'accountId', description: '账号ID', type: 'string' })
  @ApiResponse({ status: 200, description: '成功获取账号进度' })
  @ApiResponse({ status: 404, description: '账号不存在' })
  @ApiResponse({ status: 403, description: '无权访问此账号' })
  async getAccountProgress(
    @Param('accountId') accountId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.progressService.getAccountProgress(accountId, req.user.userId);
  }

  @Post('dungeon')
  @ApiOperation({ summary: '更新副本进度' })
  @ApiBody({ type: UpdateDungeonProgressDto, description: '副本进度更新信息' })
  @ApiResponse({ status: 200, description: '成功更新副本进度' })
  @ApiResponse({ status: 404, description: '账号不存在' })
  @ApiResponse({ status: 403, description: '无权访问此账号' })
  async updateDungeonProgress(
    @Body() updateDungeonProgressDto: UpdateDungeonProgressDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.progressService.updateDungeonProgress(
      updateDungeonProgressDto,
      req.user.userId,
    );
  }

  @Post('weekly-task')
  @ApiOperation({ summary: '更新周常任务进度' })
  @ApiBody({ type: UpdateWeeklyTaskProgressDto, description: '周常任务进度更新信息' })
  @ApiResponse({ status: 200, description: '成功更新周常任务进度' })
  @ApiResponse({ status: 404, description: '账号不存在' })
  @ApiResponse({ status: 403, description: '无权访问此账号' })
  async updateWeeklyTaskProgress(
    @Body() updateWeeklyTaskProgressDto: UpdateWeeklyTaskProgressDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.progressService.updateWeeklyTaskProgress(
      updateWeeklyTaskProgressDto,
      req.user.userId,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: '获取进度统计信息' })
  @ApiResponse({ status: 200, description: '成功获取统计信息' })
  async getProgressStats(@Request() req: AuthenticatedRequest) {
    return this.progressService.getProgressStats(req.user.userId);
  }

  @Get('historical')
  @ApiOperation({ summary: '获取历史进度（支持分页）' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码，默认为1',
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: '每页数量，默认为10',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词（账号名称）',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: '总记录数' },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/WeeklyProgress' },
          description: '历史进度列表',
        },
        page: { type: 'number', description: '当前页码' },
        size: { type: 'number', description: '每页数量' },
        totalPages: { type: 'number', description: '总页数' },
      },
    },
  })
  async getHistoricalProgress(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<WeeklyProgress>> {
    return this.progressService.getHistoricalProgress(
      req.user.userId,
      paginationDto,
    );
  }

  // ========== 共享账号进度管理接口 ==========

  @Get('shared-account/:accountName')
  @ApiOperation({ summary: '获取指定共享账号的当前周进度' })
  @ApiParam({ name: 'accountName', description: '共享账号名称', type: 'string' })
  @ApiResponse({ status: 200, description: '成功获取共享账号进度' })
  @ApiResponse({ status: 404, description: '共享账号不存在' })
  @ApiResponse({ status: 403, description: '无权访问此共享账号' })
  async getSharedAccountProgress(
    @Param('accountName') accountName: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.progressService.getSharedAccountProgress(
      accountName,
      req.user.userId,
    );
  }

  @Post('shared-account/dungeon')
  @ApiOperation({ summary: '更新共享账号副本进度' })
  @ApiBody({ type: UpdateSharedDungeonProgressDto, description: '共享账号副本进度更新信息' })
  @ApiResponse({ status: 200, description: '成功更新共享账号副本进度' })
  @ApiResponse({ status: 404, description: '共享账号不存在' })
  @ApiResponse({ status: 403, description: '无权访问此共享账号' })
  async updateSharedDungeonProgress(
    @Body() updateSharedDungeonProgressDto: UpdateSharedDungeonProgressDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.progressService.updateSharedDungeonProgress(
      updateSharedDungeonProgressDto,
      req.user.userId,
    );
  }

  @Post('shared-account/weekly-task')
  @ApiOperation({ summary: '更新共享账号周常任务进度' })
  @ApiBody({ type: UpdateSharedWeeklyTaskProgressDto, description: '共享账号周常任务进度更新信息' })
  @ApiResponse({ status: 200, description: '成功更新共享账号周常任务进度' })
  @ApiResponse({ status: 404, description: '共享账号不存在' })
  @ApiResponse({ status: 403, description: '无权访问此共享账号' })
  async updateSharedWeeklyTaskProgress(
    @Body()
    updateSharedWeeklyTaskProgressDto: UpdateSharedWeeklyTaskProgressDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.progressService.updateSharedWeeklyTaskProgress(
      updateSharedWeeklyTaskProgressDto,
      req.user.userId,
    );
  }

  @Post('reset-weekly')
  @ApiOperation({
    summary: '重置周进度（管理员功能）',
    description: '此接口主要用于定时任务，手动调用需要管理员权限',
  })
  @ApiResponse({ status: 200, description: '成功重置周进度' })
  async resetWeeklyProgress() {
    await this.progressService.resetAllWeeklyProgress();
    return { message: '周进度重置成功' };
  }
}
