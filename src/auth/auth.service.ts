import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; token: string }> {
    const { username, email, phone, password } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: [
        { username },
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('用户名已存在');
      }
      if (existingUser.email === email) {
        throw new ConflictException('邮箱已被注册');
      }
      if (existingUser.phone === phone) {
        throw new ConflictException('手机号已被注册');
      }
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建新用户
    const newUser = this.userRepository.create({
      userId: uuidv4(),
      username,
      email,
      phone,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(newUser);

    // 生成 JWT token
    const payload: JwtPayload = {
      sub: savedUser.userId,
      username: savedUser.username,
    };
    const token = this.jwtService.sign(payload);

    // 返回用户信息（不包含密码）
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * 用户登录验证
   */
  async validateUser(credential: string, password: string): Promise<User | null> {
    // 根据用户名、邮箱或手机号查找用户
    const user = await this.userRepository.findOne({
      where: [
        { username: credential },
        { email: credential },
        { phone: credential },
      ],
    });

    if (!user) {
      return null;
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * 用户登录
   */
  async login(user: User): Promise<{ user: Partial<User>; token: string }> {
    const payload: JwtPayload = {
      sub: user.userId,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);

    // 返回用户信息（不包含密码）
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * 根据用户ID获取用户信息
   */
  async findUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { userId },
    });
  }
}