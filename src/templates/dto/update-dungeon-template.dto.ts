import { PartialType } from '@nestjs/swagger';
import { CreateDungeonTemplateDto } from './create-dungeon-template.dto';

export class UpdateDungeonTemplateDto extends PartialType(
  CreateDungeonTemplateDto,
) {}
