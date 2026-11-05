const express = require('express');
const http = require('http');
const os = require('os');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const { createAdminAuth } = require('./auth');
const { validateChatPayload, validateFeedbackPayload, sanitizeFeedbackUpdates, isSafeFeedbackId } = require('./validation');

const app = express();
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
const server = http.createServer(app);
const adminAuth = createAdminAuth();
const allowedOrigins = ['http://localhost:3001', 'http://localhost:3002', ...(process.env.ADMIN_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean)];
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});
const adminIo = io.of('/admin');
adminIo.use(adminAuth.authenticateSocket);

// Enable CORS for admin dashboard
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json({ limit: '16kb' }));

const waitingQueue = [];
const activePairs = new Map();
const PORT = process.env.PORT || 3000;

// Store admin stats
let adminStats = {
  onlineUsers: 0,
  activeChats: 0,
  totalMessages: 0,
  avgSessionDuration: 0,
  users24h: 0,
  users7d: 0,
  avgMessagesPerChat: 0,
  disconnectRate: 0
};

// Track daily message count
let dailyMessages = 0;
let sessionDurations = [];
let messageHistory = []; // Track messages for chart
let activityHistory = []; // Track user activity over time
let hourlyMessageCounts = {}; // Track messages per hour

// Initialize hourly message counts
function initializeHourlyData() {
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const hour = new Date(now);
    hour.setHours(i, 0, 0, 0);
    hourlyMessageCounts[i] = {
      hour: `${i}:00`,
      messages: 0,
      timestamp: hour.toISOString()
    };
  }
}

initializeHourlyData();

// Broadcast admin stats to all admin clients
function broadcastAdminStats() {
  // Calculate real user count (excluding admin connections)
  const realUserCount = io.sockets.sockets.size;
  adminStats.onlineUsers = Math.max(0, realUserCount);
  adminStats.activeChats = Math.floor(activePairs.size / 2);
  adminStats.totalMessages = dailyMessages;
  
  // Calculate average session duration
  if (sessionDurations.length > 0) {
    const avg = sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;
    adminStats.avgSessionDuration = Math.round(avg / 60000); // Convert to minutes
  }
  
  adminIo.emit('admin-stats-update', adminStats);
}

// Broadcast chart data updates
function broadcastChartUpdate() {
  const realUserCount = io.sockets.sockets.size;
  const timestamp = new Date().toISOString();
  
  // Add current activity to history
  activityHistory.push({
    hour: new Date().toLocaleTimeString('en-US', { hour: 'numeric', hour12: false }) + ':00',
    users: Math.max(0, realUserCount),
    timestamp
  });
  
  // Keep only last 20 activity points
  if (activityHistory.length > 20) {
    activityHistory.shift();
  }
  
  // Calculate session distribution from real data
  const sessionData = calculateSessionDistribution();
  
  // Get last 20 hourly message data points
  const hourlyData = Object.values(hourlyMessageCounts).slice(-20);
  
  adminIo.emit('chart-update', {
    timestamp,
    activityPoint: Math.max(0, realUserCount),
    messagePoint: dailyMessages,
    sessionData,
    activityData: activityHistory,
    hourlyData
  });
}

// Calculate session duration distribution
function calculateSessionDistribution() {
  if (sessionDurations.length === 0) {
    return [
      { name: '0-5 min', value: 0 },
      { name: '5-15 min', value: 0 },
      { name: '15-30 min', value: 0 },
      { name: '30+ min', value: 0 }
    ];
  }
  
  const distribution = { short: 0, medium: 0, long: 0, veryLong: 0 };
  
  sessionDurations.forEach(duration => {
    const minutes = duration / 60000;
    if (minutes < 5) distribution.short++;
    else if (minutes < 15) distribution.medium++;
    else if (minutes < 30) distribution.long++;
    else distribution.veryLong++;
  });
  
  const total = sessionDurations.length;
  return [
    { name: '0-5 min', value: Math.round((distribution.short / total) * 100) },
    { name: '5-15 min', value: Math.round((distribution.medium / total) * 100) },
    { name: '15-30 min', value: Math.round((distribution.long / total) * 100) },
    { name: '30+ min', value: Math.round((distribution.veryLong / total) * 100) }
  ];
}

// Periodic stats broadcasting (every 3 seconds)
setInterval(broadcastAdminStats, 3000);

// Periodic chart updates (every 5 seconds)
setInterval(broadcastChartUpdate, 5000);

// Broadcast online user count to all clients (excluding admins)
function broadcastOnlineCount() {
  const realUserCount = io.sockets.sockets.size;
  io.emit('online-count', { count: Math.max(0, realUserCount) });
}

function broadcastQueuePositions() {
  waitingQueue.forEach((socketId, index) => {
    const waitingSocket = io.sockets.sockets.get(socketId);
    waitingSocket?.emit('queue-position', { position: index + 1 });
  });
}

// NEW: Feedback storage directory
const feedbackDir = path.join(__dirname, 'feedback');
if (!fs.existsSync(feedbackDir)) {
  fs.mkdirSync(feedbackDir, { recursive: true });
}

adminIo.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);
  const expiryTimer = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.adminExpiresAt - Date.now()));
  socket.on('disconnect', () => {
    clearTimeout(expiryTimer);
    console.log('Admin disconnected:', socket.id);
  });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.connectedAt = Date.now();
  
  // Update admin stats and broadcast (with correct user count)
  const realUserCount = io.sockets.sockets.size;
  adminStats.onlineUsers = Math.max(0, realUserCount);
  adminIo.emit('admin-stats-update', { onlineUsers: adminStats.onlineUsers });
  
    adminIo.emit('user_connected', {
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Update activity chart immediately.
  adminIo.emit('chart-update', {
    timestamp: new Date().toISOString(),
    activityPoint: Math.max(0, realUserCount)
  });
  
  // Send current online count to new user and broadcast to all
  broadcastOnlineCount();

  socket.on('start-chat', (data) => {
    if (activePairs.has(socket.id) || waitingQueue.includes(socket.id)) return;
    socket.data.chatCleanupDone = false;
    socket.connectedAt = Date.now();
    const requestedName = typeof data?.username === 'string' ? data.username.trim() : '';
    const username = requestedName ? requestedName.slice(0, 32) : 'Stranger';
    socket.username = username;
    
    if (waitingQueue.length > 0) {
      const partnerId = waitingQueue.shift();
      broadcastQueuePositions();
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        activePairs.set(socket.id, partnerId);
        activePairs.set(partnerId, socket.id);
        
        // Emit chat_started event for admin
        adminIo.emit('chat_started', {
          user1: socket.id,
          user2: partnerId,
          timestamp: new Date().toISOString()
        });
        
        adminStats.activeChats = Math.floor(activePairs.size / 2);
        adminIo.emit('admin-stats-update', { activeChats: adminStats.activeChats });
        
        socket.emit('chat-start', { 
          message: 'Connected!', 
          yourName: socket.username,
          partnerName: partnerSocket.username 
        });
        partnerSocket.emit('chat-start', { 
          message: 'Connected!',
          yourName: partnerSocket.username,
          partnerName: socket.username
        });
      } else {
        waitingQueue.push(socket.id);
        socket.emit('waiting', { message: 'Waiting...' });
        broadcastQueuePositions();
      }
    } else {
      waitingQueue.push(socket.id);
      socket.emit('waiting', { message: 'Waiting...' });
      broadcastQueuePositions();
    }
  });

  socket.on('send-message', (data) => {
    const payload = validateChatPayload(data);
    if (!payload) return;
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        // Increment message count
        dailyMessages++;
        
        // Track message in current hour
        const currentHour = new Date().getHours();
        if (hourlyMessageCounts[currentHour]) {
          hourlyMessageCounts[currentHour].messages++;
        }
        
        // Track message for chart (with timestamp)
        messageHistory.push({
          timestamp: new Date().toISOString(),
          count: dailyMessages
        });
        
        // Keep only last 100 messages
        if (messageHistory.length > 100) {
          messageHistory.shift();
        }
        
        // Emit message_sent event for admin
        adminIo.emit('message_sent', {
          from: socket.id,
          to: partnerId,
          timestamp: new Date().toISOString()
        });
        
        // Immediately update chart with new message data point
        adminIo.emit('chart-update', {
          timestamp: new Date().toISOString(),
          messagePoint: dailyMessages,
          hourlyData: Object.values(hourlyMessageCounts).slice(-20)
        });
        
        // Forward message with reply data if present
        partnerSocket.emit('receive-message', { 
          message: payload.message,
          senderName: socket.username,
          replyTo: payload.replyTo
        });
      }
    }
  });

  // Typing indicator
  socket.on('typing', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('partner-typing');
      }
    }
  });

  socket.on('stop-typing', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('partner-stop-typing');
      }
    }
  });

  // NEW: Handle feedback submission
  socket.on('submit-feedback', (data, acknowledge) => {
    const acknowledgeSubmission = typeof acknowledge === 'function' ? acknowledge : (result) => socket.emit('feedback-received', result);
    const feedback = validateFeedbackPayload(data);
    if (!feedback) {
      acknowledgeSubmission({ success: false, error: 'Invalid feedback' });
      return;
    }
    console.log('📝 Feedback received:', {
      rating: feedback.rating,
      hasComment: !!feedback.comment,
      referral: feedback.referralCode || 'none'
    });
    
    // Save feedback to file
    const feedbackId = `feedback-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const feedbackFile = path.join(feedbackDir, `${feedbackId}.json`);
    const feedbackData = {
      ...feedback,
      timestamp: new Date().toISOString(),
      read: false,
      pinned: false
    };
    
    fs.writeFile(feedbackFile, JSON.stringify(feedbackData, null, 2), (err) => {
      if (err) {
        console.error('Error saving feedback:', err);
        acknowledgeSubmission({ success: false, error: 'Could not save feedback' });
      } else {
        console.log('✅ Feedback saved successfully');
        
        // Emit feedback_submitted event for admin dashboard
        adminIo.emit('feedback_submitted', {
          id: feedbackId,
          ...feedbackData
        });
        acknowledgeSubmission({ success: true });
      }
    });
  });

  socket.on('end-chat', () => {
    handleDisconnection(socket);
  });

  socket.on('disconnect', () => {
    handleDisconnection(socket);
    // Broadcast updated online count
    broadcastOnlineCount();
  });
});

function handleDisconnection(socket) {
  if (socket.data.chatCleanupDone) return;
  socket.data.chatCleanupDone = true;
  // Track session duration
  if (socket.connectedAt) {
    const duration = Date.now() - socket.connectedAt;
    sessionDurations.push(duration);
    // Keep only last 100 sessions
    if (sessionDurations.length > 100) {
      sessionDurations.shift();
    }
  }
  
  const partnerId = activePairs.get(socket.id);
  if (partnerId) {
    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit('partner-left', { message: 'Partner left' });
    }
    
    // Emit chat_ended event for admin
    adminIo.emit('chat_ended', {
      user1: socket.id,
      user2: partnerId,
      timestamp: new Date().toISOString()
    });
    
    activePairs.delete(socket.id);
    activePairs.delete(partnerId);
    
    adminStats.activeChats = Math.floor(activePairs.size / 2);
    adminIo.emit('admin-stats-update', { activeChats: adminStats.activeChats });
  }
  
  const queueIndex = waitingQueue.indexOf(socket.id);
  if (queueIndex > -1) {
    waitingQueue.splice(queueIndex, 1);
    broadcastQueuePositions();
  }
  
  // Emit user_disconnected event for admin
  adminIo.emit('user_disconnected', {
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
  
  // Update activity chart immediately
  const realUserCount = io.sockets.sockets.size;
  adminIo.emit('chart-update', {
    timestamp: new Date().toISOString(),
    activityPoint: Math.max(0, realUserCount)
  });
}

// ============================================
// ADMIN API ENDPOINTS
// ============================================

// Admin login endpoint
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  for (const [address, attempt] of loginAttempts) {
    if (now - attempt.startedAt >= LOGIN_WINDOW_MS) loginAttempts.delete(address);
  }
  const previous = loginAttempts.get(ip);
  const attempt = previous && now - previous.startedAt < LOGIN_WINDOW_MS
    ? previous
    : { startedAt: now, count: 0 };

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
  }

  const { username, password } = req.body || {};
  if (adminAuth.verifyCredentials(username, password)) {
    loginAttempts.delete(ip);
    res.json({ token: adminAuth.createToken() });
  } else {
    attempt.count += 1;
    loginAttempts.set(ip, attempt);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.use('/api/admin', (req, res, next) => {
  if (req.path === '/login') return next();
  return adminAuth.authenticateHttp(req, res, next);
});

app.delete('/api/admin/session', (req, res) => {
  adminAuth.revokeToken(req.adminToken);
  for (const socket of adminIo.sockets.values()) {
    if (socket.data.adminToken === req.adminToken) socket.disconnect(true);
  }
  res.status(204).end();
});

// Admin stats endpoint
app.get('/api/admin/stats', (req, res) => {
  // Update stats from current state (excluding admin connections)
  const realUserCount = io.sockets.sockets.size;
  adminStats.onlineUsers = Math.max(0, realUserCount);
  adminStats.activeChats = Math.floor(activePairs.size / 2);
  adminStats.totalMessages = dailyMessages;
  
  // Return real data, no mock data
  res.json({
    current: adminStats,
    activityData: activityHistory.length > 0 ? activityHistory : [
      { hour: new Date().toLocaleTimeString('en-US', { hour: 'numeric', hour12: false }) + ':00', users: realUserCount, timestamp: new Date().toISOString() }
    ],
    sessionData: calculateSessionDistribution(),
    hourlyData: Object.values(hourlyMessageCounts).slice(-20)
  });
});

app.get('/api/admin/health', (req, res) => {
  const memory = process.memoryUsage();
  const totalMemory = os.totalmem();
  const loadAverage = os.loadavg()[0];
  res.json({
    online: true,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsedBytes: memory.rss,
    memoryTotalBytes: totalMemory,
    memoryPercent: Math.round((memory.rss / totalMemory) * 100),
    loadAverage: Number(loadAverage.toFixed(2)),
    cpuCount: os.cpus().length
  });
});

// Admin feedback endpoint
app.get('/api/admin/feedback', (req, res) => {
  const feedbackFiles = fs.readdirSync(feedbackDir);
  const allFeedback = [];
  
  feedbackFiles.forEach(file => {
    if (file.endsWith('.json')) {
      const data = JSON.parse(fs.readFileSync(path.join(feedbackDir, file), 'utf8'));
      allFeedback.push({
        id: file.replace('.json', ''),
        ...data,
        read: data.read || false,
        pinned: data.pinned || false
      });
    }
  });
  
  // Sort by date, newest first
  allFeedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json(allFeedback);
});

// Update feedback
app.patch('/api/admin/feedback/:id', (req, res) => {
  const { id } = req.params;
  if (!isSafeFeedbackId(id)) return res.status(400).json({ error: 'Invalid feedback ID' });
  const updates = sanitizeFeedbackUpdates(req.body);
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid feedback updates provided' });
  const filePath = path.join(feedbackDir, `${id}.json`);
  
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const updated = { ...data, ...updates };
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Feedback not found' });
  }
});

// Delete feedback
app.delete('/api/admin/feedback/:id', (req, res) => {
  const { id } = req.params;
  if (!isSafeFeedbackId(id)) return res.status(400).json({ error: 'Invalid feedback ID' });
  const filePath = path.join(feedbackDir, `${id}.json`);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Feedback not found' });
  }
});

// System logs endpoint
app.get('/api/admin/logs', (req, res) => {
  res.json([]);
});

// Export endpoint (CSV)
app.get('/api/admin/export/:type', (req, res) => {
  const { type } = req.params;
  
  if (type === 'feedback') {
    const feedbackFiles = fs.readdirSync(feedbackDir);
    let csv = 'ID,Date,Rating,Username,Message\n';
    
    feedbackFiles.forEach(file => {
      if (file.endsWith('.json')) {
        const data = JSON.parse(fs.readFileSync(path.join(feedbackDir, file), 'utf8'));
        const id = file.replace('.json', '');
        const comment = String(data.comment || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""');
        const safeComment = /^[=+@\-]/.test(comment) ? `'${comment}` : comment;
        csv += `${id},"${data.timestamp}",${data.rating},"Anonymous","${safeComment}"\n`;
      }
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=feedback.csv');
    res.send(csv);
  } else if (type === 'logs') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=system-logs.csv');
    res.send('Severity,Message,Date,Details\n');
  } else {
    res.status(400).json({ error: 'Invalid export type' });
  }
});

// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
  console.log('\n🌟 Sulyap Server running on http://localhost:' + PORT);
  console.log('💬 Fleeting conversations, momentary connections');
  console.log('✨ New features enabled: Fixed Header, Reply, Notifications, Referrals, Feedback');
  console.log('📁 Feedback directory:', feedbackDir);
  console.log('👤 Admin Dashboard: /api/admin/* endpoints enabled');
  console.log('📊 Real-time chart data tracking: ACTIVE');
  console.log('');
});
