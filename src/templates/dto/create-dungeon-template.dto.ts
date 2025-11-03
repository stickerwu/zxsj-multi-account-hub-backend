import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDungeonTemplateDto {
  @ApiProperty({
    description: '副本名称',
    example: '团队副本：黑翼血环',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1, { message: '副本名称不能为空' })
  @MaxLength(100, { message: '副本名称不能超过100个字符' })
  dungeonName: string;

  @ApiProperty({
    description: 'BOSS列表',
    example: ['拉佐格尔', '瓦拉斯塔兹', '勃然大怒', '费尔默'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'BOSS列表不能为空' })
  @IsString({ each: true, message: 'BOSS名称必须是字符串' })
  bosses: string[];
}
