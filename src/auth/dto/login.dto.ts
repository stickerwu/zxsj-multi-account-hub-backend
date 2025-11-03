import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '登录凭证（用户名、邮箱或手机号）',
    example: 'john_doe',
  })
  @IsString()
  @MinLength(1, { message: '登录凭证不能为空' })
  credential: string; // 可以是用户名、邮箱或手机号

  @ApiProperty({
    description: '密码',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;
}
