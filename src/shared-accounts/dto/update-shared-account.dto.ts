import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新共享账号的数据传输对象
 */
export class UpdateSharedAccountDto {
  @ApiProperty({
    description: '显示名称',
    example: '团队共享账号（已更新）',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString({ message: '显示名称必须是字符串' })
  @Length(1, 100, { message: '显示名称长度不能超过100个字符' })
  displayName?: string;

  @ApiProperty({
    description: '服务器名称',
    example: '梦幻西游-紫霞仙子',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: '服务器名称必须是字符串' })
  @Length(1, 50, { message: '服务器名称长度不能超过50个字符' })
  serverName?: string;

  @ApiProperty({
    description: '是否激活',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '激活状态必须是布尔值' })
  isActive?: boolean;
}
