import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class AccountListDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '账号状态筛选',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: '账号状态必须是布尔值' })
  isActive?: boolean;
}

export class AccountWithUserDto {
  accountId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    userId: string;
    username: string;
    email?: string;
    phone?: string;
    role: 'admin' | 'user';
  };
}
