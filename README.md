# 诛仙世界多账号管理系统后端

一个用于管理诛仙世界游戏多个账号进度跟踪的后端系统，基于 NestJS 框架开发。

## 🚀 功能特性

- **用户认证**: JWT 身份验证，支持用户注册和登录
- **账号管理**: 管理多个游戏账号，支持启用/禁用状态
- **模板管理**: 管理副本模板和周常任务模板
- **进度跟踪**: 跟踪每个账号的副本进度和周常任务完成情况
- **定时任务**: 每周三 8:00 AM 自动重置进度
- **API 文档**: 完整的 Swagger API 文档
- **Docker 支持**: 完整的 Docker 部署方案

## 📋 技术栈

- **框架**: NestJS 10.x
- **数据库**: PostgreSQL 15+
- **缓存**: Redis 7+
- **认证**: JWT
- **文档**: Swagger/OpenAPI
- **容器化**: Docker & Docker Compose
- **包管理**: pnpm

## 🛠️ 快速开始

### 环境要求

- Node.js 18+
- pnpm
- PostgreSQL 15+
- Redis 7+ (可选)
- Docker & Docker Compose (用于容器化部署)

### 开发环境设置

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd zxsj-multi-account-hub-backend
   ```

2. **运行开发环境设置脚本**
   ```bash
   chmod +x scripts/dev-setup.sh
   ./scripts/dev-setup.sh
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接等信息
   ```

4. **启动开发服务器**
   ```bash
   pnpm run start:dev
   ```

### Docker 部署

> **重要提示**: 此 Docker 部署方案仅包含应用服务，数据库需要单独部署和配置。

#### 前置条件

1. **准备数据库服务**
   - 确保 PostgreSQL 数据库服务已运行
   - 创建数据库和用户
   - 记录数据库连接信息

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接信息
   ```

   **必须配置的环境变量**：
   - `DB_HOST`: 数据库主机地址
   - `DB_PORT`: 数据库端口 (默认 5432)
   - `DB_USERNAME`: 数据库用户名
   - `DB_PASSWORD`: 数据库密码
   - `DB_NAME`: 数据库名称
   - `JWT_SECRET`: JWT 密钥

#### 部署方式

**方式一：使用部署脚本（推荐）**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**方式二：手动部署**
```bash
# 仅启动应用服务
docker-compose up -d backend

# 启动应用服务和 Nginx（可选）
WITH_NGINX=true docker-compose --profile with-nginx up -d
```

**方式三：使用 GitHub Actions 自动部署**
- 推送代码到 `main` 或 `develop` 分支
- GitHub Actions 会自动构建 Docker 镜像
- 配置 Docker Hub 凭据：`DOCKER_USERNAME` 和 `DOCKER_PASSWORD`

## 📚 API 文档

启动服务后，访问以下地址查看 API 文档：

- **Swagger UI**: http://localhost:3000/api-docs
- **健康检查**: http://localhost:3000/health

## 🗄️ 数据库结构

### 主要表结构

- **users**: 用户表
- **accounts**: 游戏账号表
- **dungeon_templates**: 副本模板表
- **weekly_task_templates**: 周常任务模板表
- **weekly_progress**: 周进度记录表

### 数据库初始化

系统会自动创建必要的表结构和初始数据。如需手动初始化，可以运行：

```sql
-- 执行 init-db.sql 脚本
\i init-db.sql
```

## 🔧 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run start:dev

# 构建项目
pnpm run build

# 启动生产服务器
pnpm run start:prod

# 运行测试
pnpm run test

# 运行端到端测试
pnpm run test:e2e

# 代码格式化
pnpm run format

# 代码检查
pnpm run lint
```

## 🐳 Docker 命令

```bash
# 构建并启动应用服务
docker-compose up -d backend

# 启动应用服务和 Nginx
docker-compose --profile with-nginx up -d

# 查看服务状态
docker-compose ps

# 查看应用日志
docker-compose logs -f backend

# 查看所有日志
docker-compose logs -f

# 停止所有服务
docker-compose down

# 重建镜像
docker-compose build --no-cache

# 清理未使用的镜像和容器
docker system prune -f
```

## 🚀 CI/CD 配置

项目已配置 GitHub Actions 自动化流程：

### 工作流程
1. **代码质量检查**: 运行 ESLint 和测试
2. **Docker 镜像构建**: 自动构建多架构镜像
3. **安全扫描**: 使用 Trivy 进行漏洞扫描
4. **镜像推送**: 推送到 Docker Hub

### 配置要求
在 GitHub 仓库的 Settings > Secrets 中配置：
- `DOCKER_USERNAME`: Docker Hub 用户名
- `DOCKER_PASSWORD`: Docker Hub 密码或访问令牌

### 触发条件
- 推送到 `main` 或 `develop` 分支
- 创建版本标签 (如 `v1.0.0`)
- 手动触发 (workflow_dispatch)

## 📁 项目结构

```
src/
├── auth/                 # 认证模块
│   ├── dto/             # 数据传输对象
│   ├── guards/          # 守卫
│   ├── strategies/      # 认证策略
│   └── ...
├── accounts/            # 账号管理模块
├── templates/           # 模板管理模块
├── progress/            # 进度跟踪模块
├── scheduler/           # 定时任务模块
├── entities/            # 数据库实体
├── config/              # 配置文件
└── main.ts              # 应用入口
```

## 🔐 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务端口 | `3000` |
| `DB_HOST` | 数据库主机 | `localhost` |
| `DB_PORT` | 数据库端口 | `5432` |
| `DB_USERNAME` | 数据库用户名 | `postgres` |
| `DB_PASSWORD` | 数据库密码 | - |
| `DB_NAME` | 数据库名称 | `zxsj_multi_account_hub` |
| `JWT_SECRET` | JWT 密钥 | - |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |
| `CORS_ORIGIN` | CORS 允许源 | `http://localhost:3001` |

## 🕐 定时任务

系统包含以下定时任务：

- **周进度重置**: 每周三 8:00 AM 自动重置所有账号的周进度
- **数据清理**: 每天 2:00 AM 清理超过 4 周的历史数据
- **健康检查**: 每小时执行系统健康检查

## 🧪 测试

```bash
# 单元测试
pnpm run test

# 端到端测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov
```

## 📝 API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 账号管理接口
- `GET /api/accounts` - 获取账号列表
- `POST /api/accounts` - 创建账号
- `PUT /api/accounts/:id` - 更新账号
- `DELETE /api/accounts/:id` - 删除账号

### 进度跟踪接口
- `GET /api/progress/current-week` - 获取当前周进度
- `POST /api/progress/dungeon` - 更新副本进度
- `POST /api/progress/weekly-task` - 更新周常任务进度

### 模板管理接口
- `GET /api/templates/dungeons` - 获取副本模板
- `POST /api/templates/dungeons` - 创建副本模板
- `GET /api/templates/weekly-tasks` - 获取周常任务模板
- `POST /api/templates/weekly-tasks` - 创建周常任务模板

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库是否运行
   - 验证环境变量配置
   - 确认网络连接

2. **JWT 认证失败**
   - 检查 JWT_SECRET 是否配置
   - 验证 token 是否过期

3. **定时任务不执行**
   - 检查时区设置
   - 查看应用日志

### 日志查看

```bash
# Docker 环境
docker-compose logs -f backend

# 开发环境
# 日志会输出到控制台
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请提交 Issue 或联系开发团队。