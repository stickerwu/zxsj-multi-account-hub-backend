import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 获取配置服务
  const configService = app.get(ConfigService);

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除非装饰器属性
      forbidNonWhitelisted: true, // 如果有非白名单属性则抛出错误
      transform: true, // 自动转换类型
    }),
  );

  // 启用 CORS
  const corsOrigin =
    configService.get<string>('CORS_ORIGIN') || 'http://localhost:3001';
  app.enableCors({
    origin: corsOrigin.split(','), // 支持多个域名
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 设置全局前缀
  app.setGlobalPrefix('api');

  // 配置 Swagger API 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle(
      configService.get<string>('SWAGGER_TITLE') ||
        '诛仙世界多账号管理系统 API',
    )
    .setDescription(
      configService.get<string>('SWAGGER_DESCRIPTION') ||
        '用于管理诛仙世界游戏多个账号的进度跟踪系统',
    )
    .setVersion(configService.get<string>('SWAGGER_VERSION') || '1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入 JWT token',
        in: 'header',
      },
      'JWT-auth', // 这个名字要与控制器中的 @ApiBearerAuth() 一致
    )
    .addTag('认证', '用户认证相关接口')
    .addTag('账号管理', '游戏账号管理相关接口')
    .addTag('模板管理', '副本和任务模板管理相关接口')
    .addTag('进度跟踪', '游戏进度跟踪相关接口')
    .addTag('定时任务管理', '定时任务管理相关接口')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerPath = configService.get<string>('SWAGGER_PATH') || 'api-docs';
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 保持授权状态
      tagsSorter: 'alpha', // 按字母顺序排序标签
      operationsSorter: 'alpha', // 按字母顺序排序操作
    },
    customSiteTitle: '诛仙世界多账号管理系统 API 文档',
  });

  // 添加健康检查端点
  app.use('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: configService.get<string>('NODE_ENV'),
    });
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 诛仙世界多账号管理系统后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${port}/api`);
  console.log(`📚 API 文档: http://localhost:${port}/${swaggerPath}`);
  console.log(`💚 健康检查: http://localhost:${port}/health`);
  console.log(`🌍 环境: ${configService.get<string>('NODE_ENV')}`);
  console.log(`🔗 CORS 允许源: ${corsOrigin}`);
}
bootstrap().catch((error) => {
  console.error('应用启动失败:', error);
  process.exit(1);
});
