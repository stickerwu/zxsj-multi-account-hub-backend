import { IsString, IsArray, ArrayNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateDungeonTemplateDto {
  @IsString()
  @MinLength(1, { message: '副本名称不能为空' })
  @MaxLength(100, { message: '副本名称不能超过100个字符' })
  dungeonName: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'BOSS列表不能为空' })
  @IsString({ each: true, message: 'BOSS名称必须是字符串' })
  bosses: string[];
}