/**
 * 诛仙世界多账号管理系统 - TypeScript 类型定义
 * 
 * 本文件包含了系统中所有API接口的TypeScript类型定义
 * 包括实体类型、DTO类型、响应类型等
 */

// ================================
// 基础实体类型
// ================================

/**
 * 用户实体
 */
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

/**
 * 用户响应DTO（不包含密码）
 */
export interface UserResponseDto {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 账号实体
 */
export interface Account {
  accountId: string;
  userId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  weeklyProgresses?: WeeklyProgress[];
}

/**
 * 账号与用户信息DTO
 */
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

/**
 * 副本模板实体
 */
export interface DungeonTemplate {
  templateId: string;
  dungeonName: string;
  bosses: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 周常任务模板实体
 */
export interface WeeklyTaskTemplate {
  templateId: string;
  taskName: string;
  targetCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 副本进度数据结构
 * key 格式：templateId_bossIndex
 * value: 是否已击杀
 */
export interface DungeonProgressData {
  [key: string]: boolean;
}

/**
 * 周常任务进度数据结构
 * key: templateId
 * value: 已完成次数
 */
export interface WeeklyTaskProgressData {
  [templateId: string]: number;
}

/**
 * 周进度实体
 */
export interface WeeklyProgress {
  progressId: string;
  accountId: string;
  weekStart: Date;
  dungeonProgress: DungeonProgressData;
  weeklyTaskProgress: WeeklyTaskProgressData;
  lastUpdated: Date;
  account?: Account;
}

// ================================
// 请求 DTO 类型
// ================================

/**
 * 用户注册DTO
 */
export interface RegisterDto {
  username: string;
  email?: string;
  phone?: string;
  password: string;
}

/**
 * 用户登录DTO
 */
export interface LoginDto {
  credential: string; // 用户名、邮箱或手机号
  password: string;
}

/**
 * 分页查询基础DTO
 */
export interface PaginationDto {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * 用户列表查询DTO
 */
export interface UserListDto extends PaginationDto {
  role?: 'admin' | 'user';
}

/**
 * 账号列表查询DTO
 */
export interface AccountListDto extends PaginationDto {
  isActive?: boolean;
}

/**
 * 创建账号DTO
 */
export interface CreateAccountDto {
  accountName: string;
  isActive?: boolean;
}

/**
 * 更新账号DTO
 */
export interface UpdateAccountDto {
  accountName?: string;
  isActive?: boolean;
}

/**
 * 批量更新账号状态DTO
 */
export interface BatchUpdateAccountStatusDto {
  accountIds: string[];
  isActive: boolean;
}

/**
 * 创建副本模板DTO
 */
export interface CreateDungeonTemplateDto {
  dungeonName: string;
  bosses: string[];
}

/**
 * 更新副本模板DTO
 */
export interface UpdateDungeonTemplateDto {
  dungeonName?: string;
  bosses?: string[];
}

/**
 * 创建周常任务模板DTO
 */
export interface CreateWeeklyTaskTemplateDto {
  taskName: string;
  targetCount: number;
}

/**
 * 更新周常任务模板DTO
 */
export interface UpdateWeeklyTaskTemplateDto {
  taskName?: string;
  targetCount?: number;
}

/**
 * 更新副本进度DTO
 */
export interface UpdateDungeonProgressDto {
  accountId: string;
  dungeonName: string;
  bossName: string;
  killCount: number;
}

/**
 * 更新周常任务进度DTO
 */
export interface UpdateWeeklyTaskProgressDto {
  accountId: string;
  taskName: string;
  completedCount: number;
}

// ================================
// 响应类型
// ================================

/**
 * 通用API响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 分页响应数据结构
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 分页API响应格式
 */
export interface ApiPaginatedResponse<T> extends ApiResponse {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  access_token: string;
  user: UserResponseDto;
}

/**
 * 账号统计响应
 */
export interface AccountStatsResponse {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
}

/**
 * 模板统计响应
 */
export interface TemplateStatsResponse {
  dungeonTemplatesCount: number;
  weeklyTaskTemplatesCount: number;
}

/**
 * 进度统计响应
 */
export interface ProgressStatsResponse {
  totalAccounts: number;
  accountsWithProgress: number;
  completionRate: number;
}

/**
 * 调度器信息响应
 */
export interface SchedulerInfoResponse {
  status: string;
  nextWeeklyReset: string;
  lastWeeklyReset: string;
  uptime: string;
}

/**
 * 周进度重置响应
 */
export interface WeeklyResetResponse {
  resetTime: string;
  affectedAccounts: number;
}

// ================================
// 错误类型
// ================================

/**
 * 基础API错误
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * 验证错误（400）
 */
export interface ValidationError extends ApiError {
  statusCode: 400;
  message: string[];
  error: 'Bad Request';
}

/**
 * 未授权错误（401）
 */
export interface UnauthorizedError extends ApiError {
  statusCode: 401;
  message: string;
  error: 'Unauthorized';
}

/**
 * 权限不足错误（403）
 */
export interface ForbiddenError extends ApiError {
  statusCode: 403;
  message: string;
  error: 'Forbidden';
}

/**
 * 资源不存在错误（404）
 */
export interface NotFoundError extends ApiError {
  statusCode: 404;
  message: string;
  error: 'Not Found';
}

/**
 * 资源冲突错误（409）
 */
export interface ConflictError extends ApiError {
  statusCode: 409;
  message: string;
  error: 'Conflict';
}

/**
 * 服务器内部错误（500）
 */
export interface InternalServerError extends ApiError {
  statusCode: 500;
  message: string;
  error: 'Internal Server Error';
}

// ================================
// 工具类型
// ================================

/**
 * 用户角色枚举
 */
export type UserRole = 'admin' | 'user';

/**
 * HTTP 状态码
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * API 端点路径
 */
export enum ApiEndpoints {
  // 认证相关
  AUTH_REGISTER = '/auth/register',
  AUTH_LOGIN = '/auth/login',
  AUTH_PROFILE = '/auth/profile',
  AUTH_LOGOUT = '/auth/logout',
  AUTH_ADMIN_USERS = '/auth/admin/users',

  // 账号管理
  ACCOUNTS = '/accounts',
  ACCOUNTS_ADMIN_ALL = '/accounts/admin/all',
  ACCOUNTS_STATS = '/accounts/stats',
  ACCOUNTS_BATCH_STATUS = '/accounts/batch-status',

  // 模板管理
  TEMPLATES_DUNGEONS = '/templates/dungeons',
  TEMPLATES_WEEKLY_TASKS = '/templates/weekly-tasks',
  TEMPLATES_STATS = '/templates/stats',

  // 进度跟踪
  PROGRESS_CURRENT_WEEK = '/progress/current-week',
  PROGRESS_DUNGEON = '/progress/dungeon',
  PROGRESS_WEEKLY_TASK = '/progress/weekly-task',
  PROGRESS_STATS = '/progress/stats',
  PROGRESS_HISTORY = '/progress/history',
  PROGRESS_ADMIN_RESET = '/progress/admin/reset-weekly',

  // 定时任务
  SCHEDULER_INFO = '/scheduler/info',
  SCHEDULER_TRIGGER_RESET = '/scheduler/trigger-weekly-reset',
}

/**
 * 查询参数类型
 */
export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * 路径参数类型
 */
export interface PathParams {
  [key: string]: string;
}

// ================================
// 类型守卫函数
// ================================

/**
 * 检查是否为API错误
 */
export function isApiError(error: any): error is ApiError {
  return error && typeof error.statusCode === 'number' && typeof error.message === 'string' && typeof error.error === 'string';
}

/**
 * 检查是否为验证错误
 */
export function isValidationError(error: any): error is ValidationError {
  return isApiError(error) && error.statusCode === 400 && Array.isArray(error.message);
}

/**
 * 检查是否为未授权错误
 */
export function isUnauthorizedError(error: any): error is UnauthorizedError {
  return isApiError(error) && error.statusCode === 401;
}

/**
 * 检查是否为权限不足错误
 */
export function isForbiddenError(error: any): error is ForbiddenError {
  return isApiError(error) && error.statusCode === 403;
}

/**
 * 检查是否为资源不存在错误
 */
export function isNotFoundError(error: any): error is NotFoundError {
  return isApiError(error) && error.statusCode === 404;
}

/**
 * 检查是否为资源冲突错误
 */
export function isConflictError(error: any): error is ConflictError {
  return isApiError(error) && error.statusCode === 409;
}

// ================================
// 注意：所有类型都已经在声明时使用 export 关键字导出
// 枚举类型 HttpStatusCode 和 ApiEndpoints 也已经在声明时导出
// 类型守卫函数也已经在声明时导出
// 因此不需要额外的导出语句
// ================================