import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { DungeonTemplate } from '../entities/dungeon-template.entity';
import { WeeklyTaskTemplate } from '../entities/weekly-task-template.entity';
import { User } from '../entities/user.entity';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([DungeonTemplate, WeeklyTaskTemplate, User]),
    JwtModule.register({}), // AdminGuard需要JwtService
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService, AdminGuard],
  exports: [TemplatesService],
})
export class TemplatesModule {}
