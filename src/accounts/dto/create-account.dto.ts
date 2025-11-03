import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MinLength(1, { message: '账号名称不能为空' })
  @MaxLength(100, { message: '账号名称不能超过100个字符' })
  accountName: string; // 统一使用accountName字段名

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
