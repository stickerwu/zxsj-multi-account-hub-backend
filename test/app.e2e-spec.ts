/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let accountId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        // 使用内存数据库进行测试
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../src/entities/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('健康检查', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });
  });

  describe('认证流程', () => {
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('/api/auth/register (POST) - 用户注册', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.username).toBe(testUser.username);
          expect(res.body.user.email).toBe(testUser.email);

          // 保存认证信息用于后续测试
          authToken = res.body.access_token;
        });
    });

    it('/api/auth/register (POST) - 重复用户名应该失败', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('/api/auth/login (POST) - 用户登录', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.username).toBe(testUser.username);
        });
    });

    it('/api/auth/login (POST) - 错误密码应该失败', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('账号管理', () => {
    const testAccount = {
      accountName: '测试账号1',
      serverName: '测试服务器',
      characterName: '测试角色',
    };

    it('/api/accounts (POST) - 创建账号', () => {
      return request(app.getHttpServer())
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testAccount)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.accountName).toBe(testAccount.accountName);
          expect(res.body.serverName).toBe(testAccount.serverName);
          expect(res.body.characterName).toBe(testAccount.characterName);
          expect(res.body.isEnabled).toBe(true);

          // 保存账号ID用于后续测试
          accountId = res.body.id;
        });
    });

    it('/api/accounts (GET) - 获取账号列表', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('accountName');
        });
    });

    it('/api/accounts/:id (GET) - 获取单个账号', () => {
      return request(app.getHttpServer())
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(accountId);
          expect(res.body.accountName).toBe(testAccount.accountName);
        });
    });

    it('/api/accounts/:id (PUT) - 更新账号', () => {
      const updateData = {
        accountName: '更新后的账号名',
        isEnabled: false,
      };

      return request(app.getHttpServer())
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.accountName).toBe(updateData.accountName);
          expect(res.body.isEnabled).toBe(updateData.isEnabled);
        });
    });

    it('/api/accounts (GET) - 未认证应该失败', () => {
      return request(app.getHttpServer()).get('/api/accounts').expect(401);
    });
  });

  describe('进度跟踪', () => {
    beforeAll(async () => {
      // 重新启用账号用于进度测试
      await request(app.getHttpServer())
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isEnabled: true });
    });

    it('/api/progress/current-week (GET) - 获取当前周进度', () => {
      return request(app.getHttpServer())
        .get('/api/progress/current-week')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/api/progress/current-week/:accountId (GET) - 获取指定账号进度', () => {
      return request(app.getHttpServer())
        .get(`/api/progress/current-week/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('account');
          expect(res.body).toHaveProperty('weekStart');
          expect(res.body).toHaveProperty('dungeonProgress');
          expect(res.body).toHaveProperty('weeklyTaskProgress');
        });
    });

    it('/api/progress/dungeon (POST) - 更新副本进度', () => {
      const dungeonUpdate = {
        accountId: accountId,
        templateId: 'template1',
        bossIndex: 0,
        killCount: 1,
      };

      return request(app.getHttpServer())
        .post('/api/progress/dungeon')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dungeonUpdate)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('dungeonProgress');
          expect(res.body.dungeonProgress).toHaveProperty('template1_0');
        });
    });

    it('/api/progress/weekly-task (POST) - 更新周常任务进度', () => {
      const taskUpdate = {
        accountId: accountId,
        taskName: '每日任务',
        completedCount: 5,
      };

      return request(app.getHttpServer())
        .post('/api/progress/weekly-task')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskUpdate)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('weeklyTaskProgress');
          expect(res.body.weeklyTaskProgress).toHaveProperty('每日任务');
          expect(res.body.weeklyTaskProgress['每日任务']).toBe(5);
        });
    });

    it('/api/progress/statistics (GET) - 获取进度统计', () => {
      return request(app.getHttpServer())
        .get('/api/progress/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalAccounts');
          expect(res.body).toHaveProperty('activeAccounts');
          expect(res.body).toHaveProperty('currentWeekProgress');
          expect(typeof res.body.totalAccounts).toBe('number');
          expect(typeof res.body.activeAccounts).toBe('number');
        });
    });
  });

  describe('模板管理', () => {
    const dungeonTemplate = {
      name: '测试副本',
      description: '测试副本描述',
      bossCount: 3,
      difficulty: '普通',
    };

    const weeklyTaskTemplate = {
      name: '测试周常任务',
      description: '测试周常任务描述',
      maxCount: 10,
      category: '日常',
    };

    it('/api/templates/dungeons (POST) - 创建副本模板', () => {
      return request(app.getHttpServer())
        .post('/api/templates/dungeons')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dungeonTemplate)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(dungeonTemplate.name);
          expect(res.body.bossCount).toBe(dungeonTemplate.bossCount);
        });
    });

    it('/api/templates/dungeons (GET) - 获取副本模板列表', () => {
      return request(app.getHttpServer())
        .get('/api/templates/dungeons')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('/api/templates/weekly-tasks (POST) - 创建周常任务模板', () => {
      return request(app.getHttpServer())
        .post('/api/templates/weekly-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(weeklyTaskTemplate)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(weeklyTaskTemplate.name);
          expect(res.body.maxCount).toBe(weeklyTaskTemplate.maxCount);
        });
    });

    it('/api/templates/weekly-tasks (GET) - 获取周常任务模板列表', () => {
      return request(app.getHttpServer())
        .get('/api/templates/weekly-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('定时任务管理', () => {
    it('/api/scheduler/info (GET) - 获取调度器信息', () => {
      return request(app.getHttpServer())
        .get('/api/scheduler/info')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('scheduledTasks');
          expect(res.body).toHaveProperty('serverTime');
          expect(Array.isArray(res.body.scheduledTasks)).toBe(true);
        });
    });

    it('/api/scheduler/reset-weekly-progress (POST) - 手动重置周进度', () => {
      return request(app.getHttpServer())
        .post('/api/scheduler/reset-weekly-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('resetCount');
          expect(res.body).toHaveProperty('resetTime');
        });
    });
  });
});
