import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { User } from '../entities/user.entity';
import { UserListDto } from './dto/user-list.dto';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = req.user;
    return {
      code: 200,
      message: '获取成功',
      data: userWithoutPassword,
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
    name: 'limit',
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
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async findAllUsers(@Query() userListDto: UserListDto) {
    const result = await this.authService.findUsersWithPagination(userListDto);
    return {
      code: 200,
      message: '获取成功',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }
}
