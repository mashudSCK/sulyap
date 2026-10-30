const { test } = require('node:test');
const assert = require('node:assert/strict');

test('sessions expire at the boundary and cannot be reused', () => {
  const { createAdminSessions } = require('../admin-sessions');
  let now = 100;
  const sessions = createAdminSessions(() => now);
  const session = sessions.issue();
  assert.equal(sessions.get(session.token).expiresAt, session.expiresAt);
  now = session.expiresAt;
  assert.equal(sessions.get(session.token), null);
  now = 100;
  assert.equal(sessions.get(session.token), null);
});

test('session storage is bounded and evicts the oldest token', () => {
  const { createAdminSessions } = require('../admin-sessions');
  const sessions = createAdminSessions(() => 100);
  const first = sessions.issue();
  let last;
  for (let i = 0; i < 1000; i++) last = sessions.issue();
  assert.equal(sessions.get(first.token), null);
  assert.ok(sessions.get(last.token));
});
