import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1, { message: '登录凭证不能为空' })
  credential: string; // 可以是用户名、邮箱或手机号

  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;
}
