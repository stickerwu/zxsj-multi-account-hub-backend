import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

/**
 * 通用分页请求DTO
 * 用于所有需要分页的列表查询接口
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: '页码，从1开始',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量，最大不超过100条',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  @Max(100, { message: '每页数量不能超过100' })
  size?: number = 20;

  @ApiPropertyOptional({
    description: '搜索关键词',
    example: 'admin',
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;
}

/**
 * 通用分页响应DTO
 * 标准化所有分页接口的返回格式
 */
export class PaginatedResponse<T> {
  @ApiProperty({
    description: '总记录数',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '当前页数据列表',
    isArray: true,
  })
  items: T[];

  @ApiProperty({
    description: '当前页码',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '每页数量',
    example: 20,
  })
  size: number;

  @ApiProperty({
    description: '总页数',
    example: 5,
  })
  totalPages: number;

  constructor(items: T[], total: number, page: number = 1, size: number = 20) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.size = size;
    this.totalPages = Math.ceil(total / size);
  }
}

/**
 * 兼容旧版本的分页响应DTO
 * 保持向后兼容性，逐步迁移到新的PaginatedResponse
 * @deprecated 请使用 PaginatedResponse 替代
 */
export class LegacyPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
