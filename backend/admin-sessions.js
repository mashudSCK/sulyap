const { randomBytes } = require('crypto');

const SESSION_TTL_MS = 60 * 60 * 1000;

function createAdminSessions(now = Date.now) {
  const sessions = new Map();
  return {
    issue() {
      for (const [token, expiresAt] of sessions) {
        if (expiresAt <= now()) sessions.delete(token);
      }
      if (sessions.size >= 1000) sessions.delete(sessions.keys().next().value);
      const token = randomBytes(32).toString('hex');
      const expiresAt = now() + SESSION_TTL_MS;
      sessions.set(token, expiresAt);
      return { token, expiresAt };
    },
    get(token) {
      if (typeof token !== 'string') return null;
      const expiresAt = sessions.get(token);
      if (!expiresAt || expiresAt <= now()) {
        sessions.delete(token);
        return null;
      }
      return { token, expiresAt };
    }
  };
}

module.exports = { createAdminSessions };
