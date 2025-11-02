-- 诛仙世界多账号管理系统数据库初始化脚本

-- 创建数据库（如果不存在）
-- CREATE DATABASE zxsj_multi_account_hub;

-- 连接到数据库
\c zxsj_multi_account_hub;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建账号表
CREATE TABLE IF NOT EXISTS accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建副本模板表
CREATE TABLE IF NOT EXISTS dungeon_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dungeon_name VARCHAR(100) NOT NULL,
    bosses TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建周常任务模板表
CREATE TABLE IF NOT EXISTS weekly_task_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(100) NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建周进度表
CREATE TABLE IF NOT EXISTS weekly_progress (
    progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    dungeon_progress JSONB DEFAULT '{}',
    weekly_task_progress JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, week_start)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_weekly_progress_account_id ON weekly_progress(account_id);
CREATE INDEX IF NOT EXISTS idx_weekly_progress_week_start ON weekly_progress(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_progress_last_updated ON weekly_progress(last_updated);

-- 插入默认副本模板数据
INSERT INTO dungeon_templates (dungeon_name, bosses) VALUES
('天音寺', ARRAY['方丈', '首座', '戒律堂主']),
('青云门', ARRAY['掌门', '大竹峰首座', '小竹峰首座']),
('鬼王宗', ARRAY['鬼王', '青龙堂主', '白虎堂主']),
('合欢派', ARRAY['合欢老祖', '痴情司主', '无情司主']),
('焚香谷', ARRAY['谷主', '长老甲', '长老乙'])
ON CONFLICT DO NOTHING;

-- 插入默认周常任务模板数据
INSERT INTO weekly_task_templates (task_name, target_count) VALUES
('日常任务', 7),
('师门任务', 7),
('帮派任务', 7),
('副本挑战', 3),
('竞技场', 10),
('世界BOSS', 2)
ON CONFLICT DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为各表创建更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dungeon_templates_updated_at BEFORE UPDATE ON dungeon_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_task_templates_updated_at BEFORE UPDATE ON weekly_task_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建清理旧进度数据的函数
CREATE OR REPLACE FUNCTION cleanup_old_progress(weeks_to_keep INTEGER DEFAULT 4)
RETURNS INTEGER AS $$
DECLARE
    cutoff_date DATE;
    deleted_count INTEGER;
BEGIN
    cutoff_date := CURRENT_DATE - (weeks_to_keep * 7);
    
    DELETE FROM weekly_progress 
    WHERE week_start < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 输出初始化完成信息
DO $$
BEGIN
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '- 已创建所有必要的表和索引';
    RAISE NOTICE '- 已插入默认模板数据';
    RAISE NOTICE '- 已创建触发器和函数';
END $$;