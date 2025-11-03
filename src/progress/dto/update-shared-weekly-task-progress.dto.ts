import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

/**
 * 更新共享账号周常任务进度 DTO
 */
export class UpdateSharedWeeklyTaskProgressDto {
  @ApiProperty({
    description: '共享账号名称',
    example: 'guild_main_account',
  })
  @IsString()
  @IsNotEmpty()
  sharedAccountName: string;

  @ApiProperty({
    description: '任务名称',
    example: '世界Boss',
  })
  @IsString()
  @IsNotEmpty()
  taskName: string;

  @ApiProperty({
    description: '完成次数',
    example: 3,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  completedCount: number;
}
