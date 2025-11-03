const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function migrateAddRole() {
  const connection = await mysql.createConnection({
    host: 'stickerwu.net',
    user: 'stickerwu',
    password: 'ja6QjjfbQ5KRWcnA',
    database: 'zxsj-account-hub'
  });

  try {
    console.log('开始添加role字段...');
    
    // 检查role字段是否已存在
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'zxsj-account-hub' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);

    if (columns.length === 0) {
      // 添加role字段
      await connection.execute(`
        ALTER TABLE users ADD COLUMN role ENUM('admin', 'user') NOT NULL DEFAULT 'user'
      `);
      console.log('✅ role字段添加成功');
    } else {
      console.log('✅ role字段已存在');
    }

    // 检查管理员账号是否存在
    const [adminUsers] = await connection.execute(`
      SELECT userId FROM users WHERE username = 'stickerwu'
    `);

    if (adminUsers.length === 0) {
      // 创建管理员账号
      const hashedPassword = await bcrypt.hash('wuCHANGWEI0519', 10);
      const adminId = uuidv4();
      
      await connection.execute(`
        INSERT INTO users (userId, username, email, passwordHash, role, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, 'admin', NOW(), NOW())
      `, [adminId, 'stickerwu', 'admin@example.com', hashedPassword]);
      
      console.log('✅ 管理员账号创建成功');
      console.log(`   用户名: stickerwu`);
      console.log(`   密码: wuCHANGWEI0519`);
      console.log(`   角色: admin`);
    } else {
      // 更新现有用户为管理员
      await connection.execute(`
        UPDATE users SET role = 'admin' WHERE username = 'stickerwu'
      `);
      console.log('✅ 现有用户已更新为管理员角色');
    }

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrateAddRole().then(() => {
  console.log('🎉 迁移完成！');
  process.exit(0);
}).catch(error => {
  console.error('❌ 迁移失败:', error);
  process.exit(1);
});