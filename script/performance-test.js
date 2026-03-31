// performance-test.js
// 系统性能测试脚本，适用于前后端接口及联调场景
const autocannon = require('autocannon');
const puppeteer = require('puppeteer');

async function testBackendAPI() {
  const targets = [
    // 用户相关
    { url: 'http://localhost:3000/api/users/login', method: 'POST', body: JSON.stringify({ username: 'test', password: 'test' }) },
    { url: 'http://localhost:3000/api/users/register', method: 'POST', body: JSON.stringify({ username: 'test2', password: 'test2', email: 'test2@example.com' }) },
    { url: 'http://localhost:3000/api/users/email/send-code', method: 'POST', body: JSON.stringify({ email: 'test@example.com' }) },
    { url: 'http://localhost:3000/api/users/password/send-reset-code', method: 'POST', body: JSON.stringify({ email: 'test@example.com' }) },
    { url: 'http://localhost:3000/api/users/password/reset-by-email', method: 'POST', body: JSON.stringify({ email: 'test@example.com', code: '123456', newPassword: 'newpass' }) },
    { url: 'http://localhost:3000/api/users/me', method: 'GET' },
    { url: 'http://localhost:3000/api/users/me/profile', method: 'PUT', body: JSON.stringify({ nickname: '新昵称' }) },
    { url: 'http://localhost:3000/api/users/admins', method: 'GET' },
    { url: 'http://localhost:3000/api/users/teachers', method: 'GET' },
    { url: 'http://localhost:3000/api/users/students', method: 'GET' },
    { url: 'http://localhost:3000/api/users/classes', method: 'GET' },
    { url: 'http://localhost:3000/api/users/messages', method: 'GET' },
    // 内容相关
    { url: 'http://localhost:3000/api/content/catalog', method: 'GET' },
    { url: 'http://localhost:3000/api/content/sections/1', method: 'GET' },
    // 数据结构相关
    { url: 'http://localhost:3000/api/data-structures/', method: 'GET' },
    { url: 'http://localhost:3000/api/data-structures/1', method: 'GET' },
    { url: 'http://localhost:3000/api/data-structures/1/operations', method: 'GET' },
    { url: 'http://localhost:3000/api/data-structures/1/concepts', method: 'GET' },
    { url: 'http://localhost:3000/api/data-structures/1/modules/基础', method: 'GET' },
    { url: 'http://localhost:3000/api/data-structures/', method: 'POST', body: JSON.stringify({ name: '新结构' }) },
    { url: 'http://localhost:3000/api/data-structures/1', method: 'PUT', body: JSON.stringify({ name: '修改结构' }) },
    { url: 'http://localhost:3000/api/data-structures/1', method: 'DELETE' },
    // 章节内容
    { url: 'http://localhost:3000/api/section-content/1/modules/基础', method: 'GET' },
    { url: 'http://localhost:3000/api/section-content/1/modules', method: 'GET' },
    // OJ 相关
    { url: 'http://localhost:3000/api/oj/problem/1', method: 'GET' },
    { url: 'http://localhost:3000/api/oj/problem/1/class/1', method: 'PUT', body: JSON.stringify({ title: '新题目' }) },
    { url: 'http://localhost:3000/api/oj/problem/1/class/1', method: 'DELETE' },
    { url: 'http://localhost:3000/api/oj/submit/1', method: 'POST', body: JSON.stringify({ code: 'print(1)' }) },
    { url: 'http://localhost:3000/api/oj/submissions/1', method: 'GET' },
    // 测验相关
    { url: 'http://localhost:3000/api/quizzes/', method: 'GET' },
    { url: 'http://localhost:3000/api/quizzes/template', method: 'GET' },
    { url: 'http://localhost:3000/api/quizzes/problem/1', method: 'GET' },
    { url: 'http://localhost:3000/api/quizzes/problem/1/class/1', method: 'PUT', body: JSON.stringify({ title: '新测验题目' }) },
    { url: 'http://localhost:3000/api/quizzes/generate/1', method: 'POST', body: JSON.stringify({ prompt: '生成题目' }) },
    { url: 'http://localhost:3000/api/quizzes/generate-online/1', method: 'POST', body: JSON.stringify({ prompt: '在线生成题目' }) },
    { url: 'http://localhost:3000/api/quizzes/submission/1', method: 'POST', body: JSON.stringify({ answer: '答案' }) },
    // 代码执行
    { url: 'http://localhost:3000/api/code-execution/execute', method: 'POST', body: JSON.stringify({ code: 'print(1)' }) },
    { url: 'http://localhost:3000/api/code-execution/template/1', method: 'GET' },
    // 学习进度
    { url: 'http://localhost:3000/api/progress/', method: 'GET' },
  ];
  for (const target of targets) {
    console.log(`\n接口压力测试: ${target.url}`);
    await autocannon({
      url: target.url,
      method: target.method,
      connections: 20, // 并发数
      duration: 10,    // 测试时长（秒）
      headers: { 'content-type': 'application/json' },
      body: target.body,
    });
  }
}

async function testFrontendPages() {
  const pages = [
    'http://localhost:5178/', // 首页
    'http://localhost:5178/catalog',
    'http://localhost:5178/auth',
    'http://localhost:5178/structure/strings/section/string-basics',
    'http://localhost:5178/structure/arrays/section/basic-concepts',
    'http://localhost:5178/structure/objects/section/complexity-analysis',
    'http://localhost:5178/structure/sort/section/insertion-sort',
    'http://localhost:5178/structure/sorting/section/bubble-sort',
    'http://localhost:5178/structure/searching/section/binary-search',
    'http://localhost:5178/structure/linear-structures/section/arrays',
    'http://localhost:5178/structure/linear-structures/section/linked-lists',
    'http://localhost:5178/structure/linear-structures/section/stacks',
    'http://localhost:5178/structure/linear-structures/section/queues',
    'http://localhost:5178/structure/trees/section/binary-tree-basics',
    'http://localhost:5178/structure/trees/section/huffman-trees',
    'http://localhost:5178/structure/graphs/section/graph-basics',
    'http://localhost:5178/structure/graphs/section/dijkstra-algorithm',

    // 下略
  ];
  const browser = await puppeteer.launch();
  for (const pageUrl of pages) {
    const page = await browser.newPage();
    const start = Date.now();
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    const duration = Date.now() - start;
    console.log(`页面加载性能: ${pageUrl} 加载耗时: ${duration}ms`);
    await page.close();
  }
  await browser.close();
}

async function main() {
  console.log('=== 后端接口压力测试 ===');
  await testBackendAPI();
  console.log('\n=== 前端页面加载性能测试 ===');
  await testFrontendPages();
  console.log('\n性能测试完成');
}

main().catch(err => {
  console.error('性能测试异常:', err);
  process.exit(1);
});
