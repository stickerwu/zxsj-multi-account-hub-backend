import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

/**
 * 更新共享账号副本进度 DTO
 */
export class UpdateSharedDungeonProgressDto {
  @ApiProperty({
    description: '共享账号名称',
    example: 'guild_main_account',
  })
  @IsString()
  @IsNotEmpty()
  sharedAccountName: string;

  @ApiProperty({
    description: '副本名称',
    example: '黑翼之巢',
  })
  @IsString()
  @IsNotEmpty()
  dungeonName: string;

  @ApiProperty({
    description: 'Boss名称',
    example: '拉格纳罗斯',
  })
  @IsString()
  @IsNotEmpty()
  bossName: string;

  @ApiProperty({
    description: '击杀次数',
    example: 1,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  killCount: number;
}
