#!/usr/bin/env node

/**
 * Docker 健康检查脚本
 * 用于检查 NestJS 应用的健康状态
 */

const http = require('http');

// 健康检查配置
const HEALTH_CHECK_URL = 'http://localhost:3000/health';
const TIMEOUT = 5000; // 5秒超时

/**
 * 执行健康检查
 */
function performHealthCheck() {
  const url = new URL(HEALTH_CHECK_URL);
  
  const options = {
    hostname: url.hostname,
    port: url.port || 3000,
    path: url.pathname,
    method: 'GET',
    timeout: TIMEOUT,
    headers: {
      'User-Agent': 'Docker-HealthCheck/1.0'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    // 收集响应数据
    res.on('data', (chunk) => {
      data += chunk;
    });

    // 响应结束
    res.on('end', () => {
      try {
        // 检查HTTP状态码
        if (res.statusCode !== 200) {
          console.error(`健康检查失败: HTTP ${res.statusCode}`);
          process.exit(1);
        }

        // 尝试解析JSON响应
        const healthData = JSON.parse(data);
        
        // 检查状态字段
        if (healthData.status === 'ok') {
          console.log('健康检查通过:', {
            status: healthData.status,
            timestamp: healthData.timestamp,
            uptime: healthData.uptime,
            environment: healthData.environment
          });
          process.exit(0);
        } else {
          console.error('健康检查失败: 状态不正常', healthData);
          process.exit(1);
        }
      } catch (error) {
        console.error('健康检查失败: 无法解析响应', error.message);
        console.error('响应内容:', data);
        process.exit(1);
      }
    });
  });

  // 处理请求错误
  req.on('error', (error) => {
    console.error('健康检查失败: 请求错误', error.message);
    process.exit(1);
  });

  // 处理超时
  req.on('timeout', () => {
    console.error('健康检查失败: 请求超时');
    req.destroy();
    process.exit(1);
  });

  // 发送请求
  req.end();
}

// 执行健康检查
console.log('开始执行 Docker 健康检查...');
performHealthCheck();