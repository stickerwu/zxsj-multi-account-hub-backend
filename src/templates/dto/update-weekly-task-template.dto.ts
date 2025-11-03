import { PartialType } from '@nestjs/swagger';
import { CreateWeeklyTaskTemplateDto } from './create-weekly-task-template.dto';

export class UpdateWeeklyTaskTemplateDto extends PartialType(
  CreateWeeklyTaskTemplateDto,
) {}
