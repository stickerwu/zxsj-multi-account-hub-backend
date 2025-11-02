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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // 暂时禁用自动同步，避免与现有表结构冲突
        timezone: '+08:00', // 设置为北京时间
        charset: 'utf8mb4', // 支持完整的 UTF-8 字符集，包括 emoji
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
