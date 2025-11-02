# 部署指南

本文档详细说明了诛仙世界多账号管理系统后端的部署方式和配置要求。

## 📋 部署架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   后端应用      │    │   数据库服务    │
│  (Frontend)     │───▶│  (Backend)      │───▶│  (PostgreSQL)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   反向代理      │
                       │   (Nginx)       │
                       │   [可选]        │
                       └─────────────────┘
```

## 🚀 部署方式

### 1. 生产环境部署（推荐）

#### 1.1 准备数据库

**选项 A: 使用云数据库服务**
- AWS RDS PostgreSQL
- Google Cloud SQL
- Azure Database for PostgreSQL
- 阿里云 RDS PostgreSQL

**选项 B: 自建数据库服务器**
```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE zxsj_multi_account_hub;
CREATE USER zxsj_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE zxsj_multi_account_hub TO zxsj_user;
\q
```

#### 1.2 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**生产环境必须配置的变量**：
```env
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=your-database-host.com
DB_PORT=5432
DB_USERNAME=zxsj_user
DB_PASSWORD=your_secure_password
DB_NAME=zxsj_multi_account_hub

# JWT 配置
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_at_least_32_characters
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=https://your-frontend-domain.com

# 日志配置
LOG_LEVEL=info
```

#### 1.3 部署应用

**使用部署脚本**：
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**手动部署**：
```bash
# 构建并启动应用
docker-compose up -d backend

# 如需 Nginx 反向代理
WITH_NGINX=true docker-compose --profile with-nginx up -d
```

### 2. 开发环境部署

#### 2.1 使用本地数据库

```bash
# 启动本地 PostgreSQL (Docker)
docker run -d \
  --name postgres-dev \
  -e POSTGRES_DB=zxsj_multi_account_hub \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 2.2 配置开发环境变量

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=zxsj_multi_account_hub
JWT_SECRET=dev_jwt_secret_key_for_development_only
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=debug
```

#### 2.3 启动开发服务

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run start:dev
```

## 🔧 高级配置

### Nginx 反向代理配置

如果使用 Nginx profile，需要配置 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 数据库连接池配置

在 `.env` 文件中添加：
```env
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=60000
```

### SSL/HTTPS 配置

1. 获取 SSL 证书（Let's Encrypt 推荐）
2. 将证书文件放在 `ssl/` 目录
3. 更新 `nginx.conf` 配置 HTTPS

## 🚀 CI/CD 自动部署

### GitHub Actions 配置

1. **配置 Secrets**
   在 GitHub 仓库设置中添加：
   - `DOCKER_USERNAME`: Docker Hub 用户名
   - `DOCKER_PASSWORD`: Docker Hub 访问令牌

2. **自动触发条件**
   - 推送到 `main` 分支：构建并推送 `latest` 标签
   - 推送到 `develop` 分支：构建并推送 `develop` 标签
   - 创建版本标签：构建并推送版本号标签

3. **部署流程**
   ```bash
   # 拉取最新镜像
   docker pull your-registry/zxsj-multi-account-hub-backend:latest
   
   # 更新服务
   docker-compose pull
   docker-compose up -d
   ```

### 使用预构建镜像部署

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    image: your-registry/zxsj-multi-account-hub-backend:latest
    container_name: zxsj-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    networks:
      - zxsj-network

networks:
  zxsj-network:
    driver: bridge
```

## 🔍 监控和维护

### 健康检查

```bash
# 检查应用健康状态
curl http://localhost:3000/health

# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
```

### 日志管理

```bash
# 查看实时日志
docker-compose logs -f backend

# 查看最近的日志
docker-compose logs --tail=100 backend

# 日志轮转配置
# 在 docker-compose.yml 中添加：
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 备份和恢复

```bash
# 数据库备份
pg_dump -h $DB_HOST -U $DB_USERNAME -d $DB_NAME > backup.sql

# 数据库恢复
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME < backup.sql
```

## 🛠️ 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证连接信息和网络连通性
   - 检查防火墙设置

2. **应用启动失败**
   - 检查环境变量配置
   - 查看应用日志：`docker-compose logs backend`
   - 验证端口是否被占用

3. **健康检查失败**
   - 检查应用是否正常启动
   - 验证健康检查端点：`curl http://localhost:3000/health`
   - 检查数据库连接状态

### 性能优化

1. **数据库优化**
   - 配置适当的连接池大小
   - 添加必要的数据库索引
   - 定期执行 VACUUM 和 ANALYZE

2. **应用优化**
   - 启用 Redis 缓存（可选）
   - 配置适当的日志级别
   - 使用 PM2 进行进程管理（可选）

## 📞 支持

如果在部署过程中遇到问题，请：

1. 检查日志文件
2. 参考故障排除部分
3. 提交 Issue 到项目仓库
4. 联系技术支持团队