-- 添加role字段到users表
ALTER TABLE users ADD COLUMN role ENUM('admin', 'user') NOT NULL DEFAULT 'user';

-- 创建默认管理员账号（如果不存在）
INSERT IGNORE INTO users (userId, username, email, passwordHash, role, createdAt, updatedAt) 
VALUES (
    'admin-001', 
    'stickerwu', 
    'admin@example.com', 
    '$2b$10$YourHashedPasswordHere', 
    'admin', 
    NOW(), 
    NOW()
);