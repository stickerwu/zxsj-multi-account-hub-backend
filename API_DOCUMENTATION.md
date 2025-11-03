# 诛仙世界多账号管理系统 API 接口文档

## 目录

- [1. 概述](#1-概述)
- [2. 认证说明](#2-认证说明)
- [3. 通用响应格式](#3-通用响应格式)
- [4. 错误码说明](#4-错误码说明)
- [5. 认证管理 API](#5-认证管理-api)
- [6. 账号管理 API](#6-账号管理-api)
- [7. 模板管理 API](#7-模板管理-api)
- [8. 进度跟踪 API](#8-进度跟踪-api)
- [9. 定时任务管理 API](#9-定时任务管理-api)
- [10. TypeScript 类型定义](#10-typescript-类型定义)

## 1. 概述

本文档描述了诛仙世界多账号管理系统的所有 API 接口。系统基于 NestJS 框架构建，使用 JWT 进行身份认证，支持用户注册、登录、账号管理、模板管理、进度跟踪等功能。

**基础信息：**
- 基础URL: `http://localhost:3000`
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

- **普通用户 (user)**: 可以管理自己的账号和进度
- **管理员 (admin)**: 拥有所有权限，可以管理所有用户和系统设置

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

**接口地址：** `POST /auth/register`

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

**接口地址：** `POST /auth/login`

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

**接口地址：** `GET /auth/profile`

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

**接口地址：** `POST /auth/logout`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "登出成功"
}
```

### 5.5 获取用户列表（管理员）

**接口地址：** `GET /auth/admin/users`

**认证：** 需要 JWT Token + 管理员权限

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10，最大100 |
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
    "limit": 10,
    "totalPages": 1
  }
}
```

## 6. 账号管理 API

### 6.1 创建账号

**接口地址：** `POST /accounts`

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

**接口地址：** `GET /accounts`

**认证：** 需要 JWT Token

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |
| search | string | 否 | 搜索关键词（账号名） |
| isActive | boolean | 否 | 状态筛选 |

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

**接口地址：** `GET /accounts/admin/all`

**认证：** 需要 JWT Token + 管理员权限

**查询参数：** 同上

### 6.4 获取账号统计

**接口地址：** `GET /accounts/stats`

**认证：** 需要 JWT Token

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "totalAccounts": 5,
    "activeAccounts": 4,
    "inactiveAccounts": 1
  }
}
```

### 6.5 获取账号详情

**接口地址：** `GET /accounts/:id`

**认证：** 需要 JWT Token

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 账号ID |

### 6.6 更新账号信息

**接口地址：** `PATCH /accounts/:id`

**认证：** 需要 JWT Token

**请求参数：**

```json
{
  "accountName": "更新后的账号名",
  "isActive": false
}
```

### 6.7 切换账号状态

**接口地址：** `PATCH /accounts/:id/toggle-status`

**认证：** 需要 JWT Token

### 6.8 批量更新账号状态

**接口地址：** `PATCH /accounts/batch-status`

**认证：** 需要 JWT Token

**请求参数：**

```json
{
  "accountIds": ["id1", "id2", "id3"],
  "isActive": true
}
```

### 6.9 删除账号

**接口地址：** `DELETE /accounts/:id`

**认证：** 需要 JWT Token

## 7. 模板管理 API

### 7.1 创建副本模板

**接口地址：** `POST /templates/dungeons`

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

### 7.2 获取副本模板列表

**接口地址：** `GET /templates/dungeons`

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

### 7.3 获取副本模板详情

**接口地址：** `GET /templates/dungeons/:id`

**认证：** 需要 JWT Token

### 7.4 更新副本模板

**接口地址：** `PATCH /templates/dungeons/:id`

**认证：** 需要 JWT Token + 管理员权限

### 7.5 删除副本模板

**接口地址：** `DELETE /templates/dungeons/:id`

**认证：** 需要 JWT Token + 管理员权限

### 7.6 创建周常任务模板

**接口地址：** `POST /templates/weekly-tasks`

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

### 7.7 获取周常任务模板列表

**接口地址：** `GET /templates/weekly-tasks`

**认证：** 需要 JWT Token

### 7.8 获取周常任务模板详情

**接口地址：** `GET /templates/weekly-tasks/:id`

**认证：** 需要 JWT Token

### 7.9 更新周常任务模板

**接口地址：** `PATCH /templates/weekly-tasks/:id`

**认证：** 需要 JWT Token + 管理员权限

### 7.10 删除周常任务模板

**接口地址：** `DELETE /templates/weekly-tasks/:id`

**认证：** 需要 JWT Token + 管理员权限

### 7.11 获取模板统计

**接口地址：** `GET /templates/stats`

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

## 8. 进度跟踪 API

### 8.1 获取当前周进度

**接口地址：** `GET /progress/current-week`

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

### 8.2 获取指定账号进度

**接口地址：** `GET /progress/account/:accountId`

**认证：** 需要 JWT Token

### 8.3 更新副本进度

**接口地址：** `PATCH /progress/dungeon`

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

### 8.4 更新周常任务进度

**接口地址：** `PATCH /progress/weekly-task`

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

### 8.5 获取进度统计

**接口地址：** `GET /progress/stats`

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

### 8.6 获取历史周进度

**接口地址：** `GET /progress/history`

**认证：** 需要 JWT Token

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountId | string | 否 | 账号ID筛选 |
| weeks | number | 否 | 获取最近几周的数据，默认4周 |

### 8.7 重置周进度（管理员）

**接口地址：** `POST /progress/admin/reset-weekly`

**认证：** 需要 JWT Token + 管理员权限

## 9. 定时任务管理 API

### 9.1 获取调度器信息

**接口地址：** `GET /scheduler/info`

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

### 9.2 手动触发周进度重置（管理员）

**接口地址：** `POST /scheduler/trigger-weekly-reset`

**认证：** 需要 JWT Token + 管理员权限

**响应示例：**

```json
{
  "code": 200,
  "message": "周进度重置已触发",
  "data": {
    "resetTime": "2024-01-01T12:00:00.000Z",
    "affectedAccounts": 15
  }
}
```

## 10. TypeScript 类型定义

### 10.1 基础类型

```typescript
// 用户相关类型
export interface User {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponseDto {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

// 账号相关类型
export interface Account {
  accountId: string;
  userId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountWithUserDto {
  accountId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    userId: string;
    username: string;
    email?: string;
    phone?: string;
    role: 'admin' | 'user';
  };
}

// 模板相关类型
export interface DungeonTemplate {
  templateId: string;
  dungeonName: string;
  bosses: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyTaskTemplate {
  templateId: string;
  taskName: string;
  targetCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 进度相关类型
export interface DungeonProgressData {
  [key: string]: boolean; // key 格式：templateId_bossIndex
}

export interface WeeklyTaskProgressData {
  [templateId: string]: number; // 已完成次数
}

export interface WeeklyProgress {
  progressId: string;
  accountId: string;
  weekStart: Date;
  dungeonProgress: DungeonProgressData;
  weeklyTaskProgress: WeeklyTaskProgressData;
  lastUpdated: Date;
}
```

### 10.2 请求 DTO 类型

```typescript
// 认证相关 DTO
export interface RegisterDto {
  username: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginDto {
  credential: string; // 用户名、邮箱或手机号
  password: string;
}

// 分页相关 DTO
export interface PaginationDto {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UserListDto extends PaginationDto {
  role?: 'admin' | 'user';
}

export interface AccountListDto extends PaginationDto {
  isActive?: boolean;
}

// 账号相关 DTO
export interface CreateAccountDto {
  accountName: string;
  isActive?: boolean;
}

export interface UpdateAccountDto {
  accountName?: string;
  isActive?: boolean;
}

// 模板相关 DTO
export interface CreateDungeonTemplateDto {
  dungeonName: string;
  bosses: string[];
}

export interface UpdateDungeonTemplateDto {
  dungeonName?: string;
  bosses?: string[];
}

export interface CreateWeeklyTaskTemplateDto {
  taskName: string;
  targetCount: number;
}

export interface UpdateWeeklyTaskTemplateDto {
  taskName?: string;
  targetCount?: number;
}

// 进度相关 DTO
export interface UpdateDungeonProgressDto {
  accountId: string;
  dungeonName: string;
  bossName: string;
  killCount: number;
}

export interface UpdateWeeklyTaskProgressDto {
  accountId: string;
  taskName: string;
  completedCount: number;
}
```

### 10.3 响应类型

```typescript
// 通用响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T> extends ApiResponse {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 登录响应类型
export interface LoginResponse {
  access_token: string;
  user: UserResponseDto;
}

// 统计响应类型
export interface AccountStatsResponse {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
}

export interface TemplateStatsResponse {
  dungeonTemplatesCount: number;
  weeklyTaskTemplatesCount: number;
}

export interface ProgressStatsResponse {
  totalAccounts: number;
  accountsWithProgress: number;
  completionRate: number;
}

export interface SchedulerInfoResponse {
  status: string;
  nextWeeklyReset: string;
  lastWeeklyReset: string;
  uptime: string;
}
```

### 10.4 错误类型

```typescript
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface ValidationError extends ApiError {
  statusCode: 400;
  message: string[];
  error: 'Bad Request';
}

export interface UnauthorizedError extends ApiError {
  statusCode: 401;
  message: string;
  error: 'Unauthorized';
}

export interface ForbiddenError extends ApiError {
  statusCode: 403;
  message: string;
  error: 'Forbidden';
}

export interface NotFoundError extends ApiError {
  statusCode: 404;
  message: string;
  error: 'Not Found';
}
```

---

**文档版本：** v1.0.0  
**最后更新：** 2025-11-03  
**维护者：** 开发团队

如有疑问或建议，请联系开发团队。