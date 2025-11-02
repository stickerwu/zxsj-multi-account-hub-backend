import { PartialType } from '@nestjs/mapped-types';
import { CreateWeeklyTaskTemplateDto } from './create-weekly-task-template.dto';

export class UpdateWeeklyTaskTemplateDto extends PartialType(CreateWeeklyTaskTemplateDto) {}