import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('应该被定义', () => {
    expect(guard).toBeDefined();
  });

  it('应该继承自 AuthGuard', () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });
});
