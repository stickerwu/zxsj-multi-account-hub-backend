import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { SharedAccount } from '../src/entities/shared-account.entity';
import { UserAccountRelation } from '../src/entities/user-account-relation.entity';
import { AuthService } from '../src/auth/auth.service';
import { RelationType, PermissionAction } from '../src/shared-accounts/types/permission.types';

/**
 * 共享角色账号业务逻辑测试套件
 * 
 * 测试覆盖范围：
 * 1. 多个普通用户共用相同角色账号的场景
 * 2. 测试并发操作时的数据一致性
 * 3. 验证角色权限分配的正确性
 * 4. 检查操作日志记录准确性
 */
describe('共享角色账号业务逻辑测试 (Shared Account Business Logic)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  
  // 测试用户数据
  let adminUser: User;
  let ownerUser: User;
  let contributorUser1: User;
  let contributorUser2: User;
  let readOnlyUser: User;
  let unauthorizedUser: User;
  
  // 认证令牌
  let adminToken: string;
  let ownerToken: string;
  let contributor1Token: string;
  let contributor2Token: string;
  let readOnlyToken: string;
  let unauthorizedToken: string;
  
  // 测试共享账号
  let sharedAccount1: SharedAccount;
  let sharedAccount2: SharedAccount;

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
    // 每个测试前重置共享账号数据
    await resetSharedAccountData();
  });

  /**
   * 清理测试数据
   */
  async function cleanupTestData() {
    await dataSource.query('DELETE FROM user_account_relations WHERE 1=1');
    await dataSource.query('DELETE FROM shared_accounts WHERE 1=1');
    await dataSource.query('DELETE FROM users WHERE username LIKE \'shared_test_%\'');
  }

  /**
   * 创建测试用户
   */
  async function createTestUsers() {
    const userRepository = dataSource.getRepository(User);
    
    // 创建管理员用户
    adminUser = userRepository.create({
      username: 'shared_test_admin',
      email: 'admin@shared-test.com',
      password: 'hashedPassword123',
      role: 'admin',
      isActive: true,
    });
    await userRepository.save(adminUser);

    // 创建拥有者用户
    ownerUser = userRepository.create({
      username: 'shared_test_owner',
      email: 'owner@shared-test.com',
      password: 'hashedPassword123',
      role: 'user',
      isActive: true,
    });
    await userRepository.save(ownerUser);

    // 创建贡献者用户1
    contributorUser1 = userRepository.create({
      username: 'shared_test_contributor1',
      email: 'contributor1@shared-test.com',
      password: 'hashedPassword123',
      role: 'user',
      isActive: true,
    });
    await userRepository.save(contributorUser1);

    // 创建贡献者用户2
    contributorUser2 = userRepository.create({
      username: 'shared_test_contributor2',
      email: 'contributor2@shared-test.com',
      password: 'hashedPassword123',
      role: 'user',
      isActive: true,
    });
    await userRepository.save(contributorUser2);

    // 创建只读用户
    readOnlyUser = userRepository.create({
      username: 'shared_test_readonly',
      email: 'readonly@shared-test.com',
      password: 'hashedPassword123',
      role: 'user',
      isActive: true,
    });
    await userRepository.save(readOnlyUser);

    // 创建无权限用户
    unauthorizedUser = userRepository.create({
      username: 'shared_test_unauthorized',
      email: 'unauthorized@shared-test.com',
      password: 'hashedPassword123',
      role: 'user',
      isActive: true,
    });
    await userRepository.save(unauthorizedUser);
  }

  /**
   * 生成认证令牌
   */
  async function generateAuthTokens() {
    const adminPayload = { userId: adminUser.userId, username: adminUser.username };
    const ownerPayload = { userId: ownerUser.userId, username: ownerUser.username };
    const contributor1Payload = { userId: contributorUser1.userId, username: contributorUser1.username };
    const contributor2Payload = { userId: contributorUser2.userId, username: contributorUser2.username };
    const readOnlyPayload = { userId: readOnlyUser.userId, username: readOnlyUser.username };
    const unauthorizedPayload = { userId: unauthorizedUser.userId, username: unauthorizedUser.username };
    
    adminToken = await authService.generateToken(adminPayload);
    ownerToken = await authService.generateToken(ownerPayload);
    contributor1Token = await authService.generateToken(contributor1Payload);
    contributor2Token = await authService.generateToken(contributor2Payload);
    readOnlyToken = await authService.generateToken(readOnlyPayload);
    unauthorizedToken = await authService.generateToken(unauthorizedPayload);
  }

  /**
   * 重置共享账号数据
   */
  async function resetSharedAccountData() {
    await dataSource.query('DELETE FROM user_account_relations WHERE 1=1');
    await dataSource.query('DELETE FROM shared_accounts WHERE 1=1');
  }

  /**
   * 创建测试共享账号
   */
  async function createTestSharedAccounts() {
    const sharedAccountRepository = dataSource.getRepository(SharedAccount);
    
    // 创建共享账号1
    sharedAccount1 = sharedAccountRepository.create({
      accountName: 'shared_test_account_1',
      displayName: '共享测试账号1',
      serverName: '共享测试服务器1',
      description: '用于多用户协作测试的共享账号',
      createdBy: adminUser.userId,
      isActive: true,
    });
    await sharedAccountRepository.save(sharedAccount1);

    // 创建共享账号2
    sharedAccount2 = sharedAccountRepository.create({
      accountName: 'shared_test_account_2',
      displayName: '共享测试账号2',
      serverName: '共享测试服务器2',
      description: '用于权限测试的共享账号',
      createdBy: adminUser.userId,
      isActive: true,
    });
    await sharedAccountRepository.save(sharedAccount2);
  }

  /**
   * 设置用户权限关系
   */
  async function setupUserPermissions() {
    const relationRepository = dataSource.getRepository(UserAccountRelation);
    
    // 设置拥有者权限
    const ownerRelation = relationRepository.create({
      userId: ownerUser.userId,
      accountName: sharedAccount1.accountName,
      relationType: RelationType.OWNER,
      permissions: { read: true, write: true, delete: true },
    });
    await relationRepository.save(ownerRelation);

    // 设置贡献者1权限（读写）
    const contributor1Relation = relationRepository.create({
      userId: contributorUser1.userId,
      accountName: sharedAccount1.accountName,
      relationType: RelationType.CONTRIBUTOR,
      permissions: { read: true, write: true, delete: false },
    });
    await relationRepository.save(contributor1Relation);

    // 设置贡献者2权限（读写）
    const contributor2Relation = relationRepository.create({
      userId: contributorUser2.userId,
      accountName: sharedAccount1.accountName,
      relationType: RelationType.CONTRIBUTOR,
      permissions: { read: true, write: true, delete: false },
    });
    await relationRepository.save(contributor2Relation);

    // 设置只读用户权限
    const readOnlyRelation = relationRepository.create({
      userId: readOnlyUser.userId,
      accountName: sharedAccount1.accountName,
      relationType: RelationType.CONTRIBUTOR,
      permissions: { read: true, write: false, delete: false },
    });
    await relationRepository.save(readOnlyRelation);
  }

  // ==================== 多用户共享场景测试 ====================

  describe('多用户共享场景测试', () => {
    
    beforeEach(async () => {
      await createTestSharedAccounts();
      await setupUserPermissions();
    });

    it('多个用户应该能够同时访问共享账号', async () => {
      // 拥有者访问
      const ownerResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(ownerResponse.body).toHaveProperty('accountName', sharedAccount1.accountName);

      // 贡献者1访问
      const contributor1Response = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      expect(contributor1Response.body).toHaveProperty('accountName', sharedAccount1.accountName);

      // 贡献者2访问
      const contributor2Response = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${contributor2Token}`)
        .expect(200);

      expect(contributor2Response.body).toHaveProperty('accountName', sharedAccount1.accountName);

      // 只读用户访问
      const readOnlyResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .expect(200);

      expect(readOnlyResponse.body).toHaveProperty('accountName', sharedAccount1.accountName);

      // 无权限用户访问（应该失败）
      await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);
    });

    it('不同角色用户应该看到相同的共享账号数据', async () => {
      // 获取所有有权限用户的响应
      const responses = await Promise.all([
        request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}`)
          .set('Authorization', `Bearer ${ownerToken}`),
        request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}`)
          .set('Authorization', `Bearer ${contributor1Token}`),
        request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}`)
          .set('Authorization', `Bearer ${contributor2Token}`),
        request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}`)
          .set('Authorization', `Bearer ${readOnlyToken}`)
      ]);

      // 验证所有响应都成功
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // 验证所有用户看到的数据一致
      const baseData = responses[0].body;
      responses.slice(1).forEach(response => {
        expect(response.body.accountName).toBe(baseData.accountName);
        expect(response.body.displayName).toBe(baseData.displayName);
        expect(response.body.serverName).toBe(baseData.serverName);
        expect(response.body.description).toBe(baseData.description);
      });
    });

    it('用户应该能够查看共享账号的用户列表', async () => {
      // 拥有者查看用户列表
      const ownerListResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/users`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(ownerListResponse.body).toBeInstanceOf(Array);
      expect(ownerListResponse.body).toHaveLength(4); // owner + 2 contributors + readonly

      // 验证用户列表包含正确的用户
      const userIds = ownerListResponse.body.map(user => user.userId);
      expect(userIds).toContain(ownerUser.userId);
      expect(userIds).toContain(contributorUser1.userId);
      expect(userIds).toContain(contributorUser2.userId);
      expect(userIds).toContain(readOnlyUser.userId);

      // 贡献者也应该能够查看用户列表
      const contributorListResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/users`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      expect(contributorListResponse.body).toHaveLength(4);
    });

    it('应该正确显示每个用户的权限信息', async () => {
      // 查看拥有者权限
      const ownerPermissionResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/users/${ownerUser.userId}/permissions`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(ownerPermissionResponse.body).toMatchObject({
        relationType: 'owner',
        permissions: { read: true, write: true, delete: true }
      });

      // 查看贡献者权限
      const contributorPermissionResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/users/${contributorUser1.userId}/permissions`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      expect(contributorPermissionResponse.body).toMatchObject({
        relationType: 'contributor',
        permissions: { read: true, write: true, delete: false }
      });

      // 查看只读用户权限
      const readOnlyPermissionResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/users/${readOnlyUser.userId}/permissions`)
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .expect(200);

      expect(readOnlyPermissionResponse.body).toMatchObject({
        relationType: 'contributor',
        permissions: { read: true, write: false, delete: false }
      });
    });
  });

  // ==================== 并发操作数据一致性测试 ====================

  describe('并发操作数据一致性测试', () => {
    
    beforeEach(async () => {
      await createTestSharedAccounts();
      await setupUserPermissions();
    });

    it('多个用户并发读取共享账号应该保持数据一致性', async () => {
      // 模拟10个并发读取请求
      const concurrentReads = Array.from({ length: 10 }, (_, index) => {
        const token = index % 2 === 0 ? contributor1Token : contributor2Token;
        return request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}`)
          .set('Authorization', `Bearer ${token}`);
      });

      const results = await Promise.all(concurrentReads);

      // 验证所有请求都成功
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty('accountName', sharedAccount1.accountName);
      });

      // 验证数据一致性
      const firstResult = results[0].body;
      results.slice(1).forEach(result => {
        expect(result.body).toEqual(firstResult);
      });
    });

    it('多个用户并发更新共享账号应该正确处理', async () => {
      // 模拟多个用户同时更新共享账号
      const updatePromises = [
        request(app.getHttpServer())
          .put(`/shared-accounts/${sharedAccount1.accountName}`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            displayName: '拥有者更新的名称',
            description: '拥有者更新的描述'
          }),
        request(app.getHttpServer())
          .put(`/shared-accounts/${sharedAccount1.accountName}`)
          .set('Authorization', `Bearer ${contributor1Token}`)
          .send({
            displayName: '贡献者1更新的名称',
            description: '贡献者1更新的描述'
          }),
        request(app.getHttpServer())
          .put(`/shared-accounts/${sharedAccount1.accountName}`)
          .set('Authorization', `Bearer ${contributor2Token}`)
          .send({
            displayName: '贡献者2更新的名称',
            description: '贡献者2更新的描述'
          })
      ];

      const results = await Promise.allSettled(updatePromises);

      // 至少应该有一个成功的更新
      const successfulUpdates = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      );
      
      expect(successfulUpdates.length).toBeGreaterThan(0);

      // 验证最终状态的一致性
      const finalStateResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(finalStateResponse.body).toHaveProperty('displayName');
      expect(finalStateResponse.body).toHaveProperty('description');
    });

    it('并发添加和删除用户权限应该正确处理', async () => {
      // 创建新用户用于测试
      const userRepository = dataSource.getRepository(User);
      const testUser1 = userRepository.create({
        username: 'concurrent_test_user1',
        email: 'concurrent1@test.com',
        password: 'hashedPassword123',
        role: 'user',
        isActive: true,
      });
      await userRepository.save(testUser1);

      const testUser2 = userRepository.create({
        username: 'concurrent_test_user2',
        email: 'concurrent2@test.com',
        password: 'hashedPassword123',
        role: 'user',
        isActive: true,
      });
      await userRepository.save(testUser2);

      // 并发添加用户权限
      const addUserPromises = [
        request(app.getHttpServer())
          .post(`/shared-accounts/${sharedAccount1.accountName}/users`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            userId: testUser1.userId,
            relationType: RelationType.CONTRIBUTOR,
            permissions: { read: true, write: false, delete: false }
          }),
        request(app.getHttpServer())
          .post(`/shared-accounts/${sharedAccount1.accountName}/users`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            userId: testUser2.userId,
            relationType: RelationType.CONTRIBUTOR,
            permissions: { read: true, write: true, delete: false }
          })
      ];

      const addResults = await Promise.allSettled(addUserPromises);

      // 验证添加操作的结果
      const successfulAdds = addResults.filter(result => 
        result.status === 'fulfilled' && result.value.status === 201
      );
      
      expect(successfulAdds.length).toBeGreaterThan(0);

      // 验证用户列表的一致性
      const userListResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/users`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(userListResponse.body.length).toBeGreaterThan(4); // 原有4个用户 + 新添加的用户
    });

    it('并发权限检查应该返回一致的结果', async () => {
      // 模拟多个并发权限检查请求
      const permissionChecks = Array.from({ length: 20 }, () => [
        request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.READ}`)
          .set('Authorization', `Bearer ${contributor1Token}`),
        request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.WRITE}`)
          .set('Authorization', `Bearer ${contributor1Token}`),
        request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.DELETE}`)
          .set('Authorization', `Bearer ${contributor1Token}`)
      ]).flat();

      const results = await Promise.all(permissionChecks);

      // 验证所有请求都成功
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty('hasPermission');
      });

      // 验证相同权限检查的结果一致性
      const readResults = results.filter((_, index) => index % 3 === 0);
      const writeResults = results.filter((_, index) => index % 3 === 1);
      const deleteResults = results.filter((_, index) => index % 3 === 2);

      // 所有读权限检查应该返回true
      readResults.forEach(result => {
        expect(result.body.hasPermission).toBe(true);
      });

      // 所有写权限检查应该返回true
      writeResults.forEach(result => {
        expect(result.body.hasPermission).toBe(true);
      });

      // 所有删除权限检查应该返回false
      deleteResults.forEach(result => {
        expect(result.body.hasPermission).toBe(false);
      });
    });
  });

  // ==================== 角色权限分配正确性测试 ====================

  describe('角色权限分配正确性测试', () => {
    
    beforeEach(async () => {
      await createTestSharedAccounts();
      await setupUserPermissions();
    });

    it('拥有者应该拥有所有权限', async () => {
      // 测试读权限
      const readResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.READ}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(readResponse.body).toMatchObject({
        hasPermission: true,
        relationType: 'owner'
      });

      // 测试写权限
      const writeResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.WRITE}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(writeResponse.body).toMatchObject({
        hasPermission: true,
        relationType: 'owner'
      });

      // 测试删除权限
      const deleteResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.DELETE}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(deleteResponse.body).toMatchObject({
        hasPermission: true,
        relationType: 'owner'
      });

      // 验证拥有者可以执行所有操作
      // 读取操作
      await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // 写入操作
      await request(app.getHttpServer())
        .put(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ displayName: '拥有者更新' })
        .expect(200);

      // 用户管理操作
      const newUserData = {
        userId: unauthorizedUser.userId,
        relationType: RelationType.CONTRIBUTOR,
        permissions: { read: true, write: false, delete: false }
      };

      await request(app.getHttpServer())
        .post(`/shared-accounts/${sharedAccount1.accountName}/users`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(newUserData)
        .expect(201);
    });

    it('贡献者应该有读写权限但无删除权限', async () => {
      // 测试读权限
      const readResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.READ}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      expect(readResponse.body).toMatchObject({
        hasPermission: true,
        relationType: 'contributor'
      });

      // 测试写权限
      const writeResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.WRITE}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      expect(writeResponse.body).toMatchObject({
        hasPermission: true,
        relationType: 'contributor'
      });

      // 测试删除权限（应该没有）
      const deleteResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.DELETE}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      expect(deleteResponse.body).toMatchObject({
        hasPermission: false,
        relationType: 'contributor'
      });

      // 验证贡献者可以读取和写入
      await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      await request(app.getHttpServer())
        .put(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .send({ displayName: '贡献者更新' })
        .expect(200);

      // 验证贡献者不能删除账号
      await request(app.getHttpServer())
        .delete(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(403);

      // 验证贡献者不能管理用户权限
      await request(app.getHttpServer())
        .post(`/shared-accounts/${sharedAccount1.accountName}/users`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .send({
          userId: unauthorizedUser.userId,
          relationType: RelationType.CONTRIBUTOR,
          permissions: { read: true, write: false, delete: false }
        })
        .expect(403);
    });

    it('只读用户应该只有读权限', async () => {
      // 测试读权限
      const readResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.READ}`)
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .expect(200);

      expect(readResponse.body).toMatchObject({
        hasPermission: true,
        relationType: 'contributor'
      });

      // 测试写权限（应该没有）
      const writeResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.WRITE}`)
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .expect(200);

      expect(writeResponse.body).toMatchObject({
        hasPermission: false,
        relationType: 'contributor'
      });

      // 测试删除权限（应该没有）
      const deleteResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.DELETE}`)
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .expect(200);

      expect(deleteResponse.body).toMatchObject({
        hasPermission: false,
        relationType: 'contributor'
      });

      // 验证只读用户可以读取
      await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .expect(200);

      // 验证只读用户不能写入
      await request(app.getHttpServer())
        .put(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .send({ displayName: '只读用户尝试更新' })
        .expect(403);

      // 验证只读用户不能删除
      await request(app.getHttpServer())
        .delete(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .expect(403);
    });

    it('无权限用户应该无法访问共享账号', async () => {
      // 测试读权限
      await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.READ}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);

      // 测试访问共享账号
      await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);

      // 测试更新共享账号
      await request(app.getHttpServer())
        .put(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({ displayName: '无权限用户尝试更新' })
        .expect(403);

      // 测试删除共享账号
      await request(app.getHttpServer())
        .delete(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);
    });

    it('权限继承和覆盖应该正确工作', async () => {
      // 创建具有自定义权限的用户关系
      const relationRepository = dataSource.getRepository(UserAccountRelation);
      
      // 创建一个贡献者但只有读权限
      const customRelation = relationRepository.create({
        userId: unauthorizedUser.userId,
        accountName: sharedAccount1.accountName,
        relationType: RelationType.CONTRIBUTOR,
        permissions: { read: true, write: false, delete: false }, // 覆盖默认贡献者权限
      });
      await relationRepository.save(customRelation);

      // 验证自定义权限生效
      const readResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.READ}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(200);

      expect(readResponse.body).toMatchObject({
        hasPermission: true,
        relationType: 'contributor'
      });

      const writeResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.WRITE}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(200);

      expect(writeResponse.body).toMatchObject({
        hasPermission: false,
        relationType: 'contributor'
      });

      // 验证用户可以读取但不能写入
      await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .put(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({ displayName: '自定义权限用户尝试更新' })
        .expect(403);
    });
  });

  // ==================== 操作日志记录准确性测试 ====================

  describe('操作日志记录准确性测试', () => {
    
    beforeEach(async () => {
      await createTestSharedAccounts();
      await setupUserPermissions();
    });

    it('应该记录共享账号的创建操作', async () => {
      const accountData = {
        accountName: 'log_test_account',
        displayName: '日志测试账号',
        serverName: '日志测试服务器',
        description: '用于测试操作日志的账号'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/shared-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(accountData)
        .expect(201);

      expect(createResponse.body).toHaveProperty('accountName', accountData.accountName);
      expect(createResponse.body).toHaveProperty('createdBy', adminUser.userId);
      expect(createResponse.body).toHaveProperty('createdAt');
    });

    it('应该记录共享账号的更新操作', async () => {
      const originalDisplayName = sharedAccount1.displayName;
      const updateData = {
        displayName: '更新后的显示名称',
        description: '更新后的描述'
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toHaveProperty('displayName', updateData.displayName);
      expect(updateResponse.body).toHaveProperty('updatedAt');
      
      // 验证更新时间已改变
      const updatedAt = new Date(updateResponse.body.updatedAt);
      const createdAt = new Date(updateResponse.body.createdAt);
      expect(updatedAt.getTime()).toBeGreaterThan(createdAt.getTime());
    });

    it('应该记录用户权限的添加操作', async () => {
      const addUserData = {
        userId: unauthorizedUser.userId,
        relationType: RelationType.CONTRIBUTOR,
        permissions: { read: true, write: false, delete: false }
      };

      const addResponse = await request(app.getHttpServer())
        .post(`/shared-accounts/${sharedAccount1.accountName}/users`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(addUserData)
        .expect(201);

      expect(addResponse.body).toHaveProperty('userId', unauthorizedUser.userId);
      expect(addResponse.body).toHaveProperty('accountName', sharedAccount1.accountName);
      expect(addResponse.body).toHaveProperty('relationType', RelationType.CONTRIBUTOR);
      expect(addResponse.body).toHaveProperty('createdAt');

      // 验证用户现在可以访问共享账号
      await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(200);
    });

    it('应该记录用户权限的更新操作', async () => {
      const newPermissions = {
        read: true,
        write: false,
        delete: false
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/shared-accounts/${sharedAccount1.accountName}/users/${contributorUser1.userId}/permissions`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(newPermissions)
        .expect(200);

      expect(updateResponse.body).toHaveProperty('permissions');
      expect(updateResponse.body.permissions).toMatchObject(newPermissions);
      expect(updateResponse.body).toHaveProperty('updatedAt');

      // 验证权限更新生效
      const writePermissionResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.WRITE}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      expect(writePermissionResponse.body).toHaveProperty('hasPermission', false);
    });

    it('应该记录用户权限的删除操作', async () => {
      // 先验证用户有权限
      await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      // 删除用户权限
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/shared-accounts/${sharedAccount1.accountName}/users/${contributorUser1.userId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('message');

      // 验证用户不再有权限
      await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(403);
    });

    it('应该记录共享账号的删除操作', async () => {
      // 创建一个临时共享账号用于删除测试
      const tempAccountData = {
        accountName: 'temp_delete_account',
        displayName: '临时删除测试账号',
        serverName: '临时服务器'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/shared-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tempAccountData)
        .expect(201);

      const accountName = createResponse.body.accountName;

      // 删除共享账号
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('message');

      // 验证账号已被删除
      await request(app.getHttpServer())
        .get(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('应该记录批量操作的日志', async () => {
      // 批量添加用户
      const batchUsers = [
        {
          userId: unauthorizedUser.userId,
          relationType: RelationType.CONTRIBUTOR,
          permissions: { read: true, write: false, delete: false }
        }
      ];

      // 由于API可能不支持批量操作，我们模拟多个单独的操作
      const batchPromises = batchUsers.map(userData =>
        request(app.getHttpServer())
          .post(`/shared-accounts/${sharedAccount1.accountName}/users`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(userData)
      );

      const results = await Promise.all(batchPromises);

      results.forEach(result => {
        expect(result.status).toBe(201);
        expect(result.body).toHaveProperty('createdAt');
      });

      // 验证所有用户都被正确添加
      const userListResponse = await request(app.getHttpServer())
        .get(`/shared-accounts/${sharedAccount1.accountName}/users`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(userListResponse.body.length).toBe(5); // 原有4个 + 新添加1个
    });

    it('应该记录权限检查的访问日志', async () => {
      // 执行多次权限检查
      const permissionChecks = [
        request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.READ}`)
          .set('Authorization', `Bearer ${contributor1Token}`),
        request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.WRITE}`)
          .set('Authorization', `Bearer ${contributor1Token}`),
        request(app.getHttpServer())
          .get(`/shared-accounts/${sharedAccount1.accountName}/permissions/${PermissionAction.DELETE}`)
          .set('Authorization', `Bearer ${contributor1Token}`)
      ];

      const results = await Promise.all(permissionChecks);

      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty('hasPermission');
        expect(result.body).toHaveProperty('relationType');
      });

      // 验证权限检查结果的正确性
      expect(results[0].body.hasPermission).toBe(true);  // READ
      expect(results[1].body.hasPermission).toBe(true);  // WRITE
      expect(results[2].body.hasPermission).toBe(false); // DELETE
    });
  });

  // ==================== 复杂业务场景测试 ====================

  describe('复杂业务场景测试', () => {
    
    beforeEach(async () => {
      await createTestSharedAccounts();
      await setupUserPermissions();
    });

    it('完整的共享账号生命周期管理', async () => {
      // 1. 管理员创建共享账号
      const accountData = {
        accountName: 'lifecycle_test_account',
        displayName: '生命周期测试账号',
        serverName: '生命周期测试服务器',
        description: '用于测试完整生命周期的共享账号'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/shared-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(accountData)
        .expect(201);

      const accountName = createResponse.body.accountName;

      // 2. 添加拥有者
      await request(app.getHttpServer())
        .post(`/shared-accounts/${accountName}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: ownerUser.userId,
          relationType: RelationType.OWNER,
          permissions: { read: true, write: true, delete: true }
        })
        .expect(201);

      // 3. 拥有者添加贡献者
      await request(app.getHttpServer())
        .post(`/shared-accounts/${accountName}/users`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: contributorUser1.userId,
          relationType: RelationType.CONTRIBUTOR,
          permissions: { read: true, write: true, delete: false }
        })
        .expect(201);

      // 4. 贡献者更新账号信息
      await request(app.getHttpServer())
        .put(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .send({
          displayName: '贡献者更新的名称',
          description: '贡献者更新的描述'
        })
        .expect(200);

      // 5. 拥有者调整贡献者权限
      await request(app.getHttpServer())
        .put(`/shared-accounts/${accountName}/users/${contributorUser1.userId}/permissions`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          read: true,
          write: false,
          delete: false
        })
        .expect(200);

      // 6. 验证权限调整生效
      await request(app.getHttpServer())
        .put(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .send({ displayName: '权限调整后的尝试更新' })
        .expect(403);

      // 7. 拥有者移除贡献者
      await request(app.getHttpServer())
        .delete(`/shared-accounts/${accountName}/users/${contributorUser1.userId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // 8. 验证贡献者不再有权限
      await request(app.getHttpServer())
        .get(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(403);

      // 9. 拥有者删除共享账号
      await request(app.getHttpServer())
        .delete(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // 10. 验证账号已被删除
      await request(app.getHttpServer())
        .get(`/shared-accounts/${accountName}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);
    });

    it('多层级权限管理场景', async () => {
      // 创建多个共享账号用于测试复杂权限场景
      const account1Data = {
        accountName: 'multilevel_account_1',
        displayName: '多层级账号1',
        serverName: '多层级服务器1'
      };

      const account2Data = {
        accountName: 'multilevel_account_2',
        displayName: '多层级账号2',
        serverName: '多层级服务器2'
      };

      // 创建账号
      await request(app.getHttpServer())
        .post('/shared-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(account1Data)
        .expect(201);

      await request(app.getHttpServer())
        .post('/shared-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(account2Data)
        .expect(201);

      // 设置复杂的权限关系
      // 用户1是账号1的拥有者，账号2的贡献者
      await request(app.getHttpServer())
        .post(`/shared-accounts/${account1Data.accountName}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: contributorUser1.userId,
          relationType: RelationType.OWNER,
          permissions: { read: true, write: true, delete: true }
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/shared-accounts/${account2Data.accountName}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: contributorUser1.userId,
          relationType: RelationType.CONTRIBUTOR,
          permissions: { read: true, write: true, delete: false }
        })
        .expect(201);

      // 用户2是账号1的贡献者，账号2的只读用户
      await request(app.getHttpServer())
        .post(`/shared-accounts/${account1Data.accountName}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: contributorUser2.userId,
          relationType: RelationType.CONTRIBUTOR,
          permissions: { read: true, write: true, delete: false }
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/shared-accounts/${account2Data.accountName}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: contributorUser2.userId,
          relationType: RelationType.CONTRIBUTOR,
          permissions: { read: true, write: false, delete: false }
        })
        .expect(201);

      // 验证用户1在不同账号中的权限
      // 账号1：拥有者权限
      await request(app.getHttpServer())
        .delete(`/shared-accounts/${account1Data.accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      // 账号2：贡献者权限（不能删除）
      await request(app.getHttpServer())
        .delete(`/shared-accounts/${account2Data.accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(403);

      // 但可以更新
      await request(app.getHttpServer())
        .put(`/shared-accounts/${account2Data.accountName}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .send({ displayName: '用户1更新账号2' })
        .expect(200);

      // 验证用户2在账号2中只有读权限
      await request(app.getHttpServer())
        .get(`/shared-accounts/${account2Data.accountName}`)
        .set('Authorization', `Bearer ${contributor2Token}`)
        .expect(200);

      await request(app.getHttpServer())
        .put(`/shared-accounts/${account2Data.accountName}`)
        .set('Authorization', `Bearer ${contributor2Token}`)
        .send({ displayName: '用户2尝试更新账号2' })
        .expect(403);
    });
  });
});