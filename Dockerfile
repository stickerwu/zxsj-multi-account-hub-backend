# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm（使用 corepack 以获得更好的版本管理）
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖（使用缓存挂载以提高构建速度）
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 生产阶段
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖和 pnpm
RUN apk add --no-cache curl && \
    corepack enable && \
    corepack prepare pnpm@latest --activate

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 只安装生产依赖
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile && \
    pnpm store prune

# 从构建阶段复制构建结果和健康检查文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/healthcheck.js ./

# 创建日志目录
RUN mkdir -p /app/logs

# 更改文件所有权
RUN chown -R nestjs:nodejs /app

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js

# 启动应用
CMD ["node", "dist/main"]