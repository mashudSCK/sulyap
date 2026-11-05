const crypto = require('crypto');

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 12;

function createAdminAuth(options = {}) {
  const nodeEnv = options.nodeEnv || process.env.NODE_ENV || 'development';
  const username = options.username ?? process.env.ADMIN_USERNAME ?? (nodeEnv === 'production' ? '' : 'admin');
  const password = options.password ?? process.env.ADMIN_PASSWORD ?? (nodeEnv === 'production' ? '' : 'admin123');
  const tokenTtlSeconds = options.tokenTtlSeconds || DEFAULT_TOKEN_TTL_SECONDS;
  const now = options.now || Date.now;
  const sessions = new Map();

  if (nodeEnv === 'production' && (!username || !password)) {
    throw new Error('Production requires ADMIN_USERNAME and ADMIN_PASSWORD.');
  }

  function createToken() {
    const timestamp = now();
    for (const [token, expiresAt] of sessions) {
      if (expiresAt <= timestamp) sessions.delete(token);
    }
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, timestamp + tokenTtlSeconds * 1000);
    return token;
  }

  function verifyToken(token) {
    if (typeof token !== 'string') return false;
    const expiresAt = sessions.get(token);
    if (!expiresAt) return false;
    if (expiresAt <= now()) {
      sessions.delete(token);
      return false;
    }
    return true;
  }

  function revokeToken(token) {
    return sessions.delete(token);
  }

  function verifyCredentials(candidateUsername, candidatePassword) {
    if (typeof candidateUsername !== 'string' || typeof candidatePassword !== 'string') return false;
    const suppliedUser = Buffer.from(candidateUsername);
    const expectedUser = Buffer.from(username);
    const suppliedPassword = Buffer.from(candidatePassword);
    const expectedPassword = Buffer.from(password);
    const userMatches = suppliedUser.length === expectedUser.length && crypto.timingSafeEqual(suppliedUser, expectedUser);
    const passwordMatches = suppliedPassword.length === expectedPassword.length && crypto.timingSafeEqual(suppliedPassword, expectedPassword);
    return userMatches && passwordMatches;
  }

  function authenticateHttp(req, res, next) {
    const authorization = req.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });
    req.adminToken = token;
    next();
  }

  function authenticateSocket(socket, next) {
    const token = socket.handshake.auth?.token;
    if (!verifyToken(token)) {
      const error = new Error('Unauthorized');
      error.data = { code: 'UNAUTHORIZED' };
      return next(error);
    }
    socket.data.isAdmin = true;
    socket.data.adminToken = token;
    socket.data.adminExpiresAt = sessions.get(token);
    next();
  }

  return { username, password, createToken, verifyToken, revokeToken, verifyCredentials, authenticateHttp, authenticateSocket };
}

module.exports = { createAdminAuth };
