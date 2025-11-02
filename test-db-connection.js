const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...');
  console.log(`📍 连接信息:`);
  console.log(`   主机: ${process.env.DB_HOST}`);
  console.log(`   端口: ${process.env.DB_PORT}`);
  console.log(`   用户: ${process.env.DB_USERNAME}`);
  console.log(`   数据库: ${process.env.DB_NAME}`);
  
  try {
    // 创建连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    console.log('✅ 数据库连接成功！');

    // 测试基本查询
    const [rows] = await connection.execute('SELECT VERSION() as version, DATABASE() as database_name, NOW() as server_time');
    console.log('📊 数据库信息:');
    console.log(`   MySQL 版本: ${rows[0].version}`);
    console.log(`   当前数据库: ${rows[0].database_name}`);
    console.log(`   服务器时间: ${rows[0].server_time}`);

    // 检查数据库中的表
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📋 数据库中的表 (${tables.length} 个):`);
    if (tables.length > 0) {
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
    } else {
      console.log('   (暂无表，这是正常的，因为还没有运行迁移)');
    }

    // 关闭连接
    await connection.end();
    console.log('🔒 数据库连接已关闭');
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error(`   错误类型: ${error.code || 'UNKNOWN'}`);
    console.error(`   错误信息: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 建议: 检查主机地址是否正确，网络是否可达');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 建议: 检查用户名和密码是否正确');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 建议: 检查数据库名称是否正确');
    }
    
    return false;
  }
}

// 运行测试
testDatabaseConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 测试脚本执行失败:', error);
    process.exit(1);
  });