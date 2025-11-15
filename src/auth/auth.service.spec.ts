import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('AuthService.updateProfile', () => {
  let service: AuthService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;
    const jwt = { sign: jest.fn() } as any as JwtService;
    service = new AuthService(repo as any, jwt);
  });

  it('updates email successfully', async () => {
    const userId = 'u1';
    const current: Partial<User> = {
      userId,
      username: 'a',
      email: null,
      phone: null,
    } as any;
    repo.findOne.mockResolvedValueOnce(current as User); // find by id
    repo.findOne.mockResolvedValueOnce(null as any); // check email duplicate
    const saved = { ...current, email: 'test@example.com' } as any;
    repo.save.mockResolvedValueOnce(saved as User);
    const result = await service.updateProfile(userId, {
      email: 'test@example.com',
    });
    expect(result.email).toBe('test@example.com');
  });

  it('throws conflict when email taken by another', async () => {
    const userId = 'u1';
    const current: Partial<User> = { userId, username: 'a' } as any;
    repo.findOne.mockResolvedValueOnce(current as User);
    const other: Partial<User> = {
      userId: 'u2',
      email: 'dup@example.com',
    } as any;
    repo.findOne.mockResolvedValueOnce(other as User);
    await expect(
      service.updateProfile(userId, { email: 'dup@example.com' }),
    ).rejects.toThrow('邮箱已被注册');
  });
});
