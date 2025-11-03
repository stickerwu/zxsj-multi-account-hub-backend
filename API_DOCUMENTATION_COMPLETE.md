# 诛仙世界多账号管理系统 API 完整文档

## 概述

本文档详细描述了诛仙世界多账号管理系统的所有API接口，包括请求参数、响应格式、错误处理和使用示例。

### 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

#### 成功响应
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {} // 具体数据
}
```

#### 分页响应
```json
{
  "total": 100,
  "items": [], // 当前页数据
  "page": 1,
  "size": 20,
  "totalPages": 5
}
```

#### 错误响应
```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": "Validation failed"
}
```

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（需要登录） |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 500 | 服务器内部错误 |

---

## 1. 系统信息模块

### 1.1 获取系统欢迎信息

**接口地址**: `GET /`

**接口描述**: 获取系统欢迎信息，用于测试API连通性

**请求参数**: 无

**响应示例**:
```
Hello World!
```

**使用场景**: 
- 测试API服务是否正常运行
- 健康检查的简单端点

---

### 1.2 系统健康检查

**接口地址**: `GET /health`

**接口描述**: 获取系统健康状态信息

**请求参数**: 无

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

**使用场景**:
- 监控系统运行状态
- 部署后的健康检查
- 负载均衡器的健康探测

---

## 2. 认证管理模块

### 2.1 用户注册

**接口地址**: `POST /auth/register`

**接口描述**: 新用户注册账号

**请求参数**:
```json
{
  "username": "testuser",      // 必填，用户名，3-50字符
  "email": "test@example.com", // 可选，邮箱地址
  "phone": "13800138000",      // 可选，手机号码，11位数字
  "password": "password123"    // 必填，密码，6-100字符
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "userId": "uuid-string",
    "username": "testuser"
  }
}
```

**错误情况**:
- `400`: 参数验证失败（用户名长度不符、邮箱格式错误等）
- `409`: 用户名、邮箱或手机号已存在

**使用场景**:
- 新用户首次注册
- 批量创建测试账号

---

### 2.2 用户登录

**接口地址**: `POST /auth/login`

**接口描述**: 用户登录获取访问令牌

**请求参数**:
```json
{
  "credential": "testuser",    // 必填，用户名/邮箱/手机号
  "password": "password123"    // 必填，密码
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "uuid-string",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    }
  }
}
```

**错误情况**:
- `401`: 用户名或密码错误
- `400`: 参数格式错误

**使用场景**:
- 用户登录系统
- 获取API访问令牌
- 自动登录功能

---

### 2.3 获取当前用户信息

**接口地址**: `GET /auth/profile`

**接口描述**: 获取当前登录用户的详细信息

**请求头**:
```
Authorization: Bearer <access_token>
```

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "userId": "uuid-string",
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138000",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误情况**:
- `401`: 未授权（token无效或过期）

**使用场景**:
- 获取用户个人信息
- 验证token有效性
- 用户信息展示

---

### 2.4 获取所有用户列表（管理员专用）

**接口地址**: `GET /auth/admin/users`

**接口描述**: 分页获取系统中所有用户的列表，仅管理员可访问

**请求头**:
```
Authorization: Bearer <admin_access_token>
```

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码，从1开始 |
| size | integer | 否 | 20 | 每页数量，最大100 |
| search | string | 否 | - | 搜索关键词（用户名、邮箱） |
| role | string | 否 | - | 角色筛选（admin/user） |

**响应示例**:
```json
{
  "total": 100,
  "items": [
    {
      "userId": "uuid-1",
      "username": "admin",
      "email": "admin@example.com",
      "phone": null,
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "userId": "uuid-2",
      "username": "user1",
      "email": "user1@example.com",
      "phone": "13800138001",
      "role": "user",
      "createdAt": "2024-01-02T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "page": 1,
  "size": 20,
  "totalPages": 5
}
```

**错误情况**:
- `401`: 未授权
- `403`: 权限不足（非管理员）

**使用场景**:
- 管理员查看所有用户
- 用户管理功能
- 统计分析

---

## 3. 账号管理模块

### 3.1 创建新账号

**接口地址**: `POST /accounts`

**接口描述**: 为当前用户创建新的游戏账号

**请求头**:
```
Authorization: Bearer <access_token>
```

**请求参数**:
```json
{
  "accountName": "我的游戏账号1",  // 必填，账号名称
  "isActive": true              // 可选，是否激活，默认true
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "账号创建成功",
  "data": {
    "accountId": "uuid-string",
    "accountName": "我的游戏账号1",
    "userId": "uuid-string",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误情况**:
- `400`: 参数验证失败
- `401`: 未授权

**使用场景**:
- 用户添加新的游戏账号
- 批量创建账号

---

### 3.2 获取当前用户的账号列表

**接口地址**: `GET /accounts`

**接口描述**: 分页获取当前用户的所有游戏账号

**请求头**:
```
Authorization: Bearer <access_token>
```

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码，从1开始 |
| size | integer | 否 | 20 | 每页数量，最大100 |
| search | string | 否 | - | 搜索关键词（账号名称） |
| isActive | boolean | 否 | - | 是否激活筛选 |

**响应示例**:
```json
{
  "total": 5,
  "items": [
    {
      "accountId": "uuid-1",
      "accountName": "我的游戏账号1",
      "userId": "uuid-string",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "accountId": "uuid-2",
      "accountName": "我的游戏账号2",
      "userId": "uuid-string",
      "isActive": false,
      "createdAt": "2024-01-02T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "page": 1,
  "size": 20,
  "totalPages": 1
}
```

**使用场景**:
- 用户查看自己的账号列表
- 账号管理界面
- 选择账号进行操作

---

### 3.3 获取账号详情

**接口地址**: `GET /accounts/{id}`

**接口描述**: 根据账号ID获取账号详细信息

**请求头**:
```
Authorization: Bearer <access_token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 账号ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "accountId": "uuid-string",
    "accountName": "我的游戏账号1",
    "userId": "uuid-string",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误情况**:
- `401`: 未授权
- `404`: 账号不存在或无权访问

**使用场景**:
- 查看账号详细信息
- 编辑账号前获取当前信息

---

### 3.4 更新账号信息

**接口地址**: `PATCH /accounts/{id}`

**接口描述**: 更新指定账号的信息

**请求头**:
```
Authorization: Bearer <access_token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 账号ID |

**请求参数**:
```json
{
  "accountName": "更新后的账号名",  // 可选，账号名称
  "isActive": false              // 可选，是否激活
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "accountId": "uuid-string",
    "accountName": "更新后的账号名",
    "isActive": false,
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**错误情况**:
- `400`: 参数验证失败
- `401`: 未授权
- `404`: 账号不存在

**使用场景**:
- 修改账号名称
- 启用/禁用账号
- 批量更新账号状态

---

### 3.5 删除账号

**接口地址**: `DELETE /accounts/{id}`

**接口描述**: 删除指定的游戏账号

**请求头**:
```
Authorization: Bearer <access_token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 账号ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

**错误情况**:
- `401`: 未授权
- `404`: 账号不存在

**使用场景**:
- 删除不需要的账号
- 清理测试数据

---

### 3.6 获取所有账号列表（管理员专用）

**接口地址**: `GET /accounts/admin/all`

**接口描述**: 分页获取系统中所有用户的账号，仅管理员可访问

**请求头**:
```
Authorization: Bearer <admin_access_token>
```

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码，从1开始 |
| size | integer | 否 | 20 | 每页数量，最大100 |
| search | string | 否 | - | 搜索关键词（账号名、用户名、邮箱） |
| isActive | boolean | 否 | - | 是否激活筛选 |

**响应示例**:
```json
{
  "total": 50,
  "items": [
    {
      "accountId": "uuid-1",
      "accountName": "用户1的账号",
      "userId": "uuid-user1",
      "user": {
        "username": "user1",
        "email": "user1@example.com"
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "size": 20,
  "totalPages": 3
}
```

**使用场景**:
- 管理员查看所有账号
- 系统统计分析
- 账号管理功能

---

## 4. 模板管理模块

### 4.1 创建副本模板（仅管理员）

**接口地址**: `POST /templates/dungeons`

**接口描述**: 创建新的副本模板，定义副本名称和BOSS列表

**请求头**:
```
Authorization: Bearer <admin_access_token>
```

**请求参数**:
```json
{
  "dungeonName": "青云门副本",           // 必填，副本名称
  "bosses": ["BOSS1", "BOSS2", "BOSS3"] // 必填，BOSS列表
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "副本模板创建成功",
  "data": {
    "templateId": "uuid-string",
    "dungeonName": "青云门副本",
    "bosses": ["BOSS1", "BOSS2", "BOSS3"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误情况**:
- `400`: 参数验证失败
- `401`: 未授权
- `403`: 需要管理员权限

**使用场景**:
- 管理员配置新副本
- 游戏版本更新后添加新副本
- 副本信息维护

---

### 4.2 获取副本模板列表

**接口地址**: `GET /templates/dungeons`

**接口描述**: 分页获取所有副本模板

**请求头**:
```
Authorization: Bearer <access_token>
```

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码，从1开始 |
| size | integer | 否 | 20 | 每页数量，最大100 |
| search | string | 否 | - | 搜索关键词（副本名称） |

**响应示例**:
```json
{
  "total": 10,
  "items": [
    {
      "templateId": "uuid-1",
      "dungeonName": "青云门副本",
      "bosses": ["BOSS1", "BOSS2", "BOSS3"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "templateId": "uuid-2",
      "dungeonName": "天音寺副本",
      "bosses": ["天音BOSS1", "天音BOSS2"],
      "createdAt": "2024-01-02T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "page": 1,
  "size": 20,
  "totalPages": 1
}
```

**使用场景**:
- 用户查看可用副本
- 进度跟踪界面显示
- 副本选择功能

---

### 4.3 获取副本模板详情

**接口地址**: `GET /templates/dungeons/{id}`

**接口描述**: 根据模板ID获取副本模板详细信息

**请求头**:
```
Authorization: Bearer <access_token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 副本模板ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "templateId": "uuid-string",
    "dungeonName": "青云门副本",
    "bosses": ["BOSS1", "BOSS2", "BOSS3"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误情况**:
- `401`: 未授权
- `404`: 副本模板不存在

**使用场景**:
- 查看副本详细信息
- 编辑副本前获取当前信息

---

### 4.4 更新副本模板（仅管理员）

**接口地址**: `PATCH /templates/dungeons/{id}`

**接口描述**: 更新指定副本模板的信息

**请求头**:
```
Authorization: Bearer <admin_access_token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 副本模板ID |

**请求参数**:
```json
{
  "dungeonName": "更新后的副本名",        // 可选，副本名称
  "bosses": ["新BOSS1", "新BOSS2"]      // 可选，BOSS列表
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "templateId": "uuid-string",
    "dungeonName": "更新后的副本名",
    "bosses": ["新BOSS1", "新BOSS2"],
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**错误情况**:
- `400`: 参数验证失败
- `401`: 未授权
- `403`: 需要管理员权限
- `404`: 副本模板不存在

**使用场景**:
- 修改副本信息
- 调整BOSS列表
- 游戏版本更新维护

---

### 4.5 删除副本模板（仅管理员）

**接口地址**: `DELETE /templates/dungeons/{id}`

**接口描述**: 删除指定的副本模板

**请求头**:
```
Authorization: Bearer <admin_access_token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 副本模板ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

**错误情况**:
- `401`: 未授权
- `403`: 需要管理员权限
- `404`: 副本模板不存在

**使用场景**:
- 删除过时的副本
- 清理测试数据

---

### 4.6 创建周常任务模板（仅管理员）

**接口地址**: `POST /templates/weekly-tasks`

**接口描述**: 创建新的周常任务模板

**请求头**:
```
Authorization: Bearer <admin_access_token>
```

**请求参数**:
```json
{
  "taskName": "每日签到",     // 必填，任务名称
  "targetCount": 7          // 必填，目标完成次数，最小值1
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "周常任务模板创建成功",
  "data": {
    "templateId": "uuid-string",
    "taskName": "每日签到",
    "targetCount": 7,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误情况**:
- `400`: 参数验证失败
- `401`: 未授权
- `403`: 需要管理员权限

**使用场景**:
- 管理员配置周常任务
- 任务系统维护
- 新任务类型添加

---

### 4.7 获取周常任务模板列表

**接口地址**: `GET /templates/weekly-tasks`

**接口描述**: 分页获取所有周常任务模板

**请求头**:
```
Authorization: Bearer <access_token>
```

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码，从1开始 |
| size | integer | 否 | 20 | 每页数量，最大100 |
| search | string | 否 | - | 搜索关键词（任务名称） |

**响应示例**:
```json
{
  "total": 5,
  "items": [
    {
      "templateId": "uuid-1",
      "taskName": "每日签到",
      "targetCount": 7,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "templateId": "uuid-2",
      "taskName": "每日任务",
      "targetCount": 14,
      "createdAt": "2024-01-02T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "page": 1,
  "size": 20,
  "totalPages": 1
}
```

**使用场景**:
- 用户查看可用任务
- 任务进度跟踪
- 任务完成情况统计

---

### 4.8 获取周常任务模板详情

**接口地址**: `GET /templates/weekly-tasks/{id}`

**接口描述**: 根据模板ID获取周常任务模板详细信息

**请求头**:
```
Authorization: Bearer <access_token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 周常任务模板ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "templateId": "uuid-string",
    "taskName": "每日签到",
    "targetCount": 7,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误情况**:
- `401`: 未授权
- `404`: 周常任务模板不存在

**使用场景**:
- 查看任务详细信息
- 编辑任务前获取当前信息

---

### 4.9 更新周常任务模板（仅管理员）

**接口地址**: `PATCH /templates/weekly-tasks/{id}`

**接口描述**: 更新指定周常任务模板的信息

**请求头**:
```
Authorization: Bearer <admin_access_token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 周常任务模板ID |

**请求参数**:
```json
{
  "taskName": "更新后的任务名",  // 可选，任务名称
  "targetCount": 10           // 可选，目标完成次数，最小值1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "templateId": "uuid-string",
    "taskName": "更新后的任务名",
    "targetCount": 10,
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**错误情况**:
- `400`: 参数验证失败
- `401`: 未授权
- `403`: 需要管理员权限
- `404`: 周常任务模板不存在

**使用场景**:
- 修改任务信息
- 调整目标完成次数
- 任务系统维护

---

### 4.10 删除周常任务模板（仅管理员）

**接口地址**: `DELETE /templates/weekly-tasks/{id}`

**接口描述**: 删除指定的周常任务模板

**请求头**:
```
Authorization: Bearer <admin_access_token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 周常任务模板ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

**错误情况**:
- `401`: 未授权
- `403`: 需要管理员权限
- `404`: 周常任务模板不存在

**使用场景**:
- 删除过时的任务
- 清理测试数据

---

## 5. 进度跟踪模块

### 5.1 获取当前周进度

**接口地址**: `GET /progress/current-week`

**接口描述**: 分页获取当前用户所有账号的当前周进度信息

**请求头**:
```
Authorization: Bearer <access_token>
```

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码，从1开始 |
| size | integer | 否 | 20 | 每页数量，最大100 |
| search | string | 否 | - | 搜索关键词（账号名称） |

**响应示例**:
```json
{
  "total": 3,
  "items": [
    {
      "progressId": "uuid-1",
      "accountId": "uuid-account1",
      "account": {
        "accountName": "我的游戏账号1",
        "isActive": true
      },
      "weekStart": "2024-01-01T00:00:00.000Z",
      "dungeonProgress": {
        "template1_0": true,   // 副本1的第1个BOSS已击杀
        "template1_1": false,  // 副本1的第2个BOSS未击杀
        "template2_0": true    // 副本2的第1个BOSS已击杀
      },
      "weeklyTaskProgress": {
        "task1": 5,  // 任务1已完成5次
        "task2": 3   // 任务2已完成3次
      },
      "lastUpdated": "2024-01-01T12:00:00.000Z"
    }
  ],
  "page": 1,
  "size": 20,
  "totalPages": 1
}
```

**数据结构说明**:
- `dungeonProgress`: 副本进度数据，key格式为 `templateId_bossIndex`，value为布尔值表示是否已击杀
- `weeklyTaskProgress`: 周常任务进度数据，key为任务模板ID，value为已完成次数

**使用场景**:
- 查看当前周的游戏进度
- 进度统计和分析
- 计划下周的游戏安排

---

## 6. 共享账号管理模块

### 6.1 获取共享账号列表

**接口地址**: `GET /shared-accounts`

**接口描述**: 获取当前用户可访问的共享账号列表

**请求头**:
```
Authorization: Bearer <access_token>
```

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码，从1开始 |
| size | integer | 否 | 20 | 每页数量，最大100 |
| search | string | 否 | - | 搜索关键词（账号名称） |

**响应示例**:
```json
{
  "total": 2,
  "items": [
    {
      "accountId": "uuid-shared1",
      "accountName": "公会共享账号1",
      "owner": {
        "username": "guild_leader",
        "email": "leader@example.com"
      },
      "isActive": true,
      "sharedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "size": 20,
  "totalPages": 1
}
```

**使用场景**:
- 查看可访问的共享账号
- 公会或团队账号管理
- 协作游戏进度跟踪

---

## 7. 错误处理和最佳实践

### 7.1 通用错误码

| 错误码 | HTTP状态码 | 说明 | 解决方案 |
|--------|------------|------|----------|
| 1001 | 400 | 请求参数格式错误 | 检查请求参数格式和类型 |
| 1002 | 400 | 必填参数缺失 | 补充必填参数 |
| 1003 | 400 | 参数值超出范围 | 调整参数值到有效范围 |
| 2001 | 401 | 未提供认证信息 | 添加Authorization头 |
| 2002 | 401 | 认证信息无效 | 重新登录获取新token |
| 2003 | 401 | 认证信息已过期 | 重新登录获取新token |
| 3001 | 403 | 权限不足 | 联系管理员获取权限 |
| 4001 | 404 | 资源不存在 | 检查资源ID是否正确 |
| 5001 | 409 | 资源冲突 | 检查是否存在重复数据 |
| 9001 | 500 | 服务器内部错误 | 联系技术支持 |

### 7.2 API调用最佳实践

#### 认证处理
```javascript
// 设置默认请求头
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});

// 响应拦截器处理token过期
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 清除过期token，跳转到登录页
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 分页处理
```javascript
// 分页数据获取
const fetchAccounts = async (page = 1, size = 20, search = '') => {
  try {
    const response = await api.get('/accounts', {
      params: { page, size, search }
    });
    return response.data;
  } catch (error) {
    console.error('获取账号列表失败:', error);
    throw error;
  }
};
```

#### 错误处理
```javascript
// 统一错误处理
const handleApiError = (error) => {
  if (error.response) {
    const { code, message } = error.response.data;
    switch (code) {
      case 1001:
        showMessage('请求参数格式错误，请检查输入');
        break;
      case 2002:
        showMessage('登录已过期，请重新登录');
        redirectToLogin();
        break;
      case 3001:
        showMessage('权限不足，无法执行此操作');
        break;
      default:
        showMessage(message || '操作失败，请稍后重试');
    }
  } else {
    showMessage('网络错误，请检查网络连接');
  }
};
```

### 7.3 性能优化建议

1. **分页查询**: 使用合适的页面大小，避免一次性加载过多数据
2. **搜索优化**: 实现防抖搜索，避免频繁请求
3. **缓存策略**: 对不经常变化的数据（如模板列表）进行适当缓存
4. **并发控制**: 避免同时发起过多请求，使用请求队列管理

### 7.4 安全注意事项

1. **Token管理**: 
   - 安全存储访问令牌
   - 定期刷新token
   - 退出时清除token

2. **数据验证**: 
   - 前端进行基础验证
   - 后端进行完整验证
   - 防止XSS和SQL注入

3. **权限控制**: 
   - 严格按照用户权限显示功能
   - 敏感操作需要二次确认
   - 管理员功能需要额外验证

---

## 8. 使用示例

### 8.1 完整的用户注册登录流程

```javascript
// 1. 用户注册
const register = async (userData) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('注册成功:', result);
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
};

// 2. 用户登录
const login = async (credential, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ credential, password })
    });
    
    if (response.ok) {
      const result = await response.json();
      // 保存token
      localStorage.setItem('access_token', result.data.access_token);
      localStorage.setItem('user_info', JSON.stringify(result.data.user));
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

// 3. 获取用户信息
const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    } else {
      throw new Error('获取用户信息失败');
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};
```

### 8.2 账号管理操作示例

```javascript
// 创建账号
const createAccount = async (accountName, isActive = true) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch('http://localhost:3000/api/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ accountName, isActive })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('账号创建成功:', result);
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('创建账号失败:', error);
    throw error;
  }
};

// 获取账号列表
const getAccounts = async (page = 1, size = 20, search = '') => {
  try {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({ page, size });
    if (search) params.append('search', search);
    
    const response = await fetch(`http://localhost:3000/api/accounts?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('获取账号列表失败');
    }
  } catch (error) {
    console.error('获取账号列表失败:', error);
    throw error;
  }
};

// 更新账号
const updateAccount = async (accountId, updateData) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`http://localhost:3000/api/accounts/${accountId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('账号更新成功:', result);
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('更新账号失败:', error);
    throw error;
  }
};
```

### 8.3 进度跟踪示例

```javascript
// 获取当前周进度
const getCurrentWeekProgress = async (page = 1, size = 20) => {
  try {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({ page, size });
    
    const response = await fetch(`http://localhost:3000/api/progress/current-week?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      throw new Error('获取进度信息失败');
    }
  } catch (error) {
    console.error('获取进度信息失败:', error);
    throw error;
  }
};

// 处理进度数据
const processProgressData = (progressData) => {
  return progressData.items.map(progress => {
    // 计算副本完成情况
    const dungeonStats = {};
    Object.entries(progress.dungeonProgress).forEach(([key, completed]) => {
      const [templateId, bossIndex] = key.split('_');
      if (!dungeonStats[templateId]) {
        dungeonStats[templateId] = { completed: 0, total: 0 };
      }
      dungeonStats[templateId].total++;
      if (completed) {
        dungeonStats[templateId].completed++;
      }
    });
    
    // 计算任务完成情况
    const taskStats = Object.entries(progress.weeklyTaskProgress).map(([templateId, count]) => ({
      templateId,
      completed: count,
      // 需要从模板数据中获取目标次数
    }));
    
    return {
      ...progress,
      dungeonStats,
      taskStats
    };
  });
};
```

---

## 9. 附录

### 9.1 数据模型关系图

```
User (用户)
├── Account (游戏账号) [1:N]
│   └── WeeklyProgress (周进度) [1:N]
│
DungeonTemplate (副本模板) [N:M] ← WeeklyProgress
WeeklyTaskTemplate (任务模板) [N:M] ← WeeklyProgress
```

### 9.2 权限矩阵

| 功能模块 | 普通用户 | 管理员 |
|----------|----------|--------|
| 用户注册/登录 | ✅ | ✅ |
| 查看个人信息 | ✅ | ✅ |
| 管理个人账号 | ✅ | ✅ |
| 查看模板列表 | ✅ | ✅ |
| 查看个人进度 | ✅ | ✅ |
| 查看所有用户 | ❌ | ✅ |
| 查看所有账号 | ❌ | ✅ |
| 管理模板 | ❌ | ✅ |

### 9.3 版本更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2024-01-01 | 初始版本，包含基础功能 |

---

**文档版本**: 1.1.0
**最后更新**: 2025-11-04  
**维护者**: 开发团队