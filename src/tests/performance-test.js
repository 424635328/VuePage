/* global __ENV */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

// --- ⚙️ 1. 配置 (保持不变) ---
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://pvmoluwsmiemrgvdrtyz.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD;
const PUBLIC_PRODUCT_ID = __ENV.PUBLIC_PRODUCT_ID;

// --- 📈 2. 自定义性能指标 (保持不变) ---
const metrics = {
  public_product_view_duration: new Trend('duration_public_product_view', true),
  dashboard_load_duration: new Trend('duration_dashboard_load', true),
  product_creation_duration: new Trend('duration_product_creation', true),
  product_deletion_duration: new Trend('duration_product_deletion', true),
};

// --- 📊 3. ✨更新的测试选项与场景定义 (极限探索版)✨ ---
export const options = {
  // 适当放宽阈值，主要关注失败率
  thresholds: {
    // 我们的主要目标是找到失败率开始飙升的点，所以把失败率阈值设为5%
    'http_req_failed': ['rate<0.05'],
    // 其他阈值可以暂时放宽或注释掉，以免测试过早中断
    'http_req_duration': ['p(95)<5000'], // 比如放宽到5秒
  },
  scenarios: {
    // 场景1: 极限探索公共 API
    anonymous_browsing_ramping: {
      executor: 'ramping-arrival-rate',
      startRate: 30,    // 从 30 QPS 开始
      timeUnit: '1s',
      preAllocatedVUs: 50, // 初始VU池
      maxVUs: 300,        // 为高QPS准备更大的VU池
      stages: [
        // 在2分钟内，将请求速率从 30 QPS 线性增加到 200 QPS
        { duration: '2m', target: 200 },
        // 维持 200 QPS 压力 30 秒，观察系统是否稳定
        { duration: '30s', target: 200 },
      ],
      exec: 'browsePublicProduct',
    },

    // 场景2: 极限探索数据库读取
    authenticated_dashboard_ramping: {
      executor: 'ramping-arrival-rate',
      startRate: 5,     // 从 5 QPS 开始
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      stages: [
        // 在1分30秒内，将请求速率从 5 QPS 线性增加到 20 QPS
        { duration: '1m30s', target: 20 },
        // 维持 20 QPS 压力 30 秒
        { duration: '30s', target: 20 },
      ],
      exec: 'viewDashboard',
      startTime: '10s', // 稍后启动
    },

    // 场景3: 保持数据库写入的背景压力
    authenticated_write_constant: {
      executor: 'constant-arrival-rate',
      rate: 2, // 保持每秒 2 次写入操作的恒定压力
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 5,
      maxVUs: 10,
      exec: 'createAndDeleteProduct',
      startTime: '20s', // 最后启动
    },
  },
};

// --- 🛠️ 4. setup 函数 (保持不变) ---
export function setup() {
  if (!SUPABASE_ANON_KEY || !TEST_USER_EMAIL || !TEST_USER_PASSWORD || !PUBLIC_PRODUCT_ID) {
    throw new Error('请通过命令行 -e 标志提供所有必需的环境变量');
  }
  const loginUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const loginPayload = JSON.stringify({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
  const params = { headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' } };
  const res = http.post(loginUrl, loginPayload, params);
  check(res, { 'setup: 登录成功': (r) => r.status === 200 });
  const authToken = res.json('access_token');
  if (!authToken) throw new Error('无法登录测试用户，请检查凭证。');
  return { authToken: authToken };
}

// --- 场景执行函数 (保持不变) ---
export function browsePublicProduct() {
  group('匿名用户旅程', function () {
    const url = `${SUPABASE_URL}/functions/v1/get-product-details`;
    const payload = JSON.stringify({ public_id: PUBLIC_PRODUCT_ID });
    const params = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }, tags: { name: 'PublicProductView' } };
    const res = http.post(url, payload, params);
    check(res, { '公开浏览: 状态码为 200': (r) => r.status === 200 });
    metrics.public_product_view_duration.add(res.timings.duration);
  });
  sleep(Math.random() * 3 + 1);
}
export function viewDashboard(data) {
  group('认证用户读取旅程', function () {
    const url = `${SUPABASE_URL}/rest/v1/products?select=*`;
    const params = { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${data.authToken}` }, tags: { name: 'DashboardLoad' } };
    const res = http.get(url, params);
    check(res, { '加载仪表盘: 状态码为 200': (r) => r.status === 200 });
    metrics.dashboard_load_duration.add(res.timings.duration);
  });
  sleep(Math.random() * 5 + 2);
}
export function createAndDeleteProduct(data) {
  group('认证用户写入旅程', function () {
    const commonHeaders = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${data.authToken}`, 'Content-Type': 'application/json' };
    let newProductId = null;
    group('创建商品', function () {
      const url = `${SUPABASE_URL}/rest/v1/products`;
      const payload = JSON.stringify({ name: `K6 测试商品 ${Date.now()}`, description: 'k6 performance test' });
      const params = { headers: { ...commonHeaders, 'Prefer': 'return=representation' }, tags: { name: 'ProductCreate' } };
      const res = http.post(url, payload, params);
      if (check(res, { '创建商品: 状态码为 201': (r) => r.status === 201, '创建商品: 收到响应体': (r) => r.body.length > 0 })) {
        newProductId = res.json('0.id');
      }
      metrics.product_creation_duration.add(res.timings.duration);
    });
    sleep(2);
    if (newProductId) {
      group('删除商品', function () {
        const url = `${SUPABASE_URL}/rest/v1/products?id=eq.${newProductId}`;
        const params = { headers: commonHeaders, tags: { name: 'ProductDelete' } };
        const res = http.del(url, null, params);
        check(res, { '删除商品: 状态码为 204': (r) => r.status === 204 });
        metrics.product_deletion_duration.add(res.timings.duration);
      });
    }
  });
  sleep(Math.random() * 10 + 5);
}

// --- 📄 5. 自定义摘要 (保持不变) ---
export function handleSummary(data) {
  console.log('性能测试运行完毕');
  return { 'stdout': textSummary(data, { indent: ' ', enableColors: true }) };
}
