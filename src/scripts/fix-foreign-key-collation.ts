import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// 加载环境变量
config();

/**
 * 修复外键约束导致的字符集排序规则冲突问题
 * 通过临时删除外键约束，修改字符集，然后重新创建外键约束
 */
async function fixForeignKeyCollation() {
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

    const dbName = process.env.DB_NAME || 'zxsj_hub';

    console.log('开始修复外键约束字符集问题...');

    // 1. 获取所有外键约束信息
    console.log('1. 获取外键约束信息...');
    const foreignKeys = await dataSource.query(
      `
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE CONSTRAINT_SCHEMA = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `,
      [dbName],
    );

    console.log(`找到 ${foreignKeys.length} 个外键约束`);

    // 2. 临时删除外键约束
    console.log('2. 临时删除外键约束...');
    for (const fk of foreignKeys) {
      try {
        console.log(
          `   删除外键约束: ${fk.CONSTRAINT_NAME} (${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME})`,
        );
        await dataSource.query(
          `ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``,
        );
      } catch (error) {
        console.warn(
          `   警告: 删除外键约束 ${fk.CONSTRAINT_NAME} 失败:`,
          error.message,
        );
      }
    }

    // 3. 修改所有表的字符集
    console.log('3. 修改表字符集...');
    const tables = await dataSource.query(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
    `,
      [dbName],
    );

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      try {
        console.log(`   修改表 ${tableName} 字符集...`);
        await dataSource.query(
          `ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
        );
        console.log(`   ✓ 表 ${tableName} 修复成功`);
      } catch (error) {
        console.error(`   ✗ 表 ${tableName} 修复失败:`, error.message);
      }
    }

    // 4. 重新创建外键约束
    console.log('4. 重新创建外键约束...');
    for (const fk of foreignKeys) {
      try {
        console.log(`   创建外键约束: ${fk.CONSTRAINT_NAME}`);
        await dataSource.query(`
          ALTER TABLE \`${fk.TABLE_NAME}\` 
          ADD CONSTRAINT \`${fk.CONSTRAINT_NAME}\` 
          FOREIGN KEY (\`${fk.COLUMN_NAME}\`) 
          REFERENCES \`${fk.REFERENCED_TABLE_NAME}\` (\`${fk.REFERENCED_COLUMN_NAME}\`)
        `);
        console.log(`   ✓ 外键约束 ${fk.CONSTRAINT_NAME} 创建成功`);
      } catch (error) {
        console.error(
          `   ✗ 外键约束 ${fk.CONSTRAINT_NAME} 创建失败:`,
          error.message,
        );
      }
    }

    // 5. 检查修复结果
    console.log('5. 检查修复结果...');
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
      const isFixed = status.TABLE_COLLATION === 'utf8mb4_general_ci';
      const mark = isFixed ? '✓' : '✗';
      console.log(
        `${mark} ${status.TABLE_NAME.padEnd(20)}\t${status.TABLE_COLLATION}`,
      );
    }

    console.log('\n外键约束字符集修复完成！');
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
  fixForeignKeyCollation()
    .then(() => {
      console.log('外键约束修复脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('外键约束修复脚本执行失败:', error);
      process.exit(1);
    });
}

export { fixForeignKeyCollation };
