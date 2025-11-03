import { IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新用户权限的数据传输对象
 */
export class UpdateUserPermissionsDto {
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
