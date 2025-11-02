import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        id: '1',
        ...registerDto,
        password: 'hashedPassword',
      });
      mockUserRepository.save.mockResolvedValue({
        id: '1',
        ...registerDto,
        password: 'hashedPassword',
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Mock bcrypt.hash
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
        },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [{ username: 'testuser' }, { email: 'test@example.com' }],
      });
    });

    it('当用户名已存在时应该抛出 ConflictException', async () => {
      const registerDto = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        username: 'existinguser',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('应该成功登录用户', () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const user = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Mock bcrypt.compare
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = service.login(loginDto);

      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
        },
      });
    });

    it('当用户不存在时应该抛出 UnauthorizedException', async () => {
      const loginDto = {
        username: 'nonexistent',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('当密码错误时应该抛出 UnauthorizedException', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const user = {
        id: '1',
        username: 'testuser',
        password: 'hashedPassword',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('应该返回用户信息（不包含密码）', async () => {
      const user = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser('1');

      expect(result).toEqual({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('当用户不存在时应该返回 null', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('999');

      expect(result).toBeNull();
    });
  });
});
