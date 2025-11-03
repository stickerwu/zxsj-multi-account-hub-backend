# API 模块快速参考

本文档按功能模块整理了所有API接口，方便Electron前端开发时快速查找和使用。

## 基础配置

```javascript
// API基础配置
const API_BASE_URL = 'http://localhost:3000/api';
const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // 需要认证的接口
  }
};
```

---

## 1. 系统信息模块 (System)

### 接口列表
| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/` | 系统欢迎信息 | ❌ |
| GET | `/health` | 系统健康检查 | ❌ |

### 前端使用示例
```javascript
// 系统健康检查
const checkSystemHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return await response.json();
};
```

---

## 2. 认证管理模块 (Authentication)

### 接口列表
| 方法 | 路径 | 描述 | 认证 | 权限 |
|------|------|------|------|------|
| POST | `/auth/register` | 用户注册 | ❌ | - |
| POST | `/auth/login` | 用户登录 | ❌ | - |
| GET | `/auth/profile` | 获取当前用户信息 | ✅ | User |
| GET | `/auth/admin/users` | 获取所有用户列表 | ✅ | Admin |

### 数据模型
```typescript
// 注册请求
interface RegisterDto {
  username: string;      // 3-50字符
  email?: string;        // 邮箱格式
  phone?: string;        // 11位数字
  password: string;      // 6-100字符
}

// 登录请求
interface LoginDto {
  credential: string;    // 用户名/邮箱/手机号
  password: string;
}

// 用户信息
interface User {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}
```

### 前端使用示例
```javascript
// 认证服务类
class AuthService {
  // 用户注册
  static async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  }

  // 用户登录
  static async login(credential, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, password })
    });
    const result = await response.json();
    
    if (result.code === 200) {
      // 保存token
      localStorage.setItem('access_token', result.data.access_token);
      localStorage.setItem('user_info', JSON.stringify(result.data.user));
    }
    return result;
  }

  // 获取用户信息
  static async getProfile() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // 获取所有用户（管理员）
  static async getAllUsers(page = 1, size = 20, search = '') {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({ page, size });
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_BASE_URL}/auth/admin/users?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // 退出登录
  static logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
  }

  // 检查是否已登录
  static isLoggedIn() {
    return !!localStorage.getItem('access_token');
  }

  // 获取当前用户信息
  static getCurrentUser() {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  }
}
```

---

## 3. 账号管理模块 (Accounts)

### 接口列表
| 方法 | 路径 | 描述 | 认证 | 权限 |
|------|------|------|------|------|
| POST | `/accounts` | 创建新账号 | ✅ | User |
| GET | `/accounts` | 获取当前用户账号列表 | ✅ | User |
| GET | `/accounts/{id}` | 获取账号详情 | ✅ | User |
| PATCH | `/accounts/{id}` | 更新账号信息 | ✅ | User |
| DELETE | `/accounts/{id}` | 删除账号 | ✅ | User |
| GET | `/accounts/admin/all` | 获取所有账号列表 | ✅ | Admin |

### 数据模型
```typescript
// 创建账号请求
interface CreateAccountDto {
  accountName: string;   // 账号名称
  isActive?: boolean;    // 是否激活，默认true
}

// 账号信息
interface Account {
  accountId: string;
  accountName: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 分页响应
interface PaginatedResponse<T> {
  total: number;
  items: T[];
  page: number;
  size: number;
  totalPages: number;
}
```

### 前端使用示例
```javascript
// 账号服务类
class AccountService {
  // 创建账号
  static async createAccount(accountName, isActive = true) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ accountName, isActive })
    });
    return await response.json();
  }

  // 获取账号列表
  static async getAccounts(page = 1, size = 20, search = '', isActive = null) {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({ page, size });
    if (search) params.append('search', search);
    if (isActive !== null) params.append('isActive', isActive);
    
    const response = await fetch(`${API_BASE_URL}/accounts?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // 获取账号详情
  static async getAccountById(accountId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // 更新账号
  static async updateAccount(accountId, updateData) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    return await response.json();
  }

  // 删除账号
  static async deleteAccount(accountId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // 获取所有账号（管理员）
  static async getAllAccounts(page = 1, size = 20, search = '', isActive = null) {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({ page, size });
    if (search) params.append('search', search);
    if (isActive !== null) params.append('isActive', isActive);
    
    const response = await fetch(`${API_BASE_URL}/accounts/admin/all?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }
}
```

---

## 4. 模板管理模块 (Templates)

### 4.1 副本模板 (Dungeon Templates)

#### 接口列表
| 方法 | 路径 | 描述 | 认证 | 权限 |
|------|------|------|------|------|
| POST | `/templates/dungeons` | 创建副本模板 | ✅ | Admin |
| GET | `/templates/dungeons` | 获取副本模板列表 | ✅ | User |
| GET | `/templates/dungeons/{id}` | 获取副本模板详情 | ✅ | User |
| PATCH | `/templates/dungeons/{id}` | 更新副本模板 | ✅ | Admin |
| DELETE | `/templates/dungeons/{id}` | 删除副本模板 | ✅ | Admin |

#### 数据模型
```typescript
// 创建副本模板请求
interface CreateDungeonTemplateDto {
  dungeonName: string;   // 副本名称
  bosses: string[];      // BOSS列表
}

// 副本模板信息
interface DungeonTemplate {
  templateId: string;
  dungeonName: string;
  bosses: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 周常任务模板 (Weekly Task Templates)

#### 接口列表
| 方法 | 路径 | 描述 | 认证 | 权限 |
|------|------|------|------|------|
| POST | `/templates/weekly-tasks` | 创建任务模板 | ✅ | Admin |
| GET | `/templates/weekly-tasks` | 获取任务模板列表 | ✅ | User |
| GET | `/templates/weekly-tasks/{id}` | 获取任务模板详情 | ✅ | User |
| PATCH | `/templates/weekly-tasks/{id}` | 更新任务模板 | ✅ | Admin |
| DELETE | `/templates/weekly-tasks/{id}` | 删除任务模板 | ✅ | Admin |

#### 数据模型
```typescript
// 创建任务模板请求
interface CreateWeeklyTaskTemplateDto {
  taskName: string;      // 任务名称
  targetCount: number;   // 目标完成次数，最小值1
}

// 任务模板信息
interface WeeklyTaskTemplate {
  templateId: string;
  taskName: string;
  targetCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### 前端使用示例
```javascript
// 模板服务类
class TemplateService {
  // === 副本模板相关 ===
  
  // 创建副本模板（管理员）
  static async createDungeonTemplate(dungeonName, bosses) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/templates/dungeons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ dungeonName, bosses })
    });
    return await response.json();
  }

  // 获取副本模板列表
  static async getDungeonTemplates(page = 1, size = 20, search = '') {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({ page, size });
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_BASE_URL}/templates/dungeons?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // 获取副本模板详情
  static async getDungeonTemplateById(templateId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/templates/dungeons/${templateId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // 更新副本模板（管理员）
  static async updateDungeonTemplate(templateId, updateData) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/templates/dungeons/${templateId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    return await response.json();
  }

  // 删除副本模板（管理员）
  static async deleteDungeonTemplate(templateId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/templates/dungeons/${templateId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // === 周常任务模板相关 ===
  
  // 创建任务模板（管理员）
  static async createWeeklyTaskTemplate(taskName, targetCount) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/templates/weekly-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ taskName, targetCount })
    });
    return await response.json();
  }

  // 获取任务模板列表
  static async getWeeklyTaskTemplates(page = 1, size = 20, search = '') {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({ page, size });
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_BASE_URL}/templates/weekly-tasks?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // 获取任务模板详情
  static async getWeeklyTaskTemplateById(templateId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/templates/weekly-tasks/${templateId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // 更新任务模板（管理员）
  static async updateWeeklyTaskTemplate(templateId, updateData) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/templates/weekly-tasks/${templateId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    return await response.json();
  }

  // 删除任务模板（管理员）
  static async deleteWeeklyTaskTemplate(templateId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/templates/weekly-tasks/${templateId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }
}
```

---

## 5. 进度跟踪模块 (Progress)

### 接口列表
| 方法 | 路径 | 描述 | 认证 | 权限 |
|------|------|------|------|------|
| GET | `/progress/current-week` | 获取当前周进度 | ✅ | User |

### 数据模型
```typescript
// 周进度信息
interface WeeklyProgress {
  progressId: string;
  accountId: string;
  account: {
    accountName: string;
    isActive: boolean;
  };
  weekStart: string;
  dungeonProgress: Record<string, boolean>;    // key: templateId_bossIndex, value: 是否已击杀
  weeklyTaskProgress: Record<string, number>;  // key: templateId, value: 已完成次数
  lastUpdated: string;
}
```

### 前端使用示例
```javascript
// 进度服务类
class ProgressService {
  // 获取当前周进度
  static async getCurrentWeekProgress(page = 1, size = 20, search = '') {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({ page, size });
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_BASE_URL}/progress/current-week?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // 处理进度数据，计算完成统计
  static processProgressData(progressData, dungeonTemplates, taskTemplates) {
    return progressData.items.map(progress => {
      // 计算副本完成情况
      const dungeonStats = {};
      
      // 按模板分组统计
      dungeonTemplates.forEach(template => {
        dungeonStats[template.templateId] = {
          templateName: template.dungeonName,
          bosses: template.bosses,
          completed: 0,
          total: template.bosses.length
        };
        
        // 统计已击杀的BOSS
        template.bosses.forEach((boss, index) => {
          const key = `${template.templateId}_${index}`;
          if (progress.dungeonProgress[key]) {
            dungeonStats[template.templateId].completed++;
          }
        });
      });
      
      // 计算任务完成情况
      const taskStats = taskTemplates.map(template => ({
        templateId: template.templateId,
        taskName: template.taskName,
        completed: progress.weeklyTaskProgress[template.templateId] || 0,
        target: template.targetCount,
        progress: Math.min(100, ((progress.weeklyTaskProgress[template.templateId] || 0) / template.targetCount) * 100)
      }));
      
      return {
        ...progress,
        dungeonStats,
        taskStats
      };
    });
  }

  // 获取进度概览
  static async getProgressOverview() {
    try {
      // 并行获取数据
      const [progressData, dungeonTemplates, taskTemplates] = await Promise.all([
        this.getCurrentWeekProgress(1, 100), // 获取所有进度
        TemplateService.getDungeonTemplates(1, 100), // 获取所有副本模板
        TemplateService.getWeeklyTaskTemplates(1, 100) // 获取所有任务模板
      ]);

      // 处理数据
      const processedProgress = this.processProgressData(
        progressData,
        dungeonTemplates.items,
        taskTemplates.items
      );

      // 计算总体统计
      const totalAccounts = processedProgress.length;
      const activeAccounts = processedProgress.filter(p => p.account.isActive).length;
      
      // 计算副本完成率
      let totalDungeonProgress = 0;
      let completedDungeonProgress = 0;
      
      processedProgress.forEach(progress => {
        Object.values(progress.dungeonStats).forEach(stat => {
          totalDungeonProgress += stat.total;
          completedDungeonProgress += stat.completed;
        });
      });
      
      const dungeonCompletionRate = totalDungeonProgress > 0 
        ? (completedDungeonProgress / totalDungeonProgress) * 100 
        : 0;

      return {
        accounts: processedProgress,
        summary: {
          totalAccounts,
          activeAccounts,
          dungeonCompletionRate: Math.round(dungeonCompletionRate * 100) / 100
        }
      };
    } catch (error) {
      console.error('获取进度概览失败:', error);
      throw error;
    }
  }
}
```

---

## 6. 共享账号模块 (Shared Accounts)

### 接口列表
| 方法 | 路径 | 描述 | 认证 | 权限 |
|------|------|------|------|------|
| GET | `/shared-accounts` | 获取共享账号列表 | ✅ | User |

### 数据模型
```typescript
// 共享账号信息
interface SharedAccount {
  accountId: string;
  accountName: string;
  owner: {
    username: string;
    email: string;
  };
  isActive: boolean;
  sharedAt: string;
}
```

### 前端使用示例
```javascript
// 共享账号服务类
class SharedAccountService {
  // 获取共享账号列表
  static async getSharedAccounts(page = 1, size = 20, search = '') {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({ page, size });
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_BASE_URL}/shared-accounts?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }
}
```

---

## 7. 通用工具类

### HTTP请求封装
```javascript
// HTTP请求工具类
class ApiClient {
  static baseURL = 'http://localhost:3000/api';
  
  // 获取认证头
  static getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
  
  // GET请求
  static async get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.append(key, value);
      }
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      }
    });
    
    return this.handleResponse(response);
  }
  
  // POST请求
  static async post(endpoint, data = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    
    return this.handleResponse(response);
  }
  
  // PATCH请求
  static async patch(endpoint, data = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    
    return this.handleResponse(response);
  }
  
  // DELETE请求
  static async delete(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      }
    });
    
    return this.handleResponse(response);
  }
  
  // 响应处理
  static async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      // 处理认证错误
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        // 可以触发重新登录事件
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  }
}
```

### 错误处理工具
```javascript
// 错误处理工具类
class ErrorHandler {
  // 错误码映射
  static errorMessages = {
    1001: '请求参数格式错误，请检查输入',
    1002: '必填参数缺失，请补充完整信息',
    1003: '参数值超出有效范围',
    2001: '请先登录后再进行操作',
    2002: '登录已过期，请重新登录',
    2003: '认证信息无效，请重新登录',
    3001: '权限不足，无法执行此操作',
    4001: '请求的资源不存在',
    5001: '数据冲突，请检查是否存在重复信息',
    9001: '服务器内部错误，请稍后重试'
  };
  
  // 处理API错误
  static handleApiError(error, showMessage = true) {
    let message = '操作失败，请稍后重试';
    
    if (error.response && error.response.data) {
      const { code, message: apiMessage } = error.response.data;
      message = this.errorMessages[code] || apiMessage || message;
    } else if (error.message) {
      message = error.message;
    }
    
    if (showMessage) {
      // 这里可以集成你的消息提示组件
      console.error('API Error:', message);
      // 例如: Toast.error(message);
    }
    
    return { message, code: error.response?.data?.code };
  }
  
  // 网络错误处理
  static handleNetworkError(error) {
    console.error('Network Error:', error);
    const message = '网络连接失败，请检查网络设置';
    // Toast.error(message);
    return { message };
  }
}
```

### 数据验证工具
```javascript
// 数据验证工具类
class Validator {
  // 验证用户名
  static validateUsername(username) {
    if (!username || username.length < 3 || username.length > 50) {
      return '用户名长度必须在3-50个字符之间';
    }
    return null;
  }
  
  // 验证邮箱
  static validateEmail(email) {
    if (!email) return null; // 邮箱是可选的
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '请输入有效的邮箱地址';
    }
    return null;
  }
  
  // 验证手机号
  static validatePhone(phone) {
    if (!phone) return null; // 手机号是可选的
    
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return '请输入有效的手机号码';
    }
    return null;
  }
  
  // 验证密码
  static validatePassword(password) {
    if (!password || password.length < 6 || password.length > 100) {
      return '密码长度必须在6-100个字符之间';
    }
    return null;
  }
  
  // 验证账号名称
  static validateAccountName(accountName) {
    if (!accountName || accountName.trim().length === 0) {
      return '账号名称不能为空';
    }
    if (accountName.length > 100) {
      return '账号名称长度不能超过100个字符';
    }
    return null;
  }
  
  // 验证副本名称
  static validateDungeonName(dungeonName) {
    if (!dungeonName || dungeonName.trim().length === 0) {
      return '副本名称不能为空';
    }
    return null;
  }
  
  // 验证BOSS列表
  static validateBosses(bosses) {
    if (!Array.isArray(bosses) || bosses.length === 0) {
      return 'BOSS列表不能为空';
    }
    
    for (const boss of bosses) {
      if (!boss || boss.trim().length === 0) {
        return 'BOSS名称不能为空';
      }
    }
    return null;
  }
  
  // 验证任务名称
  static validateTaskName(taskName) {
    if (!taskName || taskName.trim().length === 0) {
      return '任务名称不能为空';
    }
    return null;
  }
  
  // 验证目标次数
  static validateTargetCount(targetCount) {
    if (!Number.isInteger(targetCount) || targetCount < 1) {
      return '目标次数必须是大于0的整数';
    }
    return null;
  }
}
```

---

## 8. 使用建议

### 8.1 项目结构建议
```
src/
├── services/          # API服务类
│   ├── auth.service.js
│   ├── account.service.js
│   ├── template.service.js
│   ├── progress.service.js
│   └── shared-account.service.js
├── utils/             # 工具类
│   ├── api-client.js
│   ├── error-handler.js
│   └── validator.js
├── types/             # TypeScript类型定义
│   └── api.types.ts
└── constants/         # 常量定义
    └── api.constants.js
```

### 8.2 状态管理建议
```javascript
// 使用Vuex/Redux等状态管理工具
const store = {
  state: {
    user: null,
    accounts: [],
    templates: {
      dungeons: [],
      weeklyTasks: []
    },
    progress: []
  },
  
  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_ACCOUNTS(state, accounts) {
      state.accounts = accounts;
    },
    // ... 其他mutations
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        const result = await AuthService.login(credentials.credential, credentials.password);
        commit('SET_USER', result.data.user);
        return result;
      } catch (error) {
        ErrorHandler.handleApiError(error);
        throw error;
      }
    },
    // ... 其他actions
  }
};
```

### 8.3 错误处理建议
```javascript
// 全局错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  ErrorHandler.handleNetworkError(event.reason);
});

// API调用示例
const handleApiCall = async (apiFunction, ...args) => {
  try {
    const result = await apiFunction(...args);
    return result;
  } catch (error) {
    ErrorHandler.handleApiError(error);
    throw error;
  }
};
```

---

## 9. 快速开始示例

### 完整的登录流程
```javascript
// 登录组件示例
class LoginComponent {
  async handleLogin(formData) {
    try {
      // 1. 验证表单数据
      const usernameError = Validator.validateUsername(formData.credential);
      const passwordError = Validator.validatePassword(formData.password);
      
      if (usernameError || passwordError) {
        this.showErrors({ username: usernameError, password: passwordError });
        return;
      }
      
      // 2. 调用登录API
      const result = await AuthService.login(formData.credential, formData.password);
      
      // 3. 处理登录成功
      if (result.code === 200) {
        this.showMessage('登录成功');
        this.redirectToHome();
      }
    } catch (error) {
      // 4. 处理登录失败
      ErrorHandler.handleApiError(error);
    }
  }
}
```

### 账号管理页面
```javascript
// 账号管理组件示例
class AccountManagementComponent {
  constructor() {
    this.accounts = [];
    this.loading = false;
    this.pagination = { page: 1, size: 20, total: 0 };
  }
  
  async loadAccounts(search = '') {
    try {
      this.loading = true;
      const result = await AccountService.getAccounts(
        this.pagination.page,
        this.pagination.size,
        search
      );
      
      this.accounts = result.items;
      this.pagination.total = result.total;
    } catch (error) {
      ErrorHandler.handleApiError(error);
    } finally {
      this.loading = false;
    }
  }
  
  async createAccount(accountData) {
    try {
      const nameError = Validator.validateAccountName(accountData.accountName);
      if (nameError) {
        this.showError(nameError);
        return;
      }
      
      await AccountService.createAccount(accountData.accountName, accountData.isActive);
      this.showMessage('账号创建成功');
      this.loadAccounts(); // 重新加载列表
    } catch (error) {
      ErrorHandler.handleApiError(error);
    }
  }
}
```

这个模块化的API文档为Electron前端开发提供了完整的接口参考和使用示例，可以直接复制使用相关的服务类和工具函数。

---

**文档版本：** v1.1.0  
**最后更新：** 2025-11-04  
**维护者：** 开发团队  
**适用于：** Electron 前端开发

如有疑问或建议，请联系开发团队。