#!/bin/bash

# 诛仙世界多账号管理系统 API 测试脚本

set -e

# 配置
BASE_URL="http://localhost:3000/api"
HEALTH_URL="http://localhost:3000/health"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 全局变量
AUTH_TOKEN=""
USER_ID=""
ACCOUNT_ID=""
DUNGEON_TEMPLATE_ID=""
WEEKLY_TASK_TEMPLATE_ID=""

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 测试函数
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    local headers=$6

    ((TOTAL_TESTS++))
    
    log_info "测试: $description"
    
    local curl_cmd="curl -s -w '%{http_code}' -X $method"
    
    if [ ! -z "$headers" ]; then
        curl_cmd="$curl_cmd -H '$headers'"
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd $BASE_URL$endpoint"
    
    local response=$(eval $curl_cmd)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        log_success "$description - 状态码: $status_code"
        echo "$body"
        return 0
    else
        log_error "$description - 期望状态码: $expected_status, 实际状态码: $status_code"
        echo "响应内容: $body"
        return 1
    fi
}

# 健康检查
test_health_check() {
    log_info "=== 健康检查测试 ==="
    
    local response=$(curl -s -w '%{http_code}' $HEALTH_URL)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    ((TOTAL_TESTS++))
    
    if [ "$status_code" = "200" ]; then
        log_success "健康检查 - 状态码: $status_code"
        echo "响应内容: $body"
    else
        log_error "健康检查失败 - 状态码: $status_code"
        echo "响应内容: $body"
        exit 1
    fi
}

# 用户认证测试
test_authentication() {
    log_info "=== 用户认证测试 ==="
    
    # 用户注册
    local register_data='{
        "username": "testuser_'$(date +%s)'",
        "email": "test_'$(date +%s)'@example.com",
        "password": "password123"
    }'
    
    local response=$(test_api "POST" "/auth/register" "$register_data" "201" "用户注册")
    
    if [ $? -eq 0 ]; then
        AUTH_TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        USER_ID=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log_info "获取到认证令牌: ${AUTH_TOKEN:0:20}..."
        log_info "用户ID: $USER_ID"
    else
        log_error "用户注册失败，无法继续测试"
        exit 1
    fi
    
    # 用户登录
    local login_data='{
        "username": "'$(echo "$register_data" | grep -o '"username":"[^"]*' | cut -d'"' -f4)'",
        "password": "password123"
    }'
    
    test_api "POST" "/auth/login" "$login_data" "200" "用户登录"
    
    # 错误密码登录
    local wrong_login_data='{
        "username": "'$(echo "$register_data" | grep -o '"username":"[^"]*' | cut -d'"' -f4)'",
        "password": "wrongpassword"
    }'
    
    test_api "POST" "/auth/login" "$wrong_login_data" "401" "错误密码登录（应该失败）"
}

# 账号管理测试
test_account_management() {
    log_info "=== 账号管理测试 ==="
    
    if [ -z "$AUTH_TOKEN" ]; then
        log_error "缺少认证令牌，跳过账号管理测试"
        return
    fi
    
    local auth_header="Authorization: Bearer $AUTH_TOKEN"
    
    # 创建账号
    local account_data='{
        "accountName": "测试账号1",
        "isActive": true
    }'
    
    local response=$(test_api "POST" "/accounts" "$account_data" "201" "创建账号" "$auth_header")
    
    if [ $? -eq 0 ]; then
        ACCOUNT_ID=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log_info "账号ID: $ACCOUNT_ID"
    fi
    
    # 获取账号列表
    test_api "GET" "/accounts" "" "200" "获取账号列表" "$auth_header"
    
    # 获取单个账号
    if [ ! -z "$ACCOUNT_ID" ]; then
        test_api "GET" "/accounts/$ACCOUNT_ID" "" "200" "获取单个账号" "$auth_header"
        
        # 更新账号
        local update_data='{
            "accountName": "更新后的账号名",
            "isActive": false
        }'
        
        test_api "PUT" "/accounts/$ACCOUNT_ID" "$update_data" "200" "更新账号" "$auth_header"
        
        # 重新启用账号（用于后续测试）
        local enable_data='{"isActive": true}'
        test_api "PUT" "/accounts/$ACCOUNT_ID" "$enable_data" "200" "重新启用账号" "$auth_header"
    fi
    
    # 未认证访问（应该失败）
    test_api "GET" "/accounts" "" "401" "未认证访问（应该失败）"
}

# 模板管理测试
test_template_management() {
    log_info "=== 模板管理测试 ==="
    
    if [ -z "$AUTH_TOKEN" ]; then
        log_error "缺少认证令牌，跳过模板管理测试"
        return
    fi
    
    local auth_header="Authorization: Bearer $AUTH_TOKEN"
    
    # 创建副本模板
    local dungeon_data='{
        "name": "测试副本",
        "description": "测试副本描述",
        "bossCount": 3,
        "difficulty": "普通"
    }'
    
    local response=$(test_api "POST" "/templates/dungeons" "$dungeon_data" "201" "创建副本模板" "$auth_header")
    
    if [ $? -eq 0 ]; then
        DUNGEON_TEMPLATE_ID=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log_info "副本模板ID: $DUNGEON_TEMPLATE_ID"
    fi
    
    # 获取副本模板列表
    test_api "GET" "/templates/dungeons" "" "200" "获取副本模板列表" "$auth_header"
    
    # 创建周常任务模板
    local weekly_task_data='{
        "name": "测试周常任务",
        "description": "测试周常任务描述",
        "maxCount": 10,
        "category": "日常"
    }'
    
    local response=$(test_api "POST" "/templates/weekly-tasks" "$weekly_task_data" "201" "创建周常任务模板" "$auth_header")
    
    if [ $? -eq 0 ]; then
        WEEKLY_TASK_TEMPLATE_ID=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log_info "周常任务模板ID: $WEEKLY_TASK_TEMPLATE_ID"
    fi
    
    # 获取周常任务模板列表
    test_api "GET" "/templates/weekly-tasks" "" "200" "获取周常任务模板列表" "$auth_header"
}

# 进度跟踪测试
test_progress_tracking() {
    log_info "=== 进度跟踪测试 ==="
    
    if [ -z "$AUTH_TOKEN" ] || [ -z "$ACCOUNT_ID" ]; then
        log_error "缺少认证令牌或账号ID，跳过进度跟踪测试"
        return
    fi
    
    local auth_header="Authorization: Bearer $AUTH_TOKEN"
    
    # 获取当前周进度
    test_api "GET" "/progress/current-week" "" "200" "获取当前周进度" "$auth_header"
    
    # 获取指定账号进度
    test_api "GET" "/progress/current-week/$ACCOUNT_ID" "" "200" "获取指定账号进度" "$auth_header"
    
    # 更新副本进度
    local dungeon_progress='{
        "accountId": "'$ACCOUNT_ID'",
        "templateId": "template1",
        "bossIndex": 0,
        "killCount": 1
    }'
    
    test_api "POST" "/progress/dungeon" "$dungeon_progress" "200" "更新副本进度" "$auth_header"
    
    # 更新周常任务进度
    local task_progress='{
        "accountId": "'$ACCOUNT_ID'",
        "taskName": "每日任务",
        "completedCount": 5
    }'
    
    test_api "POST" "/progress/weekly-task" "$task_progress" "200" "更新周常任务进度" "$auth_header"
    
    # 获取进度统计
    test_api "GET" "/progress/statistics" "" "200" "获取进度统计" "$auth_header"
    
    # 获取历史进度
    test_api "GET" "/progress/history" "" "200" "获取历史进度" "$auth_header"
}

# 定时任务测试
test_scheduler() {
    log_info "=== 定时任务测试 ==="
    
    if [ -z "$AUTH_TOKEN" ]; then
        log_error "缺少认证令牌，跳过定时任务测试"
        return
    fi
    
    local auth_header="Authorization: Bearer $AUTH_TOKEN"
    
    # 获取调度器信息
    test_api "GET" "/scheduler/info" "" "200" "获取调度器信息" "$auth_header"
    
    # 手动重置周进度
    test_api "POST" "/scheduler/reset-weekly-progress" "" "200" "手动重置周进度" "$auth_header"
}

# 清理测试数据
cleanup_test_data() {
    log_info "=== 清理测试数据 ==="
    
    if [ -z "$AUTH_TOKEN" ]; then
        log_warning "缺少认证令牌，无法清理测试数据"
        return
    fi
    
    local auth_header="Authorization: Bearer $AUTH_TOKEN"
    
    # 删除测试账号
    if [ ! -z "$ACCOUNT_ID" ]; then
        test_api "DELETE" "/accounts/$ACCOUNT_ID" "" "200" "删除测试账号" "$auth_header"
    fi
    
    # 删除测试模板
    if [ ! -z "$DUNGEON_TEMPLATE_ID" ]; then
        test_api "DELETE" "/templates/dungeons/$DUNGEON_TEMPLATE_ID" "" "200" "删除副本模板" "$auth_header"
    fi
    
    if [ ! -z "$WEEKLY_TASK_TEMPLATE_ID" ]; then
        test_api "DELETE" "/templates/weekly-tasks/$WEEKLY_TASK_TEMPLATE_ID" "" "200" "删除周常任务模板" "$auth_header"
    fi
}

# 显示测试结果
show_test_results() {
    echo ""
    echo "=================================="
    echo "           测试结果汇总"
    echo "=================================="
    echo -e "总测试数: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "通过测试: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "失败测试: ${RED}$FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！${NC}"
        exit 0
    else
        echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败${NC}"
        exit 1
    fi
}

# 主函数
main() {
    echo "🚀 开始 API 测试..."
    echo "测试目标: $BASE_URL"
    echo ""
    
    # 检查服务是否运行
    if ! curl -s $HEALTH_URL > /dev/null; then
        log_error "服务未运行，请先启动应用服务器"
        echo "启动命令: pnpm run start:dev"
        exit 1
    fi
    
    # 执行测试
    test_health_check
    test_authentication
    test_account_management
    test_template_management
    test_progress_tracking
    test_scheduler
    
    # 清理测试数据（可选）
    if [ "$1" != "--no-cleanup" ]; then
        cleanup_test_data
    fi
    
    # 显示结果
    show_test_results
}

# 脚本入口
main "$@"