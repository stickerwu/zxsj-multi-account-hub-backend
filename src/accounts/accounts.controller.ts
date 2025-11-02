import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('账号管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: '创建新账号' })
  @ApiResponse({ status: 201, description: '账号创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(@Request() req, @Body() createAccountDto: CreateAccountDto) {
    const account = await this.accountsService.create(req.user.userId, createAccountDto);
    return {
      code: 200,
      message: '账号创建成功',
      data: account,
    };
  }

  @Get()
  @ApiOperation({ summary: '获取当前用户的所有账号' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@Request() req) {
    const accounts = await this.accountsService.findAllByUser(req.user.userId);
    return {
      code: 200,
      message: '获取成功',
      data: accounts,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: '获取账号统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getStats(@Request() req) {
    const [allAccounts, activeCount] = await Promise.all([
      this.accountsService.findAllByUser(req.user.userId),
      this.accountsService.getActiveAccountCount(req.user.userId),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        totalCount: allAccounts.length,
        activeCount,
        inactiveCount: allAccounts.length - activeCount,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定账号详情' })
  @ApiParam({ name: 'id', description: '账号ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '账号不存在' })
  @ApiResponse({ status: 403, description: '无权访问' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findOne(@Param('id') id: string, @Request() req) {
    const account = await this.accountsService.findOne(id, req.user.userId);
    return {
      code: 200,
      message: '获取成功',
      data: account,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新账号信息' })
  @ApiParam({ name: 'id', description: '账号ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '账号不存在' })
  @ApiResponse({ status: 403, description: '无权访问' })
  @ApiResponse({ status: 401, description: '未授权' })
  async update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto, @Request() req) {
    const account = await this.accountsService.update(id, req.user.userId, updateAccountDto);
    return {
      code: 200,
      message: '更新成功',
      data: account,
    };
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: '切换账号激活状态' })
  @ApiParam({ name: 'id', description: '账号ID' })
  @ApiResponse({ status: 200, description: '状态切换成功' })
  @ApiResponse({ status: 404, description: '账号不存在' })
  @ApiResponse({ status: 403, description: '无权访问' })
  @ApiResponse({ status: 401, description: '未授权' })
  async toggleActive(@Param('id') id: string, @Request() req) {
    const account = await this.accountsService.toggleActive(id, req.user.userId);
    return {
      code: 200,
      message: '状态切换成功',
      data: account,
    };
  }

  @Post('batch-update-status')
  @ApiOperation({ summary: '批量更新账号状态' })
  @ApiResponse({ status: 200, description: '批量更新成功' })
  @ApiResponse({ status: 404, description: '部分账号不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async batchUpdateStatus(
    @Body() body: { accountIds: string[]; isActive: boolean },
    @Request() req,
  ) {
    const accounts = await this.accountsService.batchUpdateStatus(
      body.accountIds,
      req.user.userId,
      body.isActive,
    );
    return {
      code: 200,
      message: '批量更新成功',
      data: accounts,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除账号' })
  @ApiParam({ name: 'id', description: '账号ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '账号不存在' })
  @ApiResponse({ status: 403, description: '无权访问' })
  @ApiResponse({ status: 401, description: '未授权' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.accountsService.remove(id, req.user.userId);
    return {
      code: 200,
      message: '删除成功',
    };
  }
}