#!/bin/bash

# 诛仙世界多账号管理系统部署脚本
# 注意：此脚本仅部署应用服务，数据库需要单独配置

set -e

echo "🚀 开始部署诛仙世界多账号管理系统..."

# 检查环境变量
if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在，请先复制 .env.example 并配置环境变量"
    echo "📝 请确保配置以下必要的数据库连接信息："
    echo "   - DB_HOST: 数据库主机地址"
    echo "   - DB_PORT: 数据库端口"
    echo "   - DB_USERNAME: 数据库用户名"
    echo "   - DB_PASSWORD: 数据库密码"
    echo "   - DB_NAME: 数据库名称"
    echo "   - JWT_SECRET: JWT 密钥"
    exit 1
fi

# 验证必要的环境变量
source .env
required_vars=("DB_HOST" "DB_USERNAME" "DB_PASSWORD" "DB_NAME" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ 错误: 环境变量 $var 未设置"
        exit 1
    fi
done

echo "✅ 环境变量验证通过"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 使用 docker compose 或 docker-compose
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

# 测试数据库连接
echo "🔍 测试数据库连接..."
if command -v psql &> /dev/null; then
    if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p ${DB_PORT:-5432} -U $DB_USERNAME -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        echo "⚠️  警告: 无法连接到数据库，请确保数据库服务正在运行且配置正确"
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "✅ 数据库连接测试通过"
    fi
else
    echo "⚠️  未安装 psql，跳过数据库连接测试"
fi

# 停止现有服务
echo "🛑 停止现有服务..."
$COMPOSE_CMD down

# 清理旧镜像（可选）
read -p "是否清理旧的 Docker 镜像？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧镜像..."
    docker system prune -f
    docker image prune -f
fi

# 构建新镜像
echo "🔨 构建新镜像..."
$COMPOSE_CMD build --no-cache

# 启动服务
echo "▶️ 启动服务..."
WITH_NGINX=${WITH_NGINX:-false}
if [[ $WITH_NGINX == "true" ]]; then
    echo "🌐 启动服务（包含 Nginx）..."
    $COMPOSE_CMD --profile with-nginx up -d
else
    echo "🚀 启动应用服务..."
    $COMPOSE_CMD up -d backend
fi

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "🔍 检查服务状态..."
$COMPOSE_CMD ps

# 检查健康状态
echo "💚 检查应用健康状态..."
PORT=${PORT:-3000}
for i in {1..30}; do
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        echo "✅ 应用健康检查通过"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 应用健康检查失败"
        echo "📋 查看应用日志："
        $COMPOSE_CMD logs backend
        exit 1
    fi
    echo "等待应用启动... ($i/30)"
    sleep 2
done

# 显示服务信息
echo ""
echo "🎉 部署完成！"
echo "📡 API 服务: http://localhost:$PORT"
echo "📚 API 文档: http://localhost:$PORT/${SWAGGER_PATH:-api-docs}"
echo "💚 健康检查: http://localhost:$PORT/health"
if [[ $WITH_NGINX == "true" ]]; then
    echo "🌐 Nginx 代理: http://localhost:${NGINX_HTTP_PORT:-80}"
fi
echo ""
echo "🗄️ 数据库: $DB_HOST:${DB_PORT:-5432}"
echo ""
echo "📋 查看日志: $COMPOSE_CMD logs -f"
echo "🛑 停止服务: $COMPOSE_CMD down"
echo "🔄 重启服务: $COMPOSE_CMD restart"
echo ""
echo "💡 提示："
echo "   - 数据库服务需要单独管理"
echo "   - 如需启用 Nginx，请设置 WITH_NGINX=true"
echo "   - 生产环境请确保数据库和应用服务的网络连通性"