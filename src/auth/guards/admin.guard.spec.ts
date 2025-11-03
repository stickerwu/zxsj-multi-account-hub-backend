import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminGuard],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('应该允许管理员用户访问', async () => {
      const adminUser = {
        userId: 'admin-1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
      };

      const context = createMockExecutionContext(adminUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('应该拒绝普通用户访问', async () => {
      const normalUser = {
        userId: 'user-1',
        username: 'user',
        email: 'user@example.com',
        role: 'user',
      };

      const context = createMockExecutionContext(normalUser);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('需要管理员权限才能执行此操作'),
      );
    });

    it('应该拒绝没有角色的用户访问', async () => {
      const userWithoutRole = {
        userId: 'user-1',
        username: 'user',
        email: 'user@example.com',
        // role 字段缺失
      };

      const context = createMockExecutionContext(userWithoutRole);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('需要管理员权限才能执行此操作'),
      );
    });

    it('应该拒绝没有用户信息的请求', async () => {
      const context = createMockExecutionContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('用户信息不存在，请确保使用JwtAuthGuard'),
      );
    });

    it('应该拒绝用户信息为 undefined 的请求', async () => {
      const context = createMockExecutionContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('用户信息不存在，请确保使用JwtAuthGuard'),
      );
    });

    it('应该拒绝角色为其他值的用户', async () => {
      const userWithOtherRole = {
        userId: 'user-1',
        username: 'user',
        email: 'user@example.com',
        role: 'moderator',
      };

      const context = createMockExecutionContext(userWithOtherRole);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('需要管理员权限才能执行此操作'),
      );
    });
  });
});
