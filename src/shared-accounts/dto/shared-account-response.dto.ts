import { ApiProperty } from '@nestjs/swagger';
import type { PermissionConfig } from '../types/permission.types';

/**
 * 用户关联信息响应 DTO
 */
export class UserRelationResponseDto {
  @ApiProperty({
    description: '关联ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '用户ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
  })
  username?: string;

  @ApiProperty({
    description: '关联类型',
    enum: ['owner', 'contributor'],
    example: 'contributor',
  })
  relationType: 'owner' | 'contributor';

  @ApiProperty({
    description: '权限配置',
    example: { read: true, write: true, delete: false },
  })
  permissions: PermissionConfig;

  @ApiProperty({
    description: '加入时间',
    example: '2023-12-01T10:00:00.000Z',
  })
  joinedAt: Date;
}

/**
 * 共享账号响应 DTO
 */
export class SharedAccountResponseDto {
  @ApiProperty({
    description: '共享账号名称',
    example: 'team_account_001',
  })
  accountName: string;

  @ApiProperty({
    description: '显示名称',
    example: '团队共享账号',
  })
  displayName: string;

  @ApiProperty({
    description: '服务器名称',
    example: '梦幻西游-紫霞仙子',
  })
  serverName: string;

  @ApiProperty({
    description: '是否激活',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '创建时间',
    example: '2023-12-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2023-12-01T10:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '用户数量',
    example: 3,
    required: false,
  })
  userCount?: number;
}

/**
 * 共享账号详细信息响应 DTO
 */
export class SharedAccountDetailResponseDto extends SharedAccountResponseDto {
  @ApiProperty({
    description: '用户关联关系列表',
    type: [UserRelationResponseDto],
    required: false,
  })
  userRelations?: UserRelationResponseDto[];
}

/**
 * 权限检查结果响应 DTO
 */
export class PermissionCheckResponseDto {
  @ApiProperty({
    description: '是否有权限',
    example: true,
  })
  hasPermission: boolean;

  @ApiProperty({
    description: '关联类型',
    enum: ['owner', 'contributor'],
    example: 'contributor',
    required: false,
  })
  relationType?: 'owner' | 'contributor';

  @ApiProperty({
    description: '权限配置',
    example: { read: true, write: true, delete: false },
    required: false,
  })
  permissions?: PermissionConfig;

  @ApiProperty({
    description: '原因说明',
    example: '用户没有 delete 权限',
    required: false,
  })
  reason?: string;
}
