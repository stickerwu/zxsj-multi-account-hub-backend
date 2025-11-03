import { Test, TestingModule } from '@nestjs/testing';
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalAuthGuard],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
  });

  it('应该被定义', () => {
    expect(guard).toBeDefined();
  });

  it('应该继承自 AuthGuard', () => {
    expect(guard).toBeInstanceOf(LocalAuthGuard);
  });
});
