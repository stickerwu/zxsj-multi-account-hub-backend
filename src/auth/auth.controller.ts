import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { User } from '../entities/user.entity';
import { UserListDto } from './dto/user-list.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

// 定义认证后的请求接口
interface AuthenticatedRequest {
  user: User;
}

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: RegisterDto, description: '用户注册信息' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 409, description: '用户名、邮箱或手机号已存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      code: 201,
      message: '注册成功',
      data: {
        ...result,
        access_token: result.token, // 为了兼容测试脚本，同时提供access_token字段
        id: result.user.userId, // 为了兼容测试脚本，同时提供id字段
      },
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: LoginDto, description: '用户登录凭证' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '登录凭证或密码错误' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  login(@Request() req: AuthenticatedRequest) {
    const result = this.authService.login(req.user);
    return {
      code: 200,
      message: '登录成功',
      data: {
        ...result,
        access_token: result.token, // 为了兼容测试脚本，同时提供access_token字段
        id: result.user.userId, // 为了兼容测试脚本，同时提供id字段
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  getProfile(@Request() req: AuthenticatedRequest) {
    const { userId, username, email, phone, role, createdAt, updatedAt } =
      req.user;
    return {
      code: 200,
      message: '获取成功',
      data: { userId, username, email, phone, role, createdAt, updatedAt },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新当前用户信息' })
  @ApiBody({ type: UpdateProfileDto, description: '可修改的用户信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.authService.updateProfile(req.user.userId, dto);
    return {
      code: 200,
      message: '更新成功',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  logout() {
    // JWT 是无状态的，客户端删除 token 即可实现登出
    // 这里可以添加黑名单逻辑或其他业务逻辑
    return {
      code: 200,
      message: '登出成功',
    };
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '分页获取所有用户列表（管理员专用）' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({
    name: 'size',
    required: false,
    description: '每页数量',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '搜索关键词（用户名、邮箱）',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: '角色筛选',
    enum: ['admin', 'user'],
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
          items: { $ref: '#/components/schemas/UserResponseDto' },
          description: '用户列表',
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
  async findAllUsers(
    @Query() userListDto: UserListDto,
    @Query('limit') limit?: number,
  ) {
    if (limit) {
      (userListDto as any).size = Number(limit);
    }
    const result = await this.authService.findUsersWithPagination(userListDto);
    return {
      code: 200,
      message: '获取成功',
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: Math.ceil(result.total / result.size),
      },
    };
  }
}
