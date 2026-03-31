#!/usr/bin/env node
/**
 * 系统RESTful接口健壮性测试脚本
 * 包含参数合法性、权限校验、异常处理、邮箱服务依赖模拟等
 */
const axios = require('axios');
const assert = require('assert');
const fs = require('fs');
// 配置区
const BASE_URL = 'http://localhost:3001'; // 根据实际后端服务端口调整为3001
//  email/userId 为数据库中真实存在的用户
const EXISTING_USER_EMAIL = 'teacher_20260306114935@dslp.local';
const EXISTING_USER_ID = '2026000';
const EXISTING_USER_PASSWORD = '123456'; // 如需自动登录
const ADMIN_JWT = process.env.ADMIN_JWT || '';

// 邮箱服务模拟配置（如需支持异常/关闭场景，需后端配合实现模拟接口）
const mailServiceStates = [
  { desc: '正常', config: { enabled: true }, expectSendCode: 200, expectResetCode: 200 },
  { desc: '关闭', config: { enabled: false }, expectSendCode: 503, expectResetCode: 503 },
  { desc: '异常', config: { enabled: true, Error: true }, expectSendCode: 500, expectResetCode: 500 },
];

// 需测试的接口列表（可自动遍历，示例部分接口）
const endpoints = [
  { method: 'post', url: '/api/users/register', data: { email: '', password: '' }, expectStatus: 400, desc: '注册-空参数' },
  { method: 'post', url: '/api/users/register', data: { email: 'invalid', password: '123' }, expectStatus: 400, desc: '注册-非法邮箱' },
  { method: 'get', url: '/api/users/me', headers: {}, expectStatus: 401, desc: '用户信息-未登录' },
  { method: 'get', url: '/api/unknown', expectStatus: 404, desc: '未知接口-404' },
  // SQL/NoSQL注入测试
  { method: 'post', url: '/api/users/login', data: { userId: { "$gt": "" }, password: '123' }, expectStatus: 400, desc: '登录-SQL注入尝试' },
  { method: 'post', url: '/api/users/login', data: { userId: '2026000', password: { "$ne": "" } }, expectStatus: 400, desc: '登录-NoSQL注入尝试' },
  // 越权访问测试
  { method: 'get', url: '/api/users', headers: {}, expectStatus: 401, desc: '用户列表-未授权访问' },
];

// 工具函数
async function testEndpoint({ method, url, data, headers, expectStatus, expectBody, desc }) {
  let res;
  try {
    res = await axios({ method, url: BASE_URL + url, data, headers, validateStatus: () => true });
  } catch (e) {
    console.error(`❌ ${desc} 请求异常:`, e.message);
    return;
  }
  let ok = true;
  try {
    assert.strictEqual(res.status, expectStatus, `${desc}：期望状态码${expectStatus}，实际${res.status}`);
    if (expectBody) {
      assert.deepStrictEqual(res.data, expectBody, `${desc}：响应体不符`);
    }
  } catch (e) {
    ok = false;
    console.error(`❌ ${desc} 失败:`, e.message);
  }
  if (!ok) {
    console.error(`  ↳ 响应内容:`, res && res.data);
  } else {
    console.log(`✅ ${desc}`);
  }
}

async function run() {
  // 1. 接口遍历与健壮性测试
  for (const ep of endpoints) {
    await testEndpoint(ep);
  }

  // 2. 邮箱服务相关接口健壮性测试（需后端支持模拟接口）
  for (const state of mailServiceStates) {
    // 邮箱服务状态模拟接口（如有）
    try {
      await axios.post(BASE_URL + '/api/admin/mail-service-mock', state.config);
    } catch {}
    await testEndpoint({
      method: 'post',
      url: '/api/users/email/send-code',
      data: { email: EXISTING_USER_EMAIL, purpose: 'signup' },
      expectStatus: state.expectSendCode,
      desc: `发送验证码-邮箱服务${state.desc}`,
    });
    await testEndpoint({
      method: 'post',
      url: '/api/users/password/send-reset-code',
      data: { email: EXISTING_USER_EMAIL, userId: EXISTING_USER_ID },
      expectStatus: state.expectResetCode,
      desc: `密码找回-邮箱服务${state.desc}`,
    });
  }

  // 3. JWT鉴权机制测试
  let jwt = '';
  try {
    const loginRes = await axios.post(BASE_URL + '/api/users/login', { userId: EXISTING_USER_ID, password: EXISTING_USER_PASSWORD });
    if (loginRes.data && loginRes.data.data && loginRes.data.data.token) {
      jwt = loginRes.data.data.token;
      console.log('✅ 登录获取JWT成功');
    } else {
      console.error('❌ 登录未获取到JWT');
    }
  } catch (e) {
    console.error('❌ 登录接口异常:', e.message);
  }
  if (jwt) {
    // 合法JWT访问
    await testEndpoint({
      method: 'get',
      url: '/api/users/me',
      headers: { Authorization: 'Bearer ' + jwt },
      expectStatus: 200,
      desc: '用户信息接口-合法JWT',
    });
    // 越权访问（如有管理员接口可测）
    if (ADMIN_JWT) {
      await testEndpoint({
        method: 'get',
        url: '/api/admin/secure-data',
        headers: { Authorization: 'Bearer ' + jwt },
        expectStatus: 403,
        desc: '普通用户访问管理员接口-应拒绝',
      });
    }
  }

  // 4. 敏感配置环境隔离检测（仅提示，实际应人工或CI脚本检测 .env/.env.prod 等文件权限与内容）
  if (fs.existsSync('../.env')) {
    console.warn('⚠️ 检测到 .env 文件，请确保敏感信息未泄露且生产环境隔离！');
  }
  if (fs.existsSync('../.env.prod')) {
    console.warn('⚠️ 检测到 .env.prod 文件，请确保敏感信息未泄露且生产环境隔离！');
  }
  // 5. 其他安全性检测可扩展集成如 npm audit、第三方漏洞扫描等
}

run();
