# 使用官方 Node.js 运行时作为基础镜像
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json* ./

# 安装依赖（使用缓存挂载以提高构建速度）
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm ci --only=production=false

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:22-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache curl

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json* ./

# 只安装生产依赖
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm ci --only=production --ignore-scripts

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
CMD ["node", "dist/src/main.js"]