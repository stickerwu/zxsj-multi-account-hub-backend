import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { WeeklyProgress } from '../entities/weekly-progress.entity';
import { Account } from '../entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeeklyProgress, Account])],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
