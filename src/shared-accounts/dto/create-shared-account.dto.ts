import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建共享账号的数据传输对象
 */
export class CreateSharedAccountDto {
  @ApiProperty({
    description: '共享账号名称（唯一标识）',
    example: 'team_account_001',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: '账号名称必须是字符串' })
  @IsNotEmpty({ message: '账号名称不能为空' })
  @Length(3, 50, { message: '账号名称长度必须在3-50个字符之间' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '账号名称只能包含字母、数字、下划线和连字符',
  })
  accountName: string;

  @ApiProperty({
    description: '显示名称',
    example: '团队共享账号',
    maxLength: 100,
  })
  @IsString({ message: '显示名称必须是字符串' })
  @IsNotEmpty({ message: '显示名称不能为空' })
  @Length(1, 100, { message: '显示名称长度不能超过100个字符' })
  displayName: string;

  @ApiProperty({
    description: '服务器名称',
    example: '梦幻西游-紫霞仙子',
    maxLength: 50,
  })
  @IsString({ message: '服务器名称必须是字符串' })
  @IsNotEmpty({ message: '服务器名称不能为空' })
  @Length(1, 50, { message: '服务器名称长度不能超过50个字符' })
  serverName: string;
}
