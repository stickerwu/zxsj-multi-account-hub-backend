import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3, { message: '用户名至少需要3个字符' })
  @MaxLength(50, { message: '用户名不能超过50个字符' })
  username: string;

  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;

  @ApiPropertyOptional({
    description: '手机号码',
    example: '13800138000',
    minLength: 11,
    maxLength: 11,
  })
  @IsOptional()
  @IsString()
  @MinLength(11, { message: '请输入有效的手机号码' })
  @MaxLength(11, { message: '请输入有效的手机号码' })
  phone?: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  @MaxLength(100, { message: '密码不能超过100个字符' })
  password: string;
}
