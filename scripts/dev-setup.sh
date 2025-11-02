#!/bin/bash

# 诛仙世界多账号管理系统开发环境设置脚本

set -e

echo "🛠️ 设置开发环境..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "📦 安装 pnpm..."
    npm install -g pnpm
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "⚠️ 请编辑 .env 文件并配置正确的环境变量"
fi

# 安装依赖
echo "📦 安装项目依赖..."
pnpm install

# 检查 MySQL 是否运行
if command -v mysql &> /dev/null; then
    if mysql -h localhost -P 3306 -u root -e "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ MySQL 数据库连接正常"
    else
        echo "⚠️ MySQL 数据库未运行，请启动数据库服务"
        echo "💡 可以使用 Docker 启动: docker-compose up -d mysql"
    fi
else
    echo "⚠️ 未检测到 MySQL 客户端工具"
    echo "💡 可以使用 Docker 启动数据库: docker-compose up -d mysql"
fi

# 构建项目
echo "🔨 构建项目..."
pnpm run build

echo ""
echo "🎉 开发环境设置完成！"
echo ""
echo "🚀 启动开发服务器:"
echo "   pnpm run start:dev"
echo ""
echo "🔨 构建项目:"
echo "   pnpm run build"
echo ""
echo "🧪 运行测试:"
echo "   pnpm run test"
echo ""
echo "🗄️ 启动数据库 (Docker):"
echo "   docker-compose up -d mysql redis"
echo ""
echo "📚 查看 API 文档:"
echo "   启动服务后访问 http://localhost:3000/api-docs"