const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  console.log('🔧 开始初始化数据库...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, '..', 'init-mysql.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 执行 SQL 脚本...');
    
    // 分割 SQL 语句并逐个执行
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // 先禁用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🔧 已禁用外键检查');
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✅ 执行成功:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
            console.log('⚠️ 跳过已存在的表或索引:', statement.substring(0, 50) + '...');
          } else {
            console.error('❌ 执行失败:', statement.substring(0, 50) + '...');
            console.error('错误:', error.message);
          }
        }
      }
    }
    
    // 重新启用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🔧 已重新启用外键检查');
    
    console.log('🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();