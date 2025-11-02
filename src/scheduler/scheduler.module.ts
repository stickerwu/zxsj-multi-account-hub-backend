import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // 启用定时任务功能
    ProgressModule, // 导入进度模块以使用 ProgressService
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
