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
} from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateDungeonProgressDto } from './dto/update-dungeon-progress.dto';
import { UpdateWeeklyTaskProgressDto } from './dto/update-weekly-task-progress.dto';

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
  @ApiOperation({ summary: '获取当前周所有账号进度' })
  @ApiResponse({ status: 200, description: '成功获取当前周进度' })
  async getCurrentWeekProgress(@Request() req: AuthenticatedRequest) {
    return this.progressService.getCurrentWeekProgress(req.user.userId);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: '获取指定账号的当前周进度' })
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
  @ApiOperation({ summary: '获取历史周进度' })
  @ApiResponse({ status: 200, description: '成功获取历史进度' })
  async getHistoricalProgress(
    @Query('weeks') weeks: number = 4,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.progressService.getHistoricalProgress(req.user.userId, weeks);
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
