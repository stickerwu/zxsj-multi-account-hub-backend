import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('定时任务管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('info')
  @ApiOperation({ summary: '获取定时任务信息' })
  @ApiResponse({ status: 200, description: '成功获取定时任务信息' })
  getSchedulerInfo() {
    return this.schedulerService.getSchedulerInfo();
  }

  @Post('manual-reset')
  @ApiOperation({
    summary: '手动触发周进度重置',
    description: '手动执行周进度重置任务，通常用于测试或紧急情况',
  })
  @ApiResponse({ status: 200, description: '成功执行手动重置' })
  @ApiResponse({ status: 500, description: '重置失败' })
  async manualResetWeeklyProgress() {
    return this.schedulerService.manualResetWeeklyProgress();
  }
}
