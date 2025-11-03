import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Account } from '../src/entities/account.entity';
import { SharedAccount } from '../src/entities/shared-account.entity';
import { UserAccountRelation } from '../src/entities/user-account-relation.entity';
import { AuthService } from '../src/auth/auth.service';
import { RelationType, PermissionAction } from '../src/shared-accounts/types/permission.types';

/**
 * 普通用户业务逻辑测试套件
 * 
 * 测试覆盖范围：
 * 1. 基础功能操作测试
 * 2. 数据访问权限测试
 * 3. 业务操作流程测试
 * 4. 界面交互测试
 */
describe('普通用户业务逻辑测试 (Regular User Business Logic)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  
  // 测试用户数据
  let regularUser1: User;
  let regularUser2: User;
  let adminUser: User;
  let user1Token: string;
  let user2Token: string;
  let adminToken: string;
  
  // 测试账号数据
  let user1Account: Account;
  let user2Account: Account;
  let sharedAccount: SharedAccount;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    authService = moduleFixture.get<AuthService>(AuthService);

    // 清理测试数据
    await cleanupTestData();
    
    // 创建测试用户
    await createTestUsers();
    
    // 生成认证令牌
    await generateAuthTokens();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // 每个测试前重置测试数据
    await resetTestData();
  });

  /**
   * 清理测试数据
   */
  async function cleanupTestData() {
    await dataSource.query('DELETE FROM user_account_relations WHERE 1=1');
    await dataSource.query('DELETE FROM shared_accounts WHERE 1=1');
    await dataSource.query('DELETE FROM accounts WHERE 1=1');
    await dataSource.query('DELETE FROM users WHERE username LIKE \'regular_test_%\'');
  }

  /**
   * 创建测试用户
   */
  async function createTestUsers() {
    const userRepository = dataSource.getRepository(User);
    
    // 创建普通用户1
    regularUser1 = userRepository.create({
      username: 'regular_test_user1',
      email: 'user1@test.com',
      password: 'hashedPassword123',
      role: 'user',
      isActive: true,
    });
    await userRepository.save(regularUser1);

    // 创建普通用户2
    regularUser2 = userRepository.create({
      username: 'regular_test_user2',
      email: 'user2@test.com',
      password: 'hashedPassword123',
      role: 'user',
      isActive: true,
    });
    await userRepository.save(regularUser2);

    // 创建管理员用户
    adminUser = userRepository.create({
      username: 'regular_test_admin',
      email: 'admin@test.com',
      password: 'hashedPassword123',
      role: 'admin',
      isActive: true,
    });
    await userRepository.save(adminUser);
  }

  /**
   * 生成认证令牌
   */
  async function generateAuthTokens() {
    const user1Payload = { userId: regularUser1.userId, username: regularUser1.username };
    const user2Payload = { userId: regularUser2.userId, username: regularUser2.username };
    const adminPayload = { userId: adminUser.userId, username: adminUser.username };
    
    user1Token = await authService.generateToken(user1Payload);
    user2Token = await authService.generateToken(user2Payload);
    adminToken = await authService.generateToken(adminPayload);
  }

  /**
   * 重置测试数据
   */
  async function resetTestData() {
    // 清理账号相关数据
    await dataSource.query('DELETE FROM user_account_relations WHERE 1=1');
    await dataSource.query('DELETE FROM shared_accounts WHERE 1=1');
    await dataSource.query('DELETE FROM accounts WHERE 1=1');
  }

  // ==================== 基础功能操作测试 ====================

  describe('基础功能操作测试', () => {
    
    describe('个人账号管理', () => {
      it('用户应该能够创建个人账号', async () => {
        const accountData = {
          accountName: 'user1_personal_account',
          serverName: '测试服务器1',
          description: '用户1的个人账号'
        };

        const response = await request(app.getHttpServer())
          .post('/accounts')
          .set('Authorization', `Bearer ${user1Token}`)
          .send(accountData)
          .expect(201);

        expect(response.body).toHaveProperty('accountName', accountData.accountName);
        expect(response.body).toHaveProperty('serverName', accountData.serverName);
        expect(response.body).toHaveProperty('userId', regularUser1.userId);
      });

      it('用户应该能够查看自己的账号列表', async () => {
        // 先创建几个个人账号
        const accountRepository = dataSource.getRepository(Account);
        
        const account1 = accountRepository.create({
          accountName: 'user1_account1',
          serverName: '服务器1',
          userId: regularUser1.userId,
          isActive: true,
        });
        await accountRepository.save(account1);

        const account2 = accountRepository.create({
          accountName: 'user1_account2',
          serverName: '服务器2',
          userId: regularUser1.userId,
          isActive: true,
        });
        await accountRepository.save(account2);

        const response = await request(app.getHttpServer())
          .get('/accounts')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toHaveProperty('code', 200);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data.every(account => account.userId === regularUser1.userId)).toBe(true);
      });

      it('用户应该能够更新自己的账号信息', async () => {
        // 先创建个人账号
        const accountRepository = dataSource.getRepository(Account);
        const account = accountRepository.create({
          accountName: 'user1_update_account',
          serverName: '原服务器',
          userId: regularUser1.userId,
          isActive: true,
        });
        await accountRepository.save(account);

        const updateData = {
          serverName: '更新后的服务器',
          description: '更新后的描述'
        };

        const response = await request(app.getHttpServer())
          .put(`/accounts/${account.accountId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('serverName', updateData.serverName);
        expect(response.body).toHaveProperty('description', updateData.description);
      });

      it('用户应该能够删除自己的账号', async () => {
        // 先创建个人账号
        const accountRepository = dataSource.getRepository(Account);
        const account = accountRepository.create({
          accountName: 'user1_delete_account',
          serverName: '待删除服务器',
          userId: regularUser1.userId,
          isActive: true,
        });
        await accountRepository.save(account);

        const response = await request(app.getHttpServer())
          .delete(`/accounts/${account.accountId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });

      it('用户不应该能够访问其他用户的账号', async () => {
        // 创建用户2的账号
        const accountRepository = dataSource.getRepository(Account);
        const user2Account = accountRepository.create({
          accountName: 'user2_private_account',
          serverName: '用户2的服务器',
          userId: regularUser2.userId,
          isActive: true,
        });
        await accountRepository.save(user2Account);

        // 用户1尝试访问用户2的账号
        await request(app.getHttpServer())
          .get(`/accounts/${user2Account.accountId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(403);
      });
    });

    describe('共享账号基础操作', () => {
      beforeEach(async () => {
        // 创建测试共享账号
        const sharedAccountRepository = dataSource.getRepository(SharedAccount);
        sharedAccount = sharedAccountRepository.create({
          accountName: 'test_shared_account',
          displayName: '测试共享账号',
          serverName: '共享服务器',
          createdBy: adminUser.userId,
          isActive: true,
        });
        await sharedAccountRepository.save(sharedAccount);
      });

      it('用户应该能够查看有权限的共享账号列表', async () => {
        // 给用户1添加共享账号权限
        const relationRepository = dataSource.getRepository(UserAccountRelation);
        const relation = relationRepository.create({
          userId: regularUser1.userId,
          accountName: sharedAccount.accountName,
          relationType: RelationType.CONTRIBUTOR,
          permissions: { read: true, write: false, delete: false },
        });
        await relationRepository.save(relation);

        const response = await request(app.getHttpServer())
          .get('/shared-accounts')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty('accountName', sharedAccount.accountName);
      });

      it('用户应该能够查看有权限的共享账号详情', async () => {
        // 给用户1添加读取权限
        const relationRepository = dataSource.getRepository(UserAccountRelation);
        const relation = relationRepository.create({
          userId: regularUser1.userId,
          accountName: sharedAccount.accountName,
          relationType: RelationType.CONTRIBUTOR,
          permissions: { read: true, write: false, delete: false },
        });
        await relationRepository.save(relation);

        const response = await request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount.accountName}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toHaveProperty('accountName', sharedAccount.accountName);
        expect(response.body).toHaveProperty('displayName', sharedAccount.displayName);
      });

      it('用户不应该能够访问无权限的共享账号', async () => {
        // 用户1没有权限访问共享账号
        await request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount.accountName}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(403);
      });

      it('用户应该能够检查自己的权限', async () => {
        // 给用户1添加读取权限
        const relationRepository = dataSource.getRepository(UserAccountRelation);
        const relation = relationRepository.create({
          userId: regularUser1.userId,
          accountName: sharedAccount.accountName,
          relationType: RelationType.CONTRIBUTOR,
          permissions: { read: true, write: true, delete: false },
        });
        await relationRepository.save(relation);

        // 检查读取权限
        const readResponse = await request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount.accountName}/permissions/${PermissionAction.READ}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(readResponse.body).toHaveProperty('hasPermission', true);
        expect(readResponse.body).toHaveProperty('relationType', 'contributor');

        // 检查写入权限
        const writeResponse = await request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount.accountName}/permissions/${PermissionAction.WRITE}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(writeResponse.body).toHaveProperty('hasPermission', true);

        // 检查删除权限（应该没有）
        const deleteResponse = await request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount.accountName}/permissions/${PermissionAction.DELETE}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(deleteResponse.body).toHaveProperty('hasPermission', false);
      });
    });
  });

  // ==================== 数据访问权限测试 ====================

  describe('数据访问权限测试', () => {
    
    beforeEach(async () => {
      // 创建测试共享账号
      const sharedAccountRepository = dataSource.getRepository(SharedAccount);
      sharedAccount = sharedAccountRepository.create({
        accountName: 'permission_test_account',
        displayName: '权限测试账号',
        serverName: '权限测试服务器',
        createdBy: adminUser.userId,
        isActive: true,
      });
      await sharedAccountRepository.save(sharedAccount);
    });

    it('只读权限用户不应该能够修改共享账号', async () => {
      // 给用户1添加只读权限
      const relationRepository = dataSource.getRepository(UserAccountRelation);
      const relation = relationRepository.create({
        userId: regularUser1.userId,
        accountName: sharedAccount.accountName,
        relationType: RelationType.CONTRIBUTOR,
        permissions: { read: true, write: false, delete: false },
      });
      await relationRepository.save(relation);

      const updateData = {
        displayName: '尝试更新的名称',
        description: '尝试更新的描述'
      };

      await request(app.getHttpServer())
        .put(`/shared-accounts/${sharedAccount.accountName}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData)
        .expect(403);
    });

    it('有写入权限的用户应该能够修改共享账号', async () => {
      // 给用户1添加写入权限
      const relationRepository = dataSource.getRepository(UserAccountRelation);
      const relation = relationRepository.create({
        userId: regularUser1.userId,
        accountName: sharedAccount.accountName,
        relationType: RelationType.CONTRIBUTOR,
        permissions: { read: true, write: true, delete: false },
      });
      await relationRepository.save(relation);

      const updateData = {
        displayName: '成功更新的名称',
        description: '成功更新的描述'
      };

      const response = await request(app.getHttpServer())
        .put(`/shared-accounts/${sharedAccount.accountName}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('displayName', updateData.displayName);
      expect(response.body).toHaveProperty('description', updateData.description);
    });

    it('无删除权限的用户不应该能够删除共享账号', async () => {
      // 给用户1添加读写权限但无删除权限
      const relationRepository = dataSource.getRepository(UserAccountRelation);
      const relation = relationRepository.create({
        userId: regularUser1.userId,
        accountName: sharedAccount.accountName,
        relationType: RelationType.CONTRIBUTOR,
        permissions: { read: true, write: true, delete: false },
      });
      await relationRepository.save(relation);

      await request(app.getHttpServer())
        .delete(`/shared-accounts/${sharedAccount.accountName}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });

    it('拥有者应该拥有所有权限', async () => {
      // 将用户1设置为拥有者
      const relationRepository = dataSource.getRepository(UserAccountRelation);
      const relation = relationRepository.create({
        userId: regularUser1.userId,
        accountName: sharedAccount.accountName,
        relationType: RelationType.OWNER,
        permissions: { read: true, write: true, delete: true },
      });
      await relationRepository.save(relation);

      // 测试读取权限
      const readResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount.accountName}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(readResponse.body).toHaveProperty('accountName', sharedAccount.accountName);

      // 测试写入权限
      const updateData = {
        displayName: '拥有者更新的名称'
      };

      const writeResponse = await request(app.getHttpServer())
        .put(`/shared-accounts/${sharedAccount.accountName}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData)
        .expect(200);

      expect(writeResponse.body).toHaveProperty('displayName', updateData.displayName);

      // 测试删除权限
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/shared-accounts/${sharedAccount.accountName}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('message');
    });

    it('用户应该能够查看自己的权限详情', async () => {
      // 给用户1添加特定权限
      const relationRepository = dataSource.getRepository(UserAccountRelation);
      const relation = relationRepository.create({
        userId: regularUser1.userId,
        accountName: sharedAccount.accountName,
        relationType: RelationType.CONTRIBUTOR,
        permissions: { read: true, write: true, delete: false },
      });
      await relationRepository.save(relation);

      const response = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount.accountName}/users/${regularUser1.userId}/permissions`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('permissions');
      expect(response.body.permissions).toMatchObject({
        read: true,
        write: true,
        delete: false
      });
      expect(response.body).toHaveProperty('relationType', 'contributor');
    });
  });

  // ==================== 业务操作流程测试 ====================

  describe('业务操作流程测试', () => {
    
    it('完整的个人账号管理流程', async () => {
      // 1. 创建个人账号
      const createData = {
        accountName: 'workflow_test_account',
        serverName: '流程测试服务器',
        description: '流程测试账号'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createData)
        .expect(201);

      const accountId = createResponse.body.accountId;

      // 2. 查看账号详情
      const detailResponse = await request(app.getHttpServer())
        .get(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(detailResponse.body).toHaveProperty('accountName', createData.accountName);

      // 3. 更新账号信息
      const updateData = {
        serverName: '更新后的服务器',
        description: '更新后的描述'
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toHaveProperty('serverName', updateData.serverName);

      // 4. 查看更新后的账号列表
      const listResponse = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(listResponse.body.data).toHaveLength(1);
      expect(listResponse.body.data[0]).toHaveProperty('serverName', updateData.serverName);

      // 5. 删除账号
      await request(app.getHttpServer())
        .delete(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 6. 验证账号已删除
      const finalListResponse = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(finalListResponse.body.data).toHaveLength(0);
    });

    it('共享账号协作流程', async () => {
      // 1. 管理员创建共享账号
      const sharedAccountData = {
        accountName: 'collaboration_account',
        displayName: '协作测试账号',
        serverName: '协作服务器',
        description: '用于测试协作流程的共享账号'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/shared-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sharedAccountData)
        .expect(201);

      const accountName = createResponse.body.accountName;

      // 2. 管理员添加用户1为贡献者
      const addUser1Data = {
        userId: regularUser1.userId,
        relationType: RelationType.CONTRIBUTOR,
        permissions: {
          read: true,
          write: true,
          delete: false
        }
      };

      await request(app.getHttpServer())
        .post(`/shared-accounts/${accountName}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(addUser1Data)
        .expect(201);

      // 3. 用户1查看共享账号列表
      const user1ListResponse = await request(app.getHttpServer())
        .get('/shared-accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(user1ListResponse.body).toHaveLength(1);
      expect(user1ListResponse.body[0]).toHaveProperty('accountName', accountName);

      // 4. 用户1更新共享账号信息
      const updateData = {
        displayName: '用户1更新的名称',
        description: '用户1更新的描述'
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toHaveProperty('displayName', updateData.displayName);

      // 5. 管理员添加用户2为只读用户
      const addUser2Data = {
        userId: regularUser2.userId,
        relationType: RelationType.CONTRIBUTOR,
        permissions: {
          read: true,
          write: false,
          delete: false
        }
      };

      await request(app.getHttpServer())
        .post(`/shared-accounts/${accountName}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(addUser2Data)
        .expect(201);

      // 6. 用户2查看共享账号（应该成功）
      const user2ViewResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user2ViewResponse.body).toHaveProperty('displayName', updateData.displayName);

      // 7. 用户2尝试更新共享账号（应该失败）
      await request(app.getHttpServer())
        .put(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ displayName: '用户2尝试更新' })
        .expect(403);

      // 8. 管理员移除用户1的权限
      await request(app.getHttpServer())
        .delete(`/shared-accounts/${accountName}/users/${regularUser1.userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 9. 用户1再次尝试访问（应该失败）
      await request(app.getHttpServer())
        .get(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });

    it('权限升级和降级流程', async () => {
      // 1. 创建共享账号
      const sharedAccountRepository = dataSource.getRepository(SharedAccount);
      const testAccount = sharedAccountRepository.create({
        accountName: 'permission_upgrade_account',
        displayName: '权限升级测试账号',
        serverName: '权限测试服务器',
        createdBy: adminUser.userId,
        isActive: true,
      });
      await sharedAccountRepository.save(testAccount);

      // 2. 添加用户1为只读用户
      const addUserData = {
        userId: regularUser1.userId,
        relationType: RelationType.CONTRIBUTOR,
        permissions: {
          read: true,
          write: false,
          delete: false
        }
      };

      await request(app.getHttpServer())
        .post(`/shared-accounts/${testAccount.accountName}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(addUserData)
        .expect(201);

      // 3. 验证用户1只有读取权限
      const readPermissionResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${testAccount.accountName}/permissions/${PermissionAction.READ}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(readPermissionResponse.body).toHaveProperty('hasPermission', true);

      const writePermissionResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${testAccount.accountName}/permissions/${PermissionAction.WRITE}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(writePermissionResponse.body).toHaveProperty('hasPermission', false);

      // 4. 管理员升级用户1权限
      const upgradePermissions = {
        read: true,
        write: true,
        delete: false
      };

      await request(app.getHttpServer())
        .put(`/shared-accounts/${testAccount.accountName}/users/${regularUser1.userId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(upgradePermissions)
        .expect(200);

      // 5. 验证用户1现在有写入权限
      const newWritePermissionResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${testAccount.accountName}/permissions/${PermissionAction.WRITE}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(newWritePermissionResponse.body).toHaveProperty('hasPermission', true);

      // 6. 用户1现在应该能够更新账号
      const updateData = {
        displayName: '权限升级后的更新'
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/shared-accounts/${testAccount.accountName}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toHaveProperty('displayName', updateData.displayName);

      // 7. 管理员降级用户1权限
      const downgradePermissions = {
        read: true,
        write: false,
        delete: false
      };

      await request(app.getHttpServer())
        .put(`/shared-accounts/${testAccount.accountName}/users/${regularUser1.userId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(downgradePermissions)
        .expect(200);

      // 8. 验证用户1不再有写入权限
      await request(app.getHttpServer())
        .put(`/shared-accounts/${testAccount.accountName}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ displayName: '权限降级后的尝试更新' })
        .expect(403);
    });
  });

  // ==================== 界面交互测试 ====================

  describe('界面交互测试', () => {
    
    it('分页查询功能测试', async () => {
      // 创建多个个人账号用于分页测试
      const accountRepository = dataSource.getRepository(Account);
      const accounts = [];
      
      for (let i = 1; i <= 15; i++) {
        const account = accountRepository.create({
          accountName: `pagination_test_account_${i}`,
          serverName: `服务器${i}`,
          userId: regularUser1.userId,
          isActive: true,
        });
        accounts.push(account);
      }
      await accountRepository.save(accounts);

      // 测试第一页
      const page1Response = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(page1Response.body.data).toHaveLength(10);
      expect(page1Response.body).toHaveProperty('pagination');
      expect(page1Response.body.pagination).toHaveProperty('total', 15);
      expect(page1Response.body.pagination).toHaveProperty('page', 1);
      expect(page1Response.body.pagination).toHaveProperty('limit', 10);

      // 测试第二页
      const page2Response = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .query({ page: 2, limit: 10 })
        .expect(200);

      expect(page2Response.body.data).toHaveLength(5);
      expect(page2Response.body.pagination).toHaveProperty('page', 2);
    });

    it('搜索功能测试', async () => {
      // 创建不同名称的账号
      const accountRepository = dataSource.getRepository(Account);
      
      const searchAccount1 = accountRepository.create({
        accountName: 'search_test_account_alpha',
        serverName: '搜索测试服务器Alpha',
        userId: regularUser1.userId,
        isActive: true,
      });
      await accountRepository.save(searchAccount1);

      const searchAccount2 = accountRepository.create({
        accountName: 'search_test_account_beta',
        serverName: '搜索测试服务器Beta',
        userId: regularUser1.userId,
        isActive: true,
      });
      await accountRepository.save(searchAccount2);

      const otherAccount = accountRepository.create({
        accountName: 'other_account',
        serverName: '其他服务器',
        userId: regularUser1.userId,
        isActive: true,
      });
      await accountRepository.save(otherAccount);

      // 测试按账号名称搜索
      const searchResponse = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .query({ search: 'search_test' })
        .expect(200);

      expect(searchResponse.body.data).toHaveLength(2);
      expect(searchResponse.body.data.every(account => 
        account.accountName.includes('search_test')
      )).toBe(true);

      // 测试按服务器名称搜索
      const serverSearchResponse = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .query({ search: 'Alpha' })
        .expect(200);

      expect(serverSearchResponse.body.data).toHaveLength(1);
      expect(serverSearchResponse.body.data[0]).toHaveProperty('serverName', '搜索测试服务器Alpha');
    });

    it('排序功能测试', async () => {
      // 创建不同时间的账号
      const accountRepository = dataSource.getRepository(Account);
      
      const account1 = accountRepository.create({
        accountName: 'sort_test_account_1',
        serverName: '排序测试服务器1',
        userId: regularUser1.userId,
        isActive: true,
      });
      await accountRepository.save(account1);

      // 稍等一下确保时间差异
      await new Promise(resolve => setTimeout(resolve, 100));

      const account2 = accountRepository.create({
        accountName: 'sort_test_account_2',
        serverName: '排序测试服务器2',
        userId: regularUser1.userId,
        isActive: true,
      });
      await accountRepository.save(account2);

      // 测试按创建时间升序排序
      const ascResponse = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .query({ sortBy: 'createdAt', sortOrder: 'ASC' })
        .expect(200);

      expect(ascResponse.body.data).toHaveLength(2);
      expect(new Date(ascResponse.body.data[0].createdAt).getTime())
        .toBeLessThan(new Date(ascResponse.body.data[1].createdAt).getTime());

      // 测试按创建时间降序排序
      const descResponse = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .query({ sortBy: 'createdAt', sortOrder: 'DESC' })
        .expect(200);

      expect(descResponse.body.data).toHaveLength(2);
      expect(new Date(descResponse.body.data[0].createdAt).getTime())
        .toBeGreaterThan(new Date(descResponse.body.data[1].createdAt).getTime());
    });

    it('输入验证和错误处理测试', async () => {
      // 测试无效的账号名称
      const invalidAccountData = {
        accountName: '', // 空账号名称
        serverName: '测试服务器'
      };

      const invalidResponse = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidAccountData)
        .expect(400);

      expect(invalidResponse.body).toHaveProperty('message');

      // 测试重复的账号名称
      const accountRepository = dataSource.getRepository(Account);
      const existingAccount = accountRepository.create({
        accountName: 'duplicate_test_account',
        serverName: '现有服务器',
        userId: regularUser1.userId,
        isActive: true,
      });
      await accountRepository.save(existingAccount);

      const duplicateAccountData = {
        accountName: 'duplicate_test_account',
        serverName: '重复服务器'
      };

      const duplicateResponse = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(duplicateAccountData)
        .expect(409);

      expect(duplicateResponse.body).toHaveProperty('message');
    });

    it('并发操作处理测试', async () => {
      // 创建测试账号
      const accountRepository = dataSource.getRepository(Account);
      const testAccount = accountRepository.create({
        accountName: 'concurrent_test_account',
        serverName: '并发测试服务器',
        userId: regularUser1.userId,
        isActive: true,
      });
      await accountRepository.save(testAccount);

      // 模拟多个并发更新请求
      const updatePromises = Array.from({ length: 5 }, (_, index) => 
        request(app.getHttpServer())
          .put(`/accounts/${testAccount.accountId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            serverName: `并发更新服务器 ${index}`,
            description: `并发更新描述 ${index}`
          })
      );

      const results = await Promise.allSettled(updatePromises);
      
      // 至少应该有一个成功的更新
      const successfulUpdates = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      );
      
      expect(successfulUpdates.length).toBeGreaterThan(0);

      // 验证最终状态
      const finalResponse = await request(app.getHttpServer())
        .get(`/accounts/${testAccount.accountId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(finalResponse.body).toHaveProperty('serverName');
      expect(finalResponse.body.serverName).toMatch(/并发更新服务器 \d/);
    });
  });

  // ==================== 数据一致性和安全性测试 ====================

  describe('数据一致性和安全性测试', () => {
    
    it('应该防止跨用户数据访问', async () => {
      // 创建用户1的账号
      const accountRepository = dataSource.getRepository(Account);
      const user1Account = accountRepository.create({
        accountName: 'user1_private_account',
        serverName: '用户1私有服务器',
        userId: regularUser1.userId,
        isActive: true,
      });
      await accountRepository.save(user1Account);

      // 用户2尝试访问用户1的账号
      await request(app.getHttpServer())
        .get(`/accounts/${user1Account.accountId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      // 用户2尝试修改用户1的账号
      await request(app.getHttpServer())
        .put(`/accounts/${user1Account.accountId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ serverName: '恶意修改' })
        .expect(403);

      // 用户2尝试删除用户1的账号
      await request(app.getHttpServer())
        .delete(`/accounts/${user1Account.accountId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('应该正确处理无效的认证令牌', async () => {
      const invalidToken = 'invalid.jwt.token';

      await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('应该正确处理过期的认证令牌', async () => {
      // 注意：这里需要根据实际的JWT配置来测试过期令牌
      // 这是一个示例，实际实现可能需要调整
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('应该验证输入数据的完整性', async () => {
      // 测试SQL注入防护
      const maliciousAccountData = {
        accountName: "'; DROP TABLE accounts; --",
        serverName: '恶意服务器'
      };

      const response = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(maliciousAccountData);

      // 应该返回400（验证失败）或成功创建（但不执行SQL注入）
      expect([400, 201]).toContain(response.status);

      // 如果创建成功，验证数据库没有被破坏
      if (response.status === 201) {
        const listResponse = await request(app.getHttpServer())
          .get('/accounts')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(listResponse.body).toHaveProperty('data');
        expect(Array.isArray(listResponse.body.data)).toBe(true);
      }
    });

    it('应该正确处理资源不存在的情况', async () => {
      const nonExistentAccountId = 99999;

      await request(app.getHttpServer())
        .get(`/accounts/${nonExistentAccountId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      await request(app.getHttpServer())
        .put(`/accounts/${nonExistentAccountId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ serverName: '更新不存在的账号' })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/accounts/${nonExistentAccountId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });
  });
});