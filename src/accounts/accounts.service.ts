import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Account } from '../entities/account.entity';
import { User } from '../entities/user.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountListDto, AccountWithUserDto } from './dto/account-list.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 创建新账号
   */
  async create(
    userId: string,
    createAccountDto: CreateAccountDto,
  ): Promise<Account> {
    // 验证用户是否存在
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const account = this.accountRepository.create({
      accountId: uuidv4(),
      userId,
      name: createAccountDto.accountName, // 使用accountName字段
      isActive: createAccountDto.isActive ?? true,
    });

    return this.accountRepository.save(account);
  }

  /**
   * 获取用户的所有账号
   */
  async findAllByUser(userId: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 分页获取用户的账号列表（包含用户信息）
   */
  async findAccountsWithPaginationByUser(
    userId: string,
    accountListDto: AccountListDto,
  ): Promise<PaginatedResponse<AccountWithUserDto>> {
    const { page = 1, limit = 10, search, isActive } = accountListDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.user', 'user')
      .where('account.userId = :userId', { userId });

    // 搜索条件
    if (search) {
      queryBuilder.andWhere('account.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    // 状态筛选
    if (isActive !== undefined) {
      queryBuilder.andWhere('account.isActive = :isActive', { isActive });
    }

    // 排序
    queryBuilder.orderBy('account.createdAt', 'DESC');

    // 分页
    queryBuilder.skip(skip).take(limit);

    const [accounts, total] = await queryBuilder.getManyAndCount();

    // 转换为响应DTO
    const accountWithUserDtos: AccountWithUserDto[] = accounts.map(
      (account) => ({
        accountId: account.accountId,
        name: account.name,
        isActive: account.isActive,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        user: {
          userId: account.user.userId,
          username: account.user.username,
          email: account.user.email,
          phone: account.user.phone,
          role: account.user.role,
        },
      }),
    );

    return new PaginatedResponse(accountWithUserDtos, total, page, limit);
  }

  /**
   * 根据账号ID获取账号详情
   */
  async findOne(accountId: string, userId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { accountId },
      relations: ['user'],
    });

    if (!account) {
      throw new NotFoundException('账号不存在');
    }

    // 数据隔离：确保用户只能访问自己的账号
    if (account.userId !== userId) {
      throw new ForbiddenException('无权访问此账号');
    }

    return account;
  }

  /**
   * 更新账号信息
   */
  async update(
    accountId: string,
    userId: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    const account = await this.findOne(accountId, userId);

    // 更新账号信息
    Object.assign(account, updateAccountDto);
    account.updatedAt = new Date();

    return this.accountRepository.save(account);
  }

  /**
   * 删除账号
   */
  async remove(accountId: string, userId: string): Promise<void> {
    const account = await this.findOne(accountId, userId);
    await this.accountRepository.remove(account);
  }

  /**
   * 切换账号激活状态
   */
  async toggleActive(accountId: string, userId: string): Promise<Account> {
    const account = await this.findOne(accountId, userId);
    account.isActive = !account.isActive;
    account.updatedAt = new Date();

    return this.accountRepository.save(account);
  }

  /**
   * 获取用户的激活账号数量
   */
  async getActiveAccountCount(userId: string): Promise<number> {
    return this.accountRepository.count({
      where: { userId, isActive: true },
    });
  }

  /**
   * 批量更新账号状态
   */
  async batchUpdateStatus(
    accountIds: string[],
    userId: string,
    isActive: boolean,
  ): Promise<Account[]> {
    const accounts = await this.accountRepository.find({
      where: { accountId: In(accountIds), userId },
    });

    if (accounts.length !== accountIds.length) {
      throw new NotFoundException('部分账号不存在或无权访问');
    }

    // 批量更新状态
    accounts.forEach((account) => {
      account.isActive = isActive;
      account.updatedAt = new Date();
    });

    return this.accountRepository.save(accounts);
  }

  /**
   * 分页获取所有账号列表（管理员专用）
   */
  async findAllAccountsWithPagination(
    accountListDto: AccountListDto,
  ): Promise<PaginatedResponse<AccountWithUserDto>> {
    const { page = 1, limit = 10, search, isActive } = accountListDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.user', 'user');

    // 搜索条件
    if (search) {
      queryBuilder.where(
        '(account.name LIKE :search OR user.username LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 状态筛选
    if (isActive !== undefined) {
      if (search) {
        queryBuilder.andWhere('account.isActive = :isActive', { isActive });
      } else {
        queryBuilder.where('account.isActive = :isActive', { isActive });
      }
    }

    // 排序
    queryBuilder.orderBy('account.createdAt', 'DESC');

    // 分页
    queryBuilder.skip(skip).take(limit);

    const [accounts, total] = await queryBuilder.getManyAndCount();

    // 转换为响应DTO
    const accountWithUserDtos: AccountWithUserDto[] = accounts.map(
      (account) => ({
        accountId: account.accountId,
        name: account.name,
        isActive: account.isActive,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        user: {
          userId: account.user.userId,
          username: account.user.username,
          email: account.user.email,
          phone: account.user.phone,
          role: account.user.role,
        },
      }),
    );

    return new PaginatedResponse(accountWithUserDtos, total, page, limit);
  }
}
