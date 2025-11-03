import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RelationType } from '../types/permission.types';

/**
 * 权限配置 DTO
 */
export class PermissionConfigDto {
  @ApiProperty({
    description: '读取权限',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '读取权限必须是布尔值' })
  read?: boolean;

  @ApiProperty({
    description: '写入权限',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '写入权限必须是布尔值' })
  write?: boolean;

  @ApiProperty({
    description: '删除权限',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '删除权限必须是布尔值' })
  delete?: boolean;
}

/**
 * 添加用户到共享账号的数据传输对象
 */
export class AddUserToAccountDto {
  @ApiProperty({
    description: '用户ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: '用户ID必须是字符串' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  userId: string;

  @ApiProperty({
    description: '关联类型',
    enum: RelationType,
    example: RelationType.CONTRIBUTOR,
    required: false,
  })
  @IsOptional()
  @IsEnum(RelationType, { message: '关联类型必须是有效的枚举值' })
  relationType?: RelationType;

  @ApiProperty({
    description: '自定义权限配置（可选，会覆盖默认权限）',
    type: PermissionConfigDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionConfigDto)
  permissions?: PermissionConfigDto;
}
