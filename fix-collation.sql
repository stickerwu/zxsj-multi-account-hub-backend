-- 修复数据库字符集排序规则冲突问题
-- 将所有表统一设置为 utf8mb4_general_ci

-- 修改数据库默认字符集
ALTER DATABASE `zxsj-account-hub` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 修改 users 表
ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 修改 shared_accounts 表
ALTER TABLE `shared_accounts` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 修改 user_account_relations 表
ALTER TABLE `user_account_relations` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 修改 accounts 表（如果存在）
ALTER TABLE `accounts` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 修改 dungeon_templates 表（如果存在）
ALTER TABLE `dungeon_templates` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 修改 weekly_task_templates 表（如果存在）
ALTER TABLE `weekly_task_templates` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 修改 weekly_progress 表（如果存在）
ALTER TABLE `weekly_progress` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 显示修改后的表信息
SHOW TABLE STATUS WHERE Name IN ('users', 'shared_accounts', 'user_account_relations', 'accounts', 'dungeon_templates', 'weekly_task_templates', 'weekly_progress');