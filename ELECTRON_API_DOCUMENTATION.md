# 诛仙世界多账号管理系统 - Electron API 文档

## 概述

本文档专为 Electron 桌面应用提供 API 接口说明。所有 API 接口均基于 RESTful 架构设计，使用 JSON 格式进行数据交换。

**基础 URL：** `http://localhost:3000/api`

## 目录

1. [认证说明](#1-认证说明)
2. [通用响应格式](#2-通用响应格式)
3. [错误码说明](#3-错误码说明)
4. [认证 API](#4-认证-api)
5. [账号管理 API](#5-账号管理-api)
6. [共享账号管理 API](#6-共享账号管理-api)
7. [模板管理 API](#7-模板管理-api)
8. [进度跟踪 API](#8-进度跟踪-api)
9. [定时任务管理 API](#9-定时任务管理-api)
10. [Electron 特定配置](#10-electron-特定配置)

## 1. 认证说明

### JWT Token 认证
所有需要认证的接口都需要在请求头中包含 JWT Token：

```
Authorization: Bearer <your-jwt-token>
```

### 获取 Token
通过登录接口获取 JWT Token：

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

## 2. 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

## 3. 错误码说明

| 错误码 | HTTP状态码 | 描述 |
|--------|------------|------|
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 4. 认证 API

### 4.1 用户登录
- **接口地址：** `POST /api/auth/login`
- **认证要求：** 无
- **请求参数：**
```json
{
  "username": "string",
  "password": "string"
}
```
- **响应示例：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "username": "testuser",
      "role": "user"
    }
  }
}
```

### 4.2 用户注册
- **接口地址：** `POST /api/auth/register`
- **认证要求：** 无
- **请求参数：**
```json
{
  "username": "string",
  "password": "string",
  "email": "string"
}
```

### 4.3 刷新Token
- **接口地址：** `POST /api/auth/refresh`
- **认证要求：** Bearer Token
- **响应示例：**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token"
  }
}
```

## 5. 账号管理 API

### 5.1 获取账号列表
- **接口地址：** `GET /api/accounts`
- **认证要求：** Bearer Token
- **查询参数：**
  - `page`: 页码（可选，默认1）
  - `limit`: 每页数量（可选，默认10）
  - `search`: 搜索关键词（可选）

### 5.2 创建账号
- **接口地址：** `POST /api/accounts`
- **认证要求：** Bearer Token
- **请求参数：**
```json
{
  "username": "string",
  "password": "string",
  "server": "string",
  "character": "string",
  "level": "number",
  "status": "active|inactive"
}
```

### 5.3 更新账号
- **接口地址：** `PUT /api/accounts/{id}`
- **认证要求：** Bearer Token
- **请求参数：** 同创建账号

### 5.4 删除账号
- **接口地址：** `DELETE /api/accounts/{id}`
- **认证要求：** Bearer Token

## 6. 共享账号管理 API

### 6.1 获取共享账号列表
- **接口地址：** `GET /api/shared-accounts`
- **认证要求：** Bearer Token

### 6.2 创建共享账号
- **接口地址：** `POST /api/shared-accounts`
- **认证要求：** Bearer Token
- **请求参数：**
```json
{
  "accountName": "string",
  "description": "string",
  "maxUsers": "number"
}
```

### 6.3 添加用户到共享账号
- **接口地址：** `POST /api/shared-accounts/{accountName}/users`
- **认证要求：** Bearer Token
- **请求参数：**
```json
{
  "userId": "string",
  "permissions": ["read", "write", "admin"]
}
```

### 6.4 更新用户权限
- **接口地址：** `PUT /api/shared-accounts/{accountName}/users/{userId}/permissions`
- **认证要求：** Bearer Token
- **请求参数：**
```json
{
  "permissions": ["read", "write"]
}
```

## 7. 模板管理 API

### 7.1 获取模板列表
- **接口地址：** `GET /api/templates`
- **认证要求：** Bearer Token

### 7.2 创建副本模板
- **接口地址：** `POST /api/templates`
- **认证要求：** Bearer Token
- **请求参数：**
```json
{
  "name": "string",
  "description": "string",
  "config": {}
}
```

## 8. 进度跟踪 API

### 8.1 获取进度信息
- **接口地址：** `GET /api/progress/{taskId}`
- **认证要求：** Bearer Token

### 8.2 更新进度
- **接口地址：** `PUT /api/progress/{taskId}`
- **认证要求：** Bearer Token
- **请求参数：**
```json
{
  "progress": "number",
  "status": "string",
  "message": "string"
}
```

## 9. 定时任务管理 API

### 9.1 获取任务列表
- **接口地址：** `GET /api/scheduled-tasks`
- **认证要求：** Bearer Token

### 9.2 创建定时任务
- **接口地址：** `POST /api/scheduled-tasks`
- **认证要求：** Bearer Token
- **请求参数：**
```json
{
  "name": "string",
  "cron": "string",
  "action": "string",
  "enabled": "boolean"
}
```

## 10. Electron 特定配置

### 10.1 应用配置
Electron 应用需要配置以下参数：

```javascript
// main.js 或 preload.js 中的配置
const API_BASE_URL = 'http://localhost:3000/api';
const DEFAULT_TIMEOUT = 30000; // 30秒超时

// 请求拦截器配置
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = DEFAULT_TIMEOUT;
```

### 10.2 错误处理
```javascript
// 统一错误处理
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 处理未授权错误，跳转到登录页面
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 10.3 Token 管理
```javascript
// Token 存储和管理
const TokenManager = {
  setToken(token) {
    localStorage.setItem('jwt_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  
  getToken() {
    return localStorage.getItem('jwt_token');
  },
  
  removeToken() {
    localStorage.removeItem('jwt_token');
    delete axios.defaults.headers.common['Authorization'];
  }
};
```

### 10.4 WebSocket 连接（实时更新）
```javascript
// WebSocket 连接配置
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 处理实时更新数据
  handleRealtimeUpdate(data);
};
```

### 10.5 文件上传处理
```javascript
// 文件上传配置
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return axios.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      const progress = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      updateUploadProgress(progress);
    }
  });
};
```

---

**文档版本：** v1.1.0  
**最后更新：** 2025-11-04  
**维护者：** 开发团队  
**适用于：** Electron 桌面应用

如有疑问或建议，请联系开发团队。