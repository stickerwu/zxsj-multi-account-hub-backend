import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({
    description: '账号名称',
    example: 'my_game_account',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1, { message: '账号名称不能为空' })
  @MaxLength(100, { message: '账号名称不能超过100个字符' })
  accountName: string; // 统一使用accountName字段名

  @ApiPropertyOptional({
    description: '是否激活',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
