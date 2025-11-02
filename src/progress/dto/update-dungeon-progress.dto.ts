import { IsString, IsNumber, Min, Max, IsUUID } from 'class-validator';

export class UpdateDungeonProgressDto {
  @IsUUID('4', { message: '账号ID格式错误' })
  accountId: string;

  @IsString()
  dungeonName: string;

  @IsString()
  bossName: string;

  @IsNumber({}, { message: '击杀次数必须是数字' })
  @Min(0, { message: '击杀次数不能小于0' })
  @Max(999, { message: '击杀次数不能超过999' })
  killCount: number;
}