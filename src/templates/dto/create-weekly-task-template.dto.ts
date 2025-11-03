import { IsString, IsNumber, Min, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWeeklyTaskTemplateDto {
  @ApiProperty({
    description: '任务名称',
    example: '世界BOSS击杀',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1, { message: '任务名称不能为空' })
  @MaxLength(100, { message: '任务名称不能超过100个字符' })
  taskName: string;

  @ApiProperty({
    description: '目标数量',
    example: 4,
    minimum: 1,
  })
  @IsNumber({}, { message: '目标数量必须是数字' })
  @Min(1, { message: '目标数量必须大于0' })
  targetCount: number;
}
