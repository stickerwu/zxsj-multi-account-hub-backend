// Simple admin endpoints test using environment variables
// Usage: node scripts/test-admin-endpoints.js

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const ADMIN_CREDENTIAL = process.env.ADMIN_CREDENTIAL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function login() {
  if (!ADMIN_CREDENTIAL || !ADMIN_PASSWORD) {
    throw new Error('Missing ADMIN_CREDENTIAL or ADMIN_PASSWORD in environment');
  }
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: ADMIN_CREDENTIAL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(json)}`);
  }
  return json.data.access_token || json.data.token;
}

async function get(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${JSON.stringify(json)}`);
  }
  return json;
}

(async () => {
  try {
    const token = await login();
    const progress = await get('/progress/current-week?page=1&size=100', token);
    const dungeons = await get('/templates/dungeons?page=1&size=100', token);
    console.log('[OK] progress.current-week:', {
      total: progress.pagination?.total ?? progress.total,
      page: progress.pagination?.page ?? progress.page,
    });
    console.log('[OK] templates.dungeons:', {
      count: Array.isArray(dungeons.data) ? dungeons.data.length : (dungeons.items?.length || 0),
    });
    process.exit(0);
  } catch (err) {
    console.error('[FAIL]', err && err.message ? err.message : err);
    process.exit(1);
  }
})();