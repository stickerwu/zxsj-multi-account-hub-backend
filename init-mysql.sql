-- 诛仙世界多账号管理系统 MySQL 数据库初始化脚本

-- 使用数据库
USE `zxsj-account-hub`;

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS `weekly_progress`;
DROP TABLE IF EXISTS `user_account_relations`;
DROP TABLE IF EXISTS `shared_accounts`;
DROP TABLE IF EXISTS `accounts`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `weekly_task_templates`;
DROP TABLE IF EXISTS `dungeon_templates`;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `userId` varchar(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user' COMMENT '用户角色：admin-管理员，user-普通用户',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`userId`),
  UNIQUE KEY `UQ_users_username` (`username`),
  UNIQUE KEY `UQ_users_email` (`email`),
  UNIQUE KEY `UQ_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建账号表
CREATE TABLE IF NOT EXISTS `accounts` (
  `accountId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`accountId`),
  KEY `IDX_accounts_userId` (`userId`),
  KEY `IDX_accounts_name` (`name`),
  CONSTRAINT `FK_accounts_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建副本模板表
CREATE TABLE `dungeon_templates` (
    `templateId` VARCHAR(36) PRIMARY KEY,
    `dungeonName` VARCHAR(100) NOT NULL,
    `bosses` JSON NOT NULL,
    `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX `IDX_dungeon_templates_dungeonName` (`dungeonName`)
);

-- 创建周常任务模板表
CREATE TABLE `weekly_task_templates` (
    `templateId` VARCHAR(36) PRIMARY KEY,
    `taskName` VARCHAR(100) NOT NULL,
    `targetCount` INT NOT NULL DEFAULT 1,
    `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX `IDX_weekly_task_templates_taskName` (`taskName`)
);

-- 创建共享账号表
CREATE TABLE IF NOT EXISTS `shared_accounts` (
  `accountName` varchar(50) NOT NULL,
  `displayName` varchar(100) NOT NULL,
  `serverName` varchar(50) NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`accountName`),
  KEY `idx_shared_accounts_server_name` (`serverName`),
  KEY `idx_shared_accounts_is_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建用户与共享账号关联表
CREATE TABLE IF NOT EXISTS `user_account_relations` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `accountName` varchar(50) NOT NULL,
  `relationType` enum('owner','contributor') NOT NULL DEFAULT 'contributor',
  `permissions` json DEFAULT NULL,
  `joinedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_account_relations_user_account` (`userId`,`accountName`),
  KEY `idx_user_account_relations_user_id` (`userId`),
  KEY `idx_user_account_relations_account_name` (`accountName`),
  KEY `idx_user_account_relations_relation_type` (`relationType`),
  CONSTRAINT `fk_user_account_relations_user_id` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_account_relations_account_name` FOREIGN KEY (`accountName`) REFERENCES `shared_accounts` (`accountName`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建周常进度表（支持共享账号）
CREATE TABLE IF NOT EXISTS `weekly_progress` (
  `progressId` varchar(36) NOT NULL,
  `accountId` varchar(36) NULL,
  `sharedAccountName` varchar(50) NULL,
  `weekStart` date NOT NULL,
  `dungeonProgress` json DEFAULT NULL,
  `weeklyTaskProgress` json DEFAULT NULL,
  `lastUpdated` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`progressId`),
  UNIQUE KEY `UQ_weekly_progress_account_week` (`accountId`,`weekStart`),
  UNIQUE KEY `uk_weekly_progress_shared_account_week` (`sharedAccountName`,`weekStart`),
  KEY `IDX_weekly_progress_accountId` (`accountId`),
  KEY `IDX_weekly_progress_weekStart` (`weekStart`),
  KEY `idx_weekly_progress_shared_account_name` (`sharedAccountName`),
  CONSTRAINT `FK_weekly_progress_accountId` FOREIGN KEY (`accountId`) REFERENCES `accounts` (`accountId`) ON DELETE CASCADE,
  CONSTRAINT `fk_weekly_progress_shared_account_name` FOREIGN KEY (`sharedAccountName`) REFERENCES `shared_accounts` (`accountName`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 插入默认副本模板数据
INSERT INTO `dungeon_templates` (`templateId`, `dungeonName`, `bosses`) VALUES
(UUID(), '天音寺', JSON_ARRAY('方丈', '首座', '戒律堂主')),
(UUID(), '青云门', JSON_ARRAY('掌门', '大竹峰首座', '小竹峰首座')),
(UUID(), '鬼王宗', JSON_ARRAY('鬼王', '青龙堂主', '白虎堂主')),
(UUID(), '焚香谷', JSON_ARRAY('谷主', '长老甲', '长老乙'));

-- 插入默认周常任务模板数据
INSERT INTO `weekly_task_templates` (`templateId`, `taskName`, `targetCount`) VALUES
(UUID(), '日常任务', 7),
(UUID(), '师门任务', 7),
(UUID(), '帮派任务', 7),
(UUID(), '副本挑战', 3),
(UUID(), '竞技场', 10),
(UUID(), '世界BOSS', 2);

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 输出初始化完成信息
SELECT '数据库初始化完成！' AS message;
SELECT '- 已创建所有必要的表和索引' AS message;
SELECT '- 已插入默认模板数据' AS message;