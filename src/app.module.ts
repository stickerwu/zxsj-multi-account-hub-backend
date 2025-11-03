import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { TemplatesModule } from './templates/templates.module';
import { ProgressModule } from './progress/progress.module';
import { SchedulerModule } from './scheduler/scheduler.module';
// 导入所有实体
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';
import { DungeonTemplate } from './entities/dungeon-template.entity';
import { WeeklyTaskTemplate } from './entities/weekly-task-template.entity';
import { WeeklyProgress } from './entities/weekly-progress.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || '3306', 10),
        username: configService.get<string>('DB_USERNAME') || 'root',
        password: configService.get<string>('DB_PASSWORD') || '',
        database: configService.get<string>('DB_NAME') || 'zxsj_hub',
        entities: [
          User,
          Account,
          DungeonTemplate,
          WeeklyTaskTemplate,
          WeeklyProgress,
        ],
        synchronize: false,
        timezone: '+08:00', // 设置为北京时间
        charset: 'utf8mb4', // 支持完整的 UTF-8 字符集，包括 emoji
        logging: process.env.NODE_ENV === 'development', // 开发环境启用日志
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    AccountsModule,
    TemplatesModule,
    ProgressModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
