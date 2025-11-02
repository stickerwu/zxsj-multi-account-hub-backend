import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { DungeonTemplate } from '../entities/dungeon-template.entity';
import { WeeklyTaskTemplate } from '../entities/weekly-task-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DungeonTemplate, WeeklyTaskTemplate])],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
