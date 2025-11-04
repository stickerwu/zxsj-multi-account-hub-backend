/*
 * 验证管理员账号是否按 .env 配置应用：
 * 1) 调用登录接口，使用 .env 中的管理员用户名与密码
 * 2) 连接 MySQL 查询 users 表，检查管理员账号字段是否与 .env 对齐
 */
require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');

(async () => {
  const username = process.env.DEFAULT_ADMIN_USERNAME;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  const email = process.env.DEFAULT_ADMIN_EMAIL;

  console.log('🔎 使用 .env 配置进行验证');
  console.log(` - 用户名: ${username}`);
  console.log(` - 邮箱: ${email}`);

  // 1) 测试登录
  try {
    const loginResp = await axios.post('http://localhost:3000/api/auth/login', {
      credential: username,
      password: password,
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ 登录成功，返回信息:');
    console.log(JSON.stringify(loginResp.data, null, 2));
  } catch (e) {
    console.error('❌ 登录失败: ', e.response?.data || e.message);
    process.exitCode = 1;
  }

  // 2) 查询数据库 users 表
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows] = await conn.execute(
      'SELECT userId, username, email, role FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (rows.length === 0) {
      console.error('❌ 数据库中未找到 .env 指定的管理员用户名');
      process.exitCode = 1;
    } else {
      const user = rows[0];
      console.log('✅ 数据库存在该管理员用户:');
      console.log(user);
      if (user.role !== 'admin') {
        console.error(`❌ 数据库角色不为 admin，实际为: ${user.role}`);
        process.exitCode = 1;
      }
      if (email && user.email !== email) {
        console.warn(`⚠️ 数据库邮箱(${user.email})与 .env(${email}) 不一致`);
      } else {
        console.log('✅ 数据库邮箱与 .env 一致');
      }
    }

    await conn.end();
  } catch (e) {
    console.error('❌ 数据库验证失败: ', e.message);
    process.exitCode = 1;
  }
})();