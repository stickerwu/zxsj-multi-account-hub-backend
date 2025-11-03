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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountListDto } from './dto/account-list.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
// 定义认证后的请求接口
interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
  };
}

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
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    const account = await this.accountsService.create(
      req.user.userId,
      createAccountDto,
    );
    return {
      code: 201,
      message: '账号创建成功',
      data: {
        ...account,
        id: account.accountId, // 为了兼容测试脚本，同时提供id字段
      },
    };
  }

  @Get()
  @ApiOperation({ summary: '分页获取当前用户的账号列表（包含用户信息）' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码，默认为1',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页数量，默认为10',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词（账号名称）',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: '是否激活',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '获取成功' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AccountWithUserDto' },
          description: '账号列表',
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', description: '总记录数' },
            page: { type: 'number', description: '当前页码' },
            limit: { type: 'number', description: '每页数量' },
            totalPages: { type: 'number', description: '总页数' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() accountListDto: AccountListDto,
  ) {
    const result = await this.accountsService.findAccountsWithPaginationByUser(
      req.user.userId,
      accountListDto,
    );
    return {
      code: 200,
      message: '获取成功',
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.size,
        totalPages: Math.ceil(result.total / result.size),
      },
    };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: '分页获取所有账号列表（管理员专用）' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码，默认为1',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页数量，默认为10',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词（账号名、用户名、邮箱）',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: '是否激活',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '获取成功' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AccountWithUserDto' },
          description: '账号列表',
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', description: '总记录数' },
            page: { type: 'number', description: '当前页码' },
            limit: { type: 'number', description: '每页数量' },
            totalPages: { type: 'number', description: '总页数' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async findAllForAdmin(@Query() accountListDto: AccountListDto) {
    const result =
      await this.accountsService.findAllAccountsWithPagination(accountListDto);
    return {
      code: 200,
      message: '获取成功',
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.size,
        totalPages: Math.ceil(result.total / result.size),
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: '获取账号统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getStats(@Request() req: AuthenticatedRequest) {
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
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
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
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const account = await this.accountsService.update(
      id,
      req.user.userId,
      updateAccountDto,
    );
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
  async toggleActive(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const account = await this.accountsService.toggleActive(
      id,
      req.user.userId,
    );
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
    @Request() req: AuthenticatedRequest,
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
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    await this.accountsService.remove(id, req.user.userId);
    return {
      code: 200,
      message: '删除成功',
    };
  }
}
