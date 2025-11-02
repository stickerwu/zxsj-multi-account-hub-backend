import { IsString, IsNumber, Min, IsUUID } from 'class-validator';

export class UpdateWeeklyTaskProgressDto {
  @IsUUID('4', { message: '账号ID格式错误' })
  accountId: string;

  @IsString()
  taskName: string;

  @IsNumber({}, { message: '完成数量必须是数字' })
  @Min(0, { message: '完成数量不能小于0' })
  completedCount: number;
}