# 诛仙世界多账号管理系统 API 接口文档

## 目录

- [1. 概述](#1-概述)
- [2. 认证说明](#2-认证说明)
- [3. 通用响应格式](#3-通用响应格式)
- [4. 错误码说明](#4-错误码说明)
- [5. 认证管理 API](#5-认证管理-api)
- [6. 账号管理 API](#6-账号管理-api)
- [7. 共享账号管理 API](#7-共享账号管理-api)
- [8. 模板管理 API](#8-模板管理-api)
- [9. 进度跟踪 API](#9-进度跟踪-api)
- [10. 定时任务管理 API](#10-定时任务管理-api)
- [11. TypeScript 类型定义](#11-typescript-类型定义)

## 1. 概述

本文档描述了诛仙世界多账号管理系统的所有 API 接口。系统基于 NestJS 框架构建，使用 JWT 进行身份认证，支持用户注册、登录、账号管理、模板管理、进度跟踪等功能。

**基础信息：**
- 基础URL: `http://localhost:3000/api`
- API版本: v1
- 认证方式: JWT Bearer Token
- 数据格式: JSON

## 2. 认证说明

### 2.1 JWT Token 认证

大部分 API 需要在请求头中携带 JWT Token：
```http
Authorization: Bearer <your-jwt-token>
```

### 2.2 权限级别

- **普通用户(user)**: 可以管理自己的账号和进度
- **管理员(admin)**: 拥有所有权限，可以管理所有用户和系统设置

## 3. 通用响应格式

### 3.1 成功响应

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}
```

### 3.2 分页响应

```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    // 数据列表
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### 3.3 错误响应

```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request"
}
```

## 4. 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 500 | 服务器内部错误 |

## 5. 认证管理 API

### 5.1 用户注册

**接口地址：** `POST /api/auth/register`

**请求参数：**

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "phone": "13800138000",
  "password": "123456"
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，3-50个字符 |
| email | string | 否 | 邮箱地址 |
| phone | string | 否 | 手机号码，11位数字 |
| password | string | 是 | 密码，6-100个字符 |

**响应示例：**

```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138000",
    "role": "user"
  }
}
```

### 5.2 用户登录

**接口地址：** `POST /api/auth/login`

**请求参数：**

```json
{
  "credential": "testuser",
  "password": "123456"
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| credential | string | 是 | 登录凭证（用户名、邮箱或手机号） |
| password | string | 是 | 密码，至少6个字符 |

**响应示例：**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "testuser",
      "email": "test@example.com",
      "phone": "13800138000",
      "role": "user"
    }
  }
}
```

### 5.3 获取用户信息

**接口地址：** `GET /api/auth/profile`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138000",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5.4 用户登出

**接口地址：** `POST /api/auth/logout`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "登出成功"
}
```

### 5.5 获取用户列表（管理员）

**接口地址：** `GET /api/auth/admin/users`

**认证：** 需要 JWT Token + 管理员权限

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| size | number | 否 | 每页数量，默认10，最大100 |
| limit | number | 否 | 兼容参数，与 size 等效 |
| search | string | 否 | 搜索关键词（用户名、邮箱） |
| role | string | 否 | 角色筛选（admin/user） |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "testuser",
      "email": "test@example.com",
      "phone": "13800138000",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "size": 10,
    "totalPages": 1
  }
}
```

## 6. 账号管理 API

### 6.1 创建账号

**接口地址：** `POST /api/accounts`

**认证：** 需要 JWT Token

**请求参数：**

```json
{
  "accountName": "我的主号",
  "isActive": true
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountName | string | 是 | 账号名称，1-100个字符 |
| isActive | boolean | 否 | 是否激活，默认true |

**响应示例：**

```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "accountId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "我的主号",
    "isActive": true,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6.2 获取账号列表

**接口地址：** `GET /api/accounts`

**认证：** 需要 JWT Token

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| size | number | 否 | 每页数量，默认10 |
| limit | number | 否 | 兼容参数，与 size 等效 |
| search | string | 否 | 搜索关键词（账号名） |
| isActive | boolean | 否 | 状态筛选 |
| scope | string | 否 | 仅管理员可用，设为 `all` 返回全量账号 |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "accountId": "550e8400-e29b-41d4-a716-446655440001",
      "name": "我的主号",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "username": "testuser",
        "email": "test@example.com",
        "phone": "13800138000",
        "role": "user"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 6.3 获取所有账号列表（管理员）

**接口地址：** `GET /api/accounts/admin/all`

**认证：** 需要 JWT Token + 管理员权限

**查询参数：** 同上，额外支持 `userId`（按指定用户过滤）

### 6.4 获取账号统计

**接口地址：** `GET /api/accounts/stats`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "totalCount": 5,
    "activeCount": 4,
    "inactiveCount": 1
  }
}
```

### 6.5 获取账号详情

**接口地址：** `GET /api/accounts/:id`

**认证：** 需要 JWT Token

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 账号ID |

### 6.6 更新账号信息

**接口地址：** `PATCH /api/accounts/:id`

**认证：** 需要 JWT Token

**请求参数：**

```json
{
  "accountName": "更新后的账号名",
  "isActive": false
}
```

### 6.7 切换账号状态

**接口地址：** `PATCH /api/accounts/:id/toggle-active`

**认证：** 需要 JWT Token

### 6.8 批量更新账号状态

**接口地址：** `POST /api/accounts/batch-update-status`

**认证：** 需要 JWT Token

**请求参数：**

```json
{
  "accountIds": ["id1", "id2", "id3"],
  "isActive": true
}
```

### 6.9 删除账号

**接口地址：** `DELETE /api/accounts/:id`

**认证：** 需要 JWT Token

## 7. 共享账号管理 API

### 7.1 创建共享账号

**接口地址：** `POST /api/shared-accounts`

**认证：** 需要 JWT Token

**请求参数：**

```json
{
  "accountName": "string",
  "description": "string",
  "permissions": {
    "canView": true,
    "canEdit": false,
    "canDelete": false,
    "canManageUsers": false
  }
}
```

**响应示例：**

```json
{
  "code": 201,
  "message": "共享账号创建成功",
  "data": {
    "id": "uuid",
    "accountName": "测试共享账号",
    "description": "用于测试的共享账号",
    "ownerId": "uuid",
    "createdAt": "2025-11-04T00:00:00.000Z",
    "updatedAt": "2025-11-04T00:00:00.000Z"
  }
}
```

### 7.2 获取共享账号列表

**接口地址：** `GET /api/shared-accounts`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": "uuid",
      "accountName": "测试共享账号",
      "description": "用于测试的共享账号",
      "ownerId": "uuid",
      "createdAt": "2025-11-04T00:00:00.000Z",
      "updatedAt": "2025-11-04T00:00:00.000Z"
    }
  ]
}
```

### 7.3 获取指定共享账号详情

**接口地址：** `GET /api/shared-accounts/:accountName`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": "uuid",
    "accountName": "测试共享账号",
    "description": "用于测试的共享账号",
    "ownerId": "uuid",
    "users": [
      {
        "id": "uuid",
        "username": "testuser",
        "permissions": {
          "canView": true,
          "canEdit": false,
          "canDelete": false,
          "canManageUsers": false
        }
      }
    ],
    "createdAt": "2025-11-04T00:00:00.000Z",
    "updatedAt": "2025-11-04T00:00:00.000Z"
  }
}
```

### 7.4 更新共享账号

**接口地址：** `PUT /api/shared-accounts/:accountName`

**认证：** 需要 JWT Token + 所有者权限

**请求参数：**

```json
{
  "description": "string",
  "permissions": {
    "canView": true,
    "canEdit": false,
    "canDelete": false,
    "canManageUsers": false
  }
}
```

### 7.5 删除共享账号

**接口地址：** `DELETE /api/shared-accounts/:accountName`

**认证：** 需要 JWT Token + 所有者权限

### 7.6 添加用户到共享账号

**接口地址：** `POST /api/shared-accounts/:accountName/users`

**认证：** 需要 JWT Token + 管理用户权限

**请求参数：**

```json
{
  "userId": "string",
  "permissions": {
    "canView": true,
    "canEdit": false,
    "canDelete": false,
    "canManageUsers": false
  }
}
```

### 7.7 从共享账号移除用户

**接口地址：** `DELETE /api/shared-accounts/:accountName/users/:userId`

**认证：** 需要 JWT Token + 管理用户权限

### 7.8 更新用户权限

**接口地址：** `PUT /api/shared-accounts/:accountName/users/:userId/permissions`

**认证：** 需要 JWT Token + 管理用户权限

**请求参数：**

```json
{
  "permissions": {
    "canView": true,
    "canEdit": true,
    "canDelete": false,
    "canManageUsers": false
  }
}
```

### 7.9 检查权限

**接口地址：** `GET /api/shared-accounts/:accountName/permissions/:action`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "权限检查成功",
  "data": {
    "hasPermission": true,
    "action": "view"
  }
}
```

### 7.10 获取用户权限

**接口地址：** `GET /api/shared-accounts/:accountName/permissions`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "canView": true,
    "canEdit": false,
    "canDelete": false,
    "canManageUsers": false
  }
}
```

## 8. 模板管理 API

### 8.1 创建副本模板

**接口地址：** `POST /api/templates/dungeons`

**认证：** 需要 JWT Token + 管理员权限

**请求参数：**

```json
{
  "dungeonName": "天音寺",
  "bosses": ["老一", "老二", "老三"]
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dungeonName | string | 是 | 副本名称，1-100个字符 |
| bosses | string[] | 是 | BOSS列表，不能为空 |

**响应示例：**

```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "templateId": "550e8400-e29b-41d4-a716-446655440002",
    "dungeonName": "天音寺",
    "bosses": ["老一", "老二", "老三"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 8.2 获取副本模板列表

**接口地址：** `GET /api/templates/dungeons`

**认证：** 需要 JWT Token

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| search | string | 否 | 搜索副本名称 |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "templateId": "550e8400-e29b-41d4-a716-446655440002",
      "dungeonName": "天音寺",
      "bosses": ["老一", "老二", "老三"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 8.3 获取副本模板详情

**接口地址：** `GET /api/templates/dungeons/:id`

**认证：** 需要 JWT Token

### 8.4 更新副本模板

**接口地址：** `PATCH /api/templates/dungeons/:id`

**认证：** 需要 JWT Token + 管理员权限

### 8.5 删除副本模板

**接口地址：** `DELETE /api/templates/dungeons/:id`

**认证：** 需要 JWT Token + 管理员权限

### 8.6 创建周常任务模板

**接口地址：** `POST /api/templates/weekly-tasks`

**认证：** 需要 JWT Token + 管理员权限

**请求参数：**

```json
{
  "taskName": "日常任务",
  "targetCount": 7
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskName | string | 是 | 任务名称，1-100个字符 |
| targetCount | number | 是 | 目标完成次数，必须大于0 |

### 8.7 获取周常任务模板列表

**接口地址：** `GET /api/templates/weekly-tasks`

**认证：** 需要 JWT Token

### 8.8 获取周常任务模板详情

**接口地址：** `GET /api/templates/weekly-tasks/:id`

**认证：** 需要 JWT Token

### 8.9 更新周常任务模板

**接口地址：** `PATCH /api/templates/weekly-tasks/:id`

**认证：** 需要 JWT Token + 管理员权限

### 8.10 删除周常任务模板

**接口地址：** `DELETE /api/templates/weekly-tasks/:id`

**认证：** 需要 JWT Token + 管理员权限

### 8.11 获取模板统计

**接口地址：** `GET /api/templates/stats`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "dungeonTemplatesCount": 5,
    "weeklyTaskTemplatesCount": 3
  }
}
```

## 9. 进度跟踪 API

### 9.1 获取当前周进度

**接口地址：** `GET /api/progress/current-week`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "progressId": "550e8400-e29b-41d4-a716-446655440003",
      "accountId": "550e8400-e29b-41d4-a716-446655440001",
      "weekStart": "2024-01-01",
      "dungeonProgress": {
        "template1_0": true,
        "template1_1": false,
        "template1_2": false
      },
      "weeklyTaskProgress": {
        "template2": 3
      },
      "lastUpdated": "2024-01-01T12:00:00.000Z",
      "account": {
        "accountId": "550e8400-e29b-41d4-a716-446655440001",
        "name": "我的主号",
        "isActive": true
      }
    }
  ]
}
```

### 9.2 获取指定账号进度

**接口地址：** `GET /api/progress/account/:accountId`

**认证：** 需要 JWT Token

### 9.3 更新副本进度

**接口地址：** `PATCH /api/progress/dungeon`

**认证：** 需要 JWT Token

**请求参数：**

```json
{
  "accountId": "550e8400-e29b-41d4-a716-446655440001",
  "dungeonName": "天音寺",
  "bossName": "老一",
  "killCount": 1
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountId | string | 是 | 账号ID，UUID格式 |
| dungeonName | string | 是 | 副本名称 |
| bossName | string | 是 | BOSS名称 |
| killCount | number | 是 | 击杀次数，0-999 |

### 9.4 更新周常任务进度

**接口地址：** `PATCH /api/progress/weekly-task`

**认证：** 需要 JWT Token

**请求参数：**

```json
{
  "accountId": "550e8400-e29b-41d4-a716-446655440001",
  "taskName": "日常任务",
  "completedCount": 5
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountId | string | 是 | 账号ID，UUID格式 |
| taskName | string | 是 | 任务名称 |
| completedCount | number | 是 | 完成次数，不能小于0 |

### 9.5 获取进度统计

**接口地址：** `GET /api/progress/stats`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "totalAccounts": 5,
    "accountsWithProgress": 4,
    "completionRate": 0.8
  }
}
```

### 9.6 获取历史周进度

**接口地址：** `GET /api/progress/history`

**认证：** 需要 JWT Token

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountId | string | 否 | 账号ID筛选 |
| weeks | number | 否 | 获取最近几周的数据，默认4周 |

### 9.7 重置周进度（管理员）

**接口地址：** `POST /api/progress/admin/reset-weekly`

**认证：** 需要 JWT Token + 管理员权限

### 9.8 获取进度详情

**接口地址：** `GET /api/progress/:id`

**认证：** 需要 JWT Token

### 9.9 批量更新进度

**接口地址：** `PATCH /api/progress/batch-update`

**认证：** 需要 JWT Token

### 9.10 导出进度数据

**接口地址：** `GET /api/progress/export`

**认证：** 需要 JWT Token

### 9.11 获取进度趋势

**接口地址：** `GET /api/progress/trends`

**认证：** 需要 JWT Token

### 9.12 获取账号进度排行

**接口地址：** `GET /api/progress/rankings`

**认证：** 需要 JWT Token

### 9.13 获取周进度汇总

**接口地址：** `GET /api/progress/weekly-summary`

**认证：** 需要 JWT Token

### 9.14 更新进度备注

**接口地址：** `PATCH /api/progress/:id/notes`

**认证：** 需要 JWT Token

### 9.15 获取进度变更历史

**接口地址：** `GET /api/progress/:id/history`

**认证：** 需要 JWT Token

## 10. 定时任务管理 API

### 10.1 获取调度器信息

**接口地址：** `GET /api/scheduler/info`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "status": "running",
    "nextWeeklyReset": "2024-01-03T08:00:00.000Z",
    "lastWeeklyReset": "2023-12-27T08:00:00.000Z",
    "uptime": "5 days, 3 hours, 25 minutes"
  }
}
```

### 10.2 手动触发周进度重置（管理员）

**接口地址：** `POST /api/scheduler/trigger-weekly-reset`

**认证：** 需要 JWT Token + 管理员权限

**响应示例：**

```json
{
  "code": 200,
  "message": "周进度重置已触发",
  "data": {
    "resetTime": "2024-01-01T08:00:00.000Z",
    "affectedAccounts": 15
  }
}
```

### 10.3 获取任务执行历史

**接口地址：** `GET /api/scheduler/history`

**认证：** 需要 JWT Token + 管理员权限

### 10.4 暂停调度器（管理员）

**接口地址：** `POST /api/scheduler/pause`

**认证：** 需要 JWT Token + 管理员权限

### 10.5 恢复调度器（管理员）

**接口地址：** `POST /api/scheduler/resume`

**认证：** 需要 JWT Token + 管理员权限

### 10.6 获取下次执行时间

**接口地址：** `GET /api/scheduler/next-execution`

**认证：** 需要 JWT Token

### 10.7 更新调度配置（管理员）

**接口地址：** `PATCH /api/scheduler/config`

**认证：** 需要 JWT Token + 管理员权限

### 10.8 获取调度统计

**接口地址：** `GET /api/scheduler/stats`

**认证：** 需要 JWT Token

### 10.9 测试调度任务（管理员）

**接口地址：** `POST /api/scheduler/test`

**认证：** 需要 JWT Token + 管理员权限

## 11. TypeScript 类型定义

### 11.1 用户相关类型

```typescript
interface User {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface LoginRequest {
  credential: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email?: string;
  phone?: string;
  password: string;
}
```

### 11.2 账号相关类型

```typescript
interface Account {
  accountId: string;
  name: string;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

interface CreateAccountRequest {
  accountName: string;
  isActive?: boolean;
}
```

### 11.3 共享账号相关类型

```typescript
interface SharedAccount {
  id: string;
  accountName: string;
  description?: string;
  ownerId: string;
  users?: SharedAccountUser[];
  createdAt: Date;
  updatedAt: Date;
}

interface SharedAccountUser {
  id: string;
  username: string;
  permissions: SharedAccountPermissions;
}

interface SharedAccountPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}
```

### 11.4 模板相关类型

```typescript
interface DungeonTemplate {
  templateId: string;
  dungeonName: string;
  bosses: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface WeeklyTaskTemplate {
  templateId: string;
  taskName: string;
  targetCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 11.5 进度相关类型

```typescript
interface WeeklyProgress {
  progressId: string;
  accountId: string;
  weekStart: string;
  dungeonProgress: Record<string, boolean>;
  weeklyTaskProgress: Record<string, number>;
  lastUpdated: Date;
  account?: Account;
}

interface UpdateDungeonProgressRequest {
  accountId: string;
  dungeonName: string;
  bossName: string;
  killCount: number;
}

interface UpdateWeeklyTaskProgressRequest {
  accountId: string;
  taskName: string;
  completedCount: number;
}
```

### 11.6 通用响应类型

```typescript
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    size?: number;
    limit?: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}
```

---

**文档版本：** v1.1.0  
**最后更新：** 2025-11-04  
**维护者：** 开发团队