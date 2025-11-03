import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SharedAccountsService } from '../services/shared-accounts.service';
import { SharedAccountPermissionService } from '../services/shared-account-permission.service';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../common/dto/pagination.dto';
import { PermissionAction } from '../types/permission.types';
import {
  CreateSharedAccountDto,
  UpdateSharedAccountDto,
  AddUserToAccountDto,
  UpdateUserPermissionsDto,
  SharedAccountResponseDto,
  SharedAccountDetailResponseDto,
  UserRelationResponseDto,
  PermissionCheckResponseDto,
} from '../dto';

/**
 * 共享账号控制器
 * 提供共享账号管理的 REST API 接口
 */
@ApiTags('共享账号管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shared-accounts')
export class SharedAccountsController {
  constructor(
    private readonly sharedAccountsService: SharedAccountsService,
    private readonly permissionService: SharedAccountPermissionService,
  ) {}

  /**
   * 创建共享账号
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建共享账号' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '共享账号创建成功',
    type: SharedAccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '账号名已存在',
  })
  async createSharedAccount(
    @Body() createDto: CreateSharedAccountDto,
    @Request() req: any,
  ): Promise<SharedAccountResponseDto> {
    const userId = req.user.userId;
    const account = await this.sharedAccountsService.createSharedAccount(
      createDto,
      userId,
    );

    return {
      accountName: account.accountName,
      displayName: account.displayName,
      serverName: account.serverName,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  /**
   * 获取用户可访问的共享账号列表（支持分页）
   */
  @Get()
  @ApiOperation({ summary: '获取用户可访问的共享账号列表（支持分页）' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码，从1开始',
    example: 1,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: '每页数量，最大100',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词（账号名、显示名、服务器名）',
    example: 'team',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: '是否包含非活跃账号',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: '总记录数' },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/SharedAccountResponseDto' },
          description: '当前页数据列表',
        },
        page: { type: 'number', description: '当前页码' },
        size: { type: 'number', description: '每页数量' },
        totalPages: { type: 'number', description: '总页数' },
      },
    },
  })
  async getUserAccessibleAccounts(
    @Request() req: any,
    @Query() paginationDto: PaginationDto,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<PaginatedResponse<SharedAccountResponseDto>> {
    const userId = req.user.userId;
    const result = await this.sharedAccountsService.getUserAccessibleAccounts(
      userId,
      paginationDto,
      includeInactive || false,
    );

    // 转换为响应DTO格式
    const items = result.items.map((account) => ({
      accountName: account.accountName,
      displayName: account.displayName,
      serverName: account.serverName,
      isActive: account.isActive,
      userCount: account.userCount,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));

    return new PaginatedResponse(items, result.total, result.page, result.size);
  }

  /**
   * 获取共享账号详情
   */
  @Get(':accountName')
  @ApiOperation({ summary: '获取共享账号详情' })
  @ApiParam({
    name: 'accountName',
    description: '共享账号名称',
    example: 'team_account_001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    type: SharedAccountDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '共享账号不存在',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '没有权限访问此共享账号',
  })
  async getSharedAccountDetail(
    @Param('accountName') accountName: string,
    @Request() req: any,
  ): Promise<SharedAccountDetailResponseDto> {
    const userId = req.user.userId;
    const account = await this.sharedAccountsService.getSharedAccountDetail(
      accountName,
      userId,
    );

    return {
      accountName: account.accountName,
      displayName: account.displayName,
      serverName: account.serverName,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      userCount: account.userCount,
      userRelations: account.userRelations?.map((relation) => ({
        id: relation.id,
        userId: relation.userId,
        username: relation.user?.username,
        relationType: relation.relationType,
        permissions: relation.permissions,
        joinedAt: relation.joinedAt,
      })),
    };
  }

  /**
   * 更新共享账号信息
   */
  @Put(':accountName')
  @ApiOperation({ summary: '更新共享账号信息' })
  @ApiParam({
    name: 'accountName',
    description: '共享账号名称',
    example: 'team_account_001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    type: SharedAccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '共享账号不存在',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '没有权限修改此共享账号',
  })
  async updateSharedAccount(
    @Param('accountName') accountName: string,
    @Body() updateDto: UpdateSharedAccountDto,
    @Request() req: any,
  ): Promise<SharedAccountResponseDto> {
    const userId = req.user.userId;
    const account = await this.sharedAccountsService.updateSharedAccount(
      accountName,
      updateDto,
      userId,
    );

    return {
      accountName: account.accountName,
      displayName: account.displayName,
      serverName: account.serverName,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  /**
   * 删除共享账号
   */
  @Delete(':accountName')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除共享账号' })
  @ApiParam({
    name: 'accountName',
    description: '共享账号名称',
    example: 'team_account_001',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '删除成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '共享账号不存在',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '没有权限删除此共享账号',
  })
  async deleteSharedAccount(
    @Param('accountName') accountName: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user.userId;
    await this.sharedAccountsService.deleteSharedAccount(accountName, userId);
  }

  /**
   * 添加用户到共享账号
   */
  @Post(':accountName/users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '添加用户到共享账号' })
  @ApiParam({
    name: 'accountName',
    description: '共享账号名称',
    example: 'team_account_001',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '用户添加成功',
    type: UserRelationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '共享账号不存在',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '用户已经关联到此共享账号',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '只有所有者可以添加用户',
  })
  async addUserToAccount(
    @Param('accountName') accountName: string,
    @Body() addUserDto: AddUserToAccountDto,
    @Request() req: any,
  ): Promise<UserRelationResponseDto> {
    const operatorUserId = req.user.userId;
    const relation = await this.sharedAccountsService.addUserToAccount(
      accountName,
      addUserDto,
      operatorUserId,
    );

    return {
      id: relation.id,
      userId: relation.userId,
      relationType: relation.relationType,
      permissions: relation.permissions,
      joinedAt: relation.joinedAt,
    };
  }

  /**
   * 从共享账号移除用户
   */
  @Delete(':accountName/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '从共享账号移除用户' })
  @ApiParam({
    name: 'accountName',
    description: '共享账号名称',
    example: 'team_account_001',
  })
  @ApiParam({
    name: 'userId',
    description: '要移除的用户ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '用户移除成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '用户未关联到此共享账号',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '没有权限移除用户',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '不能移除最后一个所有者',
  })
  async removeUserFromAccount(
    @Param('accountName') accountName: string,
    @Param('userId') targetUserId: string,
    @Request() req: any,
  ): Promise<void> {
    const operatorUserId = req.user.userId;
    await this.sharedAccountsService.removeUserFromAccount(
      accountName,
      targetUserId,
      operatorUserId,
    );
  }

  /**
   * 更新用户在共享账号中的权限
   */
  @Put(':accountName/users/:userId/permissions')
  @ApiOperation({ summary: '更新用户权限' })
  @ApiParam({
    name: 'accountName',
    description: '共享账号名称',
    example: 'team_account_001',
  })
  @ApiParam({
    name: 'userId',
    description: '目标用户ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '权限更新成功',
    type: UserRelationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '用户未关联到此共享账号',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '只有所有者可以修改用户权限',
  })
  async updateUserPermissions(
    @Param('accountName') accountName: string,
    @Param('userId') targetUserId: string,
    @Body() updateDto: UpdateUserPermissionsDto,
    @Request() req: any,
  ): Promise<UserRelationResponseDto> {
    const operatorUserId = req.user.userId;
    const relation = await this.sharedAccountsService.updateUserPermissions(
      accountName,
      targetUserId,
      updateDto,
      operatorUserId,
    );

    return {
      id: relation.id,
      userId: relation.userId,
      relationType: relation.relationType,
      permissions: relation.permissions,
      joinedAt: relation.joinedAt,
    };
  }

  /**
   * 获取共享账号的用户列表（支持分页）
   */
  @Get(':accountName/users')
  @ApiOperation({ summary: '获取共享账号的用户列表（支持分页）' })
  @ApiParam({
    name: 'accountName',
    description: '共享账号名称',
    example: 'team_account_001',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码，从1开始',
    example: 1,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: '每页数量，最大100',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词（用户ID或用户名）',
    example: 'admin',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: '总记录数' },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserRelationResponseDto' },
          description: '当前页数据列表',
        },
        page: { type: 'number', description: '当前页码' },
        size: { type: 'number', description: '每页数量' },
        totalPages: { type: 'number', description: '总页数' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '没有权限查看用户列表',
  })
  async getAccountUsers(
    @Param('accountName') accountName: string,
    @Request() req: any,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<UserRelationResponseDto>> {
    const userId = req.user.userId;
    const result = await this.sharedAccountsService.getAccountUsers(
      accountName,
      userId,
      paginationDto,
    );

    // 转换为响应DTO格式
    const items = result.items.map((relation) => ({
      id: relation.id,
      userId: relation.userId,
      username: relation.user?.username,
      relationType: relation.relationType,
      permissions: relation.permissions,
      joinedAt: relation.joinedAt,
    }));

    return new PaginatedResponse(items, result.total, result.page, result.size);
  }

  /**
   * 检查用户对共享账号的权限
   */
  @Get(':accountName/permissions/:action')
  @ApiOperation({ summary: '检查用户权限' })
  @ApiParam({
    name: 'accountName',
    description: '共享账号名称',
    example: 'team_account_001',
  })
  @ApiParam({
    name: 'action',
    description: '操作类型',
    enum: PermissionAction,
    example: PermissionAction.WRITE,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '权限检查完成',
    type: PermissionCheckResponseDto,
  })
  async checkPermission(
    @Param('accountName') accountName: string,
    @Param('action') action: PermissionAction,
    @Request() req: any,
  ): Promise<PermissionCheckResponseDto> {
    const userId = req.user.userId;
    const result = await this.permissionService.checkPermission(
      userId,
      accountName,
      action,
    );

    return {
      hasPermission: result.hasPermission,
      relationType: result.relationType,
      permissions: result.permissions,
      reason: result.reason,
    };
  }

  /**
   * 获取用户对共享账号的所有权限信息
   */
  @Get(':accountName/permissions')
  @ApiOperation({ summary: '获取用户权限信息' })
  @ApiParam({
    name: 'accountName',
    description: '共享账号名称',
    example: 'team_account_001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    type: PermissionCheckResponseDto,
  })
  async getUserPermissions(
    @Param('accountName') accountName: string,
    @Request() req: any,
  ): Promise<PermissionCheckResponseDto> {
    const userId = req.user.userId;
    const result = await this.permissionService.getUserPermissions(
      userId,
      accountName,
    );

    return {
      hasPermission: result.hasPermission,
      relationType: result.relationType,
      permissions: result.permissions,
      reason: result.reason,
    };
  }
}
