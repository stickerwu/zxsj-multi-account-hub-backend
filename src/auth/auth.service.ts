import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserListDto, UserResponseDto } from './dto/user-list.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Partial<User>; token: string }> {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * 用户登录验证
   */
  async validateUser(
    credential: string,
    password: string,
  ): Promise<User | null> {
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
  login(user: User): { user: Partial<User>; token: string } {
    const payload: JwtPayload = {
      sub: user.userId,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);

    // 返回用户信息（不包含密码）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
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

  /**
   * 分页查询用户列表（管理员专用）
   */
  async findUsersWithPagination(
    userListDto: UserListDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const { page = 1, size = 10, search, role } = userListDto;
    const skip = (page - 1) * size;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // 搜索条件
    if (search) {
      queryBuilder.where(
        '(user.username LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 角色筛选
    if (role) {
      if (search) {
        queryBuilder.andWhere('user.role = :role', { role });
      } else {
        queryBuilder.where('user.role = :role', { role });
      }
    }

    // 排序
    queryBuilder.orderBy('user.createdAt', 'DESC');

    // 分页
    queryBuilder.skip(skip).take(size);

    const [users, total] = await queryBuilder.getManyAndCount();

    // 转换为响应DTO，排除密码字段
    const userResponseDtos: UserResponseDto[] = users.map((user) => ({
      userId: user.userId,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return new PaginatedResponse(userResponseDtos, total, page, size);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new ConflictException('用户不存在');
    }

    const { username, email, phone } = dto;

    if (username) {
      const exist = await this.userRepository.findOne({ where: { username } });
      if (exist && exist.userId !== userId) {
        throw new ConflictException('用户名已存在');
      }
      user.username = username;
    }

    if (email) {
      const exist = await this.userRepository.findOne({ where: { email } });
      if (exist && exist.userId !== userId) {
        throw new ConflictException('邮箱已被注册');
      }
      user.email = email;
    }

    if (phone) {
      const exist = await this.userRepository.findOne({ where: { phone } });
      if (exist && exist.userId !== userId) {
        throw new ConflictException('手机号已被注册');
      }
      user.phone = phone;
    }

    const saved = await this.userRepository.save(user);
    const { passwordHash, ...sanitized } = saved as any;
    return sanitized;
  }
}
