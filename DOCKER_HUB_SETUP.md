# Docker Hub 配置指南

## 🔧 GitHub Secrets 配置

为了让 GitHub Actions 能够成功推送 Docker 镜像到 Docker Hub，您需要在 GitHub 仓库中配置以下 Secrets：

### 1. 创建 Docker Hub Access Token

1. 登录到 [Docker Hub](https://hub.docker.com/)
2. 点击右上角的用户头像 → **Account Settings**
3. 选择 **Security** 标签
4. 点击 **New Access Token**
5. 输入 Token 名称（例如：`github-actions`）
6. 选择权限：**Read, Write, Delete**
7. 点击 **Generate** 并复制生成的 Token

### 2. 在 GitHub 中配置 Secrets

1. 打开您的 GitHub 仓库
2. 点击 **Settings** 标签
3. 在左侧菜单中选择 **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 添加以下两个 Secrets：

#### DOCKER_HUB_USERNAME
- **Name**: `DOCKER_HUB_USERNAME`
- **Value**: 您的 Docker Hub 用户名

#### DOCKER_HUB_ACCESS_TOKEN
- **Name**: `DOCKER_HUB_ACCESS_TOKEN`
- **Value**: 在步骤 1 中生成的 Access Token

### 3. 创建 Docker Hub 仓库

1. 登录到 [Docker Hub](https://hub.docker.com/)
2. 点击 **Create Repository**
3. 输入仓库名称：`zxsj-multi-account-hub-backend`
4. 选择 **Public** 或 **Private**（根据需要）
5. 点击 **Create**

### 4. 验证配置

配置完成后，推送代码到 `main` 分支将自动触发 GitHub Actions 工作流：

```bash
git push origin main
```

### 5. 镜像标签说明

工作流会自动为 Docker 镜像创建以下标签：

- `latest` - 最新的 main 分支构建
- `main` - main 分支的最新提交
- `v1.0.0` - 版本标签（如果推送了 git tag）

### 6. 故障排除

如果遇到推送失败，请检查：

1. ✅ Docker Hub 用户名是否正确
2. ✅ Access Token 是否有效且具有写入权限
3. ✅ Docker Hub 仓库是否存在
4. ✅ GitHub Secrets 配置是否正确

### 7. 本地测试

您也可以在本地测试 Docker 镜像构建：

```bash
# 构建镜像
docker build -t your-username/zxsj-multi-account-hub-backend:latest .

# 运行容器
docker run -p 3000:3000 your-username/zxsj-multi-account-hub-backend:latest
```

## 📝 注意事项

- 请将 `your-username` 替换为您实际的 Docker Hub 用户名
- Access Token 具有与密码相同的权限，请妥善保管
- 建议定期轮换 Access Token 以提高安全性