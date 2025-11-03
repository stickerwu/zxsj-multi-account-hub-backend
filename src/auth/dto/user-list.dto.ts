import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

export class UserListDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '用户角色筛选',
    enum: ['admin', 'user'],
    example: 'user',
  })
  @IsOptional()
  @IsEnum(['admin', 'user'], { message: '角色必须是admin或user' })
  role?: 'admin' | 'user';
}

export class UserResponseDto {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}
