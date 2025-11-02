import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// 定义用户接口
interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

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
      code: 200,
      message: '注册成功',
      data: result,
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
      data: result,
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
}
