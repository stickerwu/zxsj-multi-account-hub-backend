import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: '用户名至少需要3个字符' })
  @MaxLength(50, { message: '用户名不能超过50个字符' })
  username: string;

  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(11, { message: '请输入有效的手机号码' })
  @MaxLength(11, { message: '请输入有效的手机号码' })
  phone?: string;

  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  @MaxLength(100, { message: '密码不能超过100个字符' })
  password: string;
}
