import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * 管理员权限守卫
 * 验证用户是否具有管理员权限
 * 注意：此守卫应该与JwtAuthGuard一起使用
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 假设JwtAuthGuard已经验证了用户并将用户信息添加到request.user中
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户信息不存在，请确保使用JwtAuthGuard');
    }

    // 检查用户是否为管理员
    if (user.role !== 'admin') {
      throw new ForbiddenException('需要管理员权限才能执行此操作');
    }

    return true;
  }
}
