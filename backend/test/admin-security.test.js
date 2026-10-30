const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');
const crypto = require('node:crypto');

const password = crypto.randomBytes(24).toString('hex');
const port = 32000 + Math.floor(Math.random() * 15000);
const base = `http://127.0.0.1:${port}`;
let child;

async function request(url, options = {}) {
  return fetch(base + url, { ...options, signal: AbortSignal.timeout(5000) });
}

before(async () => {
  child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), ADMIN_USERNAME: 'review-admin', ADMIN_PASSWORD: password },
    stdio: 'ignore'
  });
  for (let i = 0; i < 100; i++) {
    try { await request('/'); return; } catch { await new Promise(resolve => setTimeout(resolve, 50)); }
  }
  throw new Error('Test server did not start');
});

after(async () => {
  if (child && child.exitCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
});

async function login() {
  return request('/api/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'review-admin', password })
  });
}

test('every admin API denies anonymous and forged tokens before handling data', async () => {
  for (const [method, url] of [
    ['GET', '/api/admin/stats'], ['GET', '/api/admin/feedback'],
    ['GET', '/api/admin/logs'], ['GET', '/api/admin/export/feedback'],
    ['PATCH', '/api/admin/feedback/not-present'], ['DELETE', '/api/admin/feedback/not-present']
  ]) {
    for (const headers of [{}, { Authorization: 'Bearer forged' }]) {
      assert.equal((await request(url, { method, headers })).status, 401, `${method} ${url}`);
    }
  }
});

test('login issues distinct opaque tokens accepted by protected endpoints', async () => {
  const first = await login();
  assert.equal(first.status, 200);
  const { token } = await first.json();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.notEqual(token, (await (await login()).json()).token);
  assert.equal((await request('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })).status, 200);
  assert.equal((await request('/api/admin/stats', { headers: { Authorization: `Bearer ${token.slice(0, -1)}x` } })).status, 401);
});

test('bad or missing credentials cannot obtain a session', async () => {
  for (const body of [{}, { username: 'review-admin', password: 'wrong' }]) {
    assert.equal((await request('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })).status, 401);
  }
});

async function connectSocket(admin, token) {
  const query = '/socket.io/?EIO=4&transport=polling' + (admin ? '&admin=true' : '');
  const opening = await (await request(query)).text();
  const sid = JSON.parse(opening.slice(1)).sid;
  const url = query + '&sid=' + encodeURIComponent(sid);
  await request(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '40' + JSON.stringify(token ? { token } : {}) });
  return { url, packet: await (await request(url)).text() };
}

test('socket query flag cannot impersonate admin; valid sessions can connect', async () => {
  assert.match((await connectSocket(true)).packet, /^44/);
  assert.match((await connectSocket(true, 'forged')).packet, /^44/);
  const { token } = await (await login()).json();
  assert.match((await connectSocket(true, token)).packet, /40\{/);
});

test('public sockets do not receive admin activity or chart events', async () => {
  const { packet } = await connectSocket(false);
  assert.match(packet, /40\{/);
  assert.doesNotMatch(packet, /admin-stats-update|user_connected|chart-update/);
});

test('anonymous users can still pair and exchange chat messages', async () => {
  const first = await connectSocket(false);
  const second = await connectSocket(false);
  const send = (url, event, data) => request(url, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' },
    body: '42' + JSON.stringify([event, data])
  });
  await send(first.url, 'start-chat', { username: 'First' });
  await send(second.url, 'start-chat', { username: 'Second' });
  const paired = await (await request(first.url)).text();
  assert.match(paired, /chat-start/);
  assert.doesNotMatch(paired, /chat_started|user_connected|admin-stats-update/);
  await send(second.url, 'send-message', { message: 'Test message' });
  const received = await (await request(first.url)).text();
  assert.match(received, /receive-message/);
  assert.match(received, /Test message/);
  assert.doesNotMatch(received, /message_sent|chart-update/);
});

test('login guessing is throttled', async () => {
  let response;
  for (let i = 0; i < 21; i++) response = await request('/api/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'review-admin', password: 'wrong' })
  });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '60');
});

test('missing admin configuration disables login while public chat remains available', async () => {
  const otherPort = port + 1;
  const other = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(otherPort), ADMIN_PASSWORD: '' }, stdio: 'ignore'
  });
  try {
    const url = `http://127.0.0.1:${otherPort}`;
    let response;
    for (let i = 0; i < 100; i++) {
      try { response = await fetch(url + '/socket.io/?EIO=4&transport=polling', { signal: AbortSignal.timeout(1000) }); break; }
      catch { await new Promise(resolve => setTimeout(resolve, 50)); }
    }
    assert.equal(response && response.status, 200);
    response = await fetch(url + '/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong' }), signal: AbortSignal.timeout(3000)
    });
    assert.equal(response.status, 503);
  } finally {
    if (other.exitCode === null) { const exited = once(other, 'exit'); other.kill(); await exited; }
  }
});
