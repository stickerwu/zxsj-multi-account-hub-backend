import { PartialType } from '@nestjs/mapped-types';
import { CreateDungeonTemplateDto } from './create-dungeon-template.dto';

export class UpdateDungeonTemplateDto extends PartialType(CreateDungeonTemplateDto) {}