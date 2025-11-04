import { IsString, IsNumber, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWeeklyTaskProgressDto {
  @ApiProperty({
    description: '账号ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
    format: 'uuid',
  })
  @IsUUID('4', { message: '账号ID格式错误' })
  accountId: string;

  @ApiProperty({
    description: '任务名称',
    example: '每周副本挑战',
    type: 'string',
  })
  @IsString()
  taskName: string;

  @ApiProperty({
    description: '完成数量',
    example: 3,
    type: 'number',
    minimum: 0,
  })
  @IsNumber({}, { message: '完成数量必须是数字' })
  @Min(0, { message: '完成数量不能小于0' })
  completedCount: number;
}
