import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// 加载环境变量
config();

/**
 * 修复数据库字符集排序规则冲突问题
 * 将所有表统一设置为 utf8mb4_general_ci
 */
async function fixDatabaseCollation() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zxsj_hub',
    timezone: '+08:00',
    charset: 'utf8mb4',
  });

  try {
    console.log('连接数据库...');
    await dataSource.initialize();
    console.log('数据库连接成功');

    // 获取数据库名称
    const dbName = process.env.DB_NAME || 'zxsj_hub';

    console.log('开始修复字符集排序规则...');

    // 修改数据库默认字符集
    console.log('1. 修改数据库默认字符集...');
    await dataSource.query(
      `ALTER DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
    );

    // 获取所有表名
    const tables = await dataSource.query(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
    `,
      [dbName],
    );

    console.log(`找到 ${tables.length} 个表需要修复`);

    // 修复每个表的字符集
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`2. 修复表 ${tableName} 的字符集...`);

      try {
        await dataSource.query(
          `ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
        );
        console.log(`   ✓ 表 ${tableName} 修复成功`);
      } catch (error) {
        console.error(`   ✗ 表 ${tableName} 修复失败:`, error.message);
      }
    }

    // 显示修复后的表信息
    console.log('3. 检查修复结果...');
    const tableStatus = await dataSource.query(
      `
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `,
      [dbName],
    );

    console.log('\n修复结果:');
    console.log('表名\t\t\t排序规则');
    console.log('----------------------------------------');
    for (const status of tableStatus) {
      console.log(`${status.TABLE_NAME.padEnd(20)}\t${status.TABLE_COLLATION}`);
    }

    console.log('\n字符集排序规则修复完成！');
  } catch (error) {
    console.error('修复过程中发生错误:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行修复
if (require.main === module) {
  fixDatabaseCollation()
    .then(() => {
      console.log('修复脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('修复脚本执行失败:', error);
      process.exit(1);
    });
}

export { fixDatabaseCollation };
