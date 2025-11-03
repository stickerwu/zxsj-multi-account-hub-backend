import { IsString, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDungeonProgressDto {
  @ApiProperty({
    description: '账号ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
    format: 'uuid'
  })
  @IsUUID('4', { message: '账号ID格式错误' })
  accountId: string;

  @ApiProperty({
    description: '副本名称',
    example: '魔兽世界副本',
    type: 'string'
  })
  @IsString()
  dungeonName: string;

  @ApiProperty({
    description: 'Boss名称',
    example: '伊利丹',
    type: 'string'
  })
  @IsString()
  bossName: string;

  @ApiProperty({
    description: '击杀次数',
    example: 5,
    type: 'number',
    minimum: 0,
    maximum: 999
  })
  @IsNumber({}, { message: '击杀次数必须是数字' })
  @Min(0, { message: '击杀次数不能小于0' })
  @Max(999, { message: '击杀次数不能超过999' })
  killCount: number;
}
