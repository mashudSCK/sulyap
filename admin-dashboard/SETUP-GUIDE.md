# 🎯 Admin Dashboard Setup Guide

## Step 1: Install Dependencies

Open PowerShell or Command Prompt and navigate to the admin dashboard:

```powershell
cd c:\xampp\htdocs\chat\admin-dashboard
```

If you encounter PowerShell execution policy errors, run PowerShell as Administrator and execute:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then install dependencies:

```bash
npm install
```

This will install:
- React 18
- React Router Dom
- TailwindCSS
- Recharts (for charts)
- Socket.IO Client
- Lucide React (for icons)
- Date-fns (for date formatting)

## Step 2: Update Backend Server

Add admin API endpoints to `backend/server.js`:

```javascript
// Admin authentication (add after existing requires)
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

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

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === adminUsername && password === adminPassword) {
    // In production, use proper JWT
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin stats endpoint
app.get('/api/admin/stats', (req, res) => {
  // Real user count (exclude admin connections)
  const realUserCount = io.engine.clientsCount - adminSockets.size;
  
  // Calculate session distribution from actual data
  const sessionData = calculateSessionDistribution();
  
  res.json({
    current: {
      onlineUsers: realUserCount,
      activeChats: activePairs.size / 2,
      totalMessages: totalMessagesSent,
      avgSessionDuration: calculateAvgSessionDuration()
    },
    activityData: activityHistory.slice(-20), // Last 20 data points
    sessionData: sessionData,
    hourlyData: Object.keys(hourlyMessageCounts).map(hour => ({
      hour,
      messages: hourlyMessageCounts[hour]
    }))
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
  const updates = req.body;
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
  const { severity } = req.query;
  
  // Mock logs - replace with real logging system
  const logs = [
    {
      severity: 'info',
      message: 'Server started successfully',
      timestamp: new Date().toISOString(),
      details: 'Port 3000'
    },
    {
      severity: 'warning',
      message: 'High memory usage detected',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: '85% memory utilization'
    }
  ];
  
  const filtered = severity ? logs.filter(log => log.severity === severity) : logs;
  res.json(filtered);
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
        csv += `${id},"${data.timestamp}",${data.rating},"${data.username || 'Anonymous'}","${(data.message || '').replace(/"/g, '""')}"\n`;
      }
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=feedback.csv');
    res.send(csv);
  } else {
    res.status(400).json({ error: 'Invalid export type' });
  }
});

// Real-time data tracking
let activityHistory = [];
let hourlyMessageCounts = {};
let sessionDurations = [];
let totalMessagesSent = 0;
const adminSockets = new Set();

// Initialize hourly data structure
function initializeHourlyData() {
  for (let i = 0; i < 24; i++) {
    const hour = `${i}:00`;
    if (!hourlyMessageCounts[hour]) {
      hourlyMessageCounts[hour] = 0;
    }
  }
}
initializeHourlyData();

// Calculate session distribution from real data
function calculateSessionDistribution() {
  if (sessionDurations.length === 0) {
    return [
      { name: '0-5 min', value: 0 },
      { name: '5-15 min', value: 0 },
      { name: '15-30 min', value: 0 },
      { name: '30+ min', value: 0 },
    ];
  }
  
  const ranges = { '0-5 min': 0, '5-15 min': 0, '15-30 min': 0, '30+ min': 0 };
  sessionDurations.forEach(duration => {
    if (duration <= 5) ranges['0-5 min']++;
    else if (duration <= 15) ranges['5-15 min']++;
    else if (duration <= 30) ranges['15-30 min']++;
    else ranges['30+ min']++;
  });
  
  return Object.keys(ranges).map(name => ({ name, value: ranges[name] }));
}

// Calculate average session duration
function calculateAvgSessionDuration() {
  if (sessionDurations.length === 0) return 0;
  const sum = sessionDurations.reduce((a, b) => a + b, 0);
  return Math.round(sum / sessionDurations.length);
}

// Broadcast admin stats (every 3 seconds)
setInterval(() => {
  const realUserCount = io.engine.clientsCount - adminSockets.size;
  io.emit('admin-stats-update', {
    onlineUsers: realUserCount,
    activeChats: activePairs.size / 2,
    totalMessages: totalMessagesSent,
    avgSessionDuration: calculateAvgSessionDuration()
  });
}, 3000);

// Broadcast chart updates (every 5 seconds)
setInterval(() => {
  const now = new Date();
  const hour = `${now.getHours()}:00`;
  
  io.emit('chart-update', {
    activityPoint: {
      time: now.toLocaleTimeString(),
      users: io.engine.clientsCount - adminSockets.size
    },
    messagePoint: {
      hour,
      messages: hourlyMessageCounts[hour] || 0
    },
    sessionData: calculateSessionDistribution(),
    activityData: activityHistory.slice(-20),
    hourlyData: Object.keys(hourlyMessageCounts).map(h => ({
      hour: h,
      messages: hourlyMessageCounts[h]
    }))
  });
}, 5000);

// Update stats on socket events
io.on('connection', (socket) => {
  // Detect admin connections
  if (socket.handshake.query.admin === 'true') {
    adminSockets.add(socket.id);
  }
  
  const realUserCount = io.engine.clientsCount - adminSockets.size;
  
  // Track activity
  activityHistory.push({
    time: new Date().toLocaleTimeString(),
    users: realUserCount
  });
  
  // Keep only last 100 points
  if (activityHistory.length > 100) {
    activityHistory.shift();
  }
  
  // Emit to admin clients
  io.emit('user_connected', { count: realUserCount });
  
  socket.on('disconnect', () => {
    adminSockets.delete(socket.id);
    io.emit('user_disconnected', { count: io.engine.clientsCount - adminSockets.size });
  });
  
  socket.on('chat message', (msg) => {
    totalMessagesSent++;
    const hour = `${new Date().getHours()}:00`;
    hourlyMessageCounts[hour] = (hourlyMessageCounts[hour] || 0) + 1;
    io.emit('message_sent', { count: totalMessagesSent });
  });
  
  // ... rest of socket handling
});
```

## Step 3: Run the Development Server

### Start Backend (Terminal 1)
```bash
cd c:\xampp\htdocs\chat\backend
npm start
```

### Start Admin Dashboard (Terminal 2)
```bash
cd c:\xampp\htdocs\chat\admin-dashboard
npm run dev
```

The dashboard will open at: **http://localhost:3001**

## Step 4: Login

Use default credentials:
- **Username**: `admin`
- **Password**: `admin123`

## Step 5: Build for Production

When ready to deploy:

```bash
cd c:\xampp\htdocs\chat\admin-dashboard
npm run build
```

The built files will be in `dist/` folder.

### Option A: Serve from Backend

```javascript
// In backend/server.js
app.use('/admin', express.static(path.join(__dirname, '../admin-dashboard/dist')));
```

Access at: `http://your-domain.com/admin`

### Option B: Deploy Separately

Deploy the `dist/` folder to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting

Update the API URLs in production build.

## Troubleshooting

### PowerShell Script Execution Error

Run as Administrator:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use

Change port in `vite.config.js`:
```javascript
server: {
  port: 3002, // or any available port
}
```

### CORS Errors

Add CORS middleware in backend:
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
```

### Missing Dependencies

Delete node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. ✅ Customize colors in `tailwind.config.js`
2. ✅ Add real-time WebSocket updates
3. ✅ Implement proper JWT authentication
4. ✅ Add more detailed analytics
5. ✅ Set up proper logging system
6. ✅ Add email notifications
7. ✅ Implement rate limiting
8. ✅ Add database for persistent storage

## Security Checklist

- [ ] Change default admin credentials
- [ ] Use environment variables for sensitive data
- [ ] Implement proper JWT with expiration
- [ ] Add rate limiting on API endpoints
- [ ] Use HTTPS in production
- [ ] Implement CSRF protection
- [ ] Add input validation and sanitization
- [ ] Set up proper logging and monitoring
- [ ] Regular security audits

---

**Need Help?**

Check the main README or contact the development team.

**Built with ❤️ for Sulyap** 🇵🇭
