import { IsString, IsNumber, Min, MinLength, MaxLength } from 'class-validator';

export class CreateWeeklyTaskTemplateDto {
  @IsString()
  @MinLength(1, { message: '任务名称不能为空' })
  @MaxLength(100, { message: '任务名称不能超过100个字符' })
  taskName: string;

  @IsNumber({}, { message: '目标数量必须是数字' })
  @Min(1, { message: '目标数量必须大于0' })
  targetCount: number;
}