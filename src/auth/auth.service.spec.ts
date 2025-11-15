jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn(async () => 'hashed') }));
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

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

describe('AuthService core', () => {
  let service: AuthService;
  let repo: jest.Mocked<Repository<User>>;
  let jwt: JwtService;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;
    jwt = { sign: jest.fn(() => 'signed-jwt') } as any as JwtService;
    service = new AuthService(repo as any, jwt);
    // compare is provided by jest.mock above
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('register success', async () => {
    repo.findOne.mockResolvedValueOnce(null as any);
    repo.create.mockReturnValueOnce({ username: 'u', email: 'e', phone: 'p', passwordHash: 'x' } as any);
    const saved = { userId: 'id1', username: 'u', email: 'e', phone: 'p', passwordHash: 'hash' } as any;
    repo.save.mockResolvedValueOnce(saved as User);
    const res = await service.register({ username: 'u', email: 'e', phone: 'p', password: 'pw' } as any);
    expect(res.user.userId).toBe('id1');
    expect(res.token).toBe('signed-jwt');
  });

  it('validateUser ok', async () => {
    const user = { passwordHash: 'hash' } as any;
    repo.findOne.mockResolvedValueOnce(user as User);
    (bcrypt.compare as any).mockResolvedValueOnce(true as any);
    const res = await service.validateUser('cred', 'pw');
    expect(res).toBeTruthy();
  });

  it('validateUser wrong password returns null', async () => {
    const user = { passwordHash: 'hash' } as any;
    repo.findOne.mockResolvedValueOnce(user as User);
    (bcrypt.compare as any).mockResolvedValueOnce(false as any);
    const res = await service.validateUser('cred', 'pw');
    expect(res).toBeNull();
  });

  it('login returns user and token', () => {
    const user = { userId: 'id1', username: 'u', passwordHash: 'hash' } as any;
    const res = service.login(user as any);
    expect(res.user.userId).toBe('id1');
    expect(res.token).toBe('signed-jwt');
  });

  it('findUserById returns null when not found', async () => {
    repo.findOne.mockResolvedValueOnce(null as any);
    const res = await service.findUserById('nope');
    expect(res).toBeNull();
  });

  it('findUsersWithPagination returns list', async () => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValueOnce([
        [
          {
            userId: 'id1',
            username: 'u1',
            email: 'e1',
            phone: 'p1',
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        1,
      ]),
    };
    (repo.createQueryBuilder as any).mockReturnValueOnce(qb);
    const res = await service.findUsersWithPagination({ page: 1, size: 10 } as any);
    expect(res.total).toBe(1);
    expect(res.items[0].username).toBe('u1');
    expect(qb.orderBy).toHaveBeenCalled();
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);
  });
});
