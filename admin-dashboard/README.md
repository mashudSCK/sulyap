# Sulyap Admin Dashboard

A modern, minimalist real-time admin dashboard for monitoring and managing the Sulyap anonymous chat application.

## 🎨 Features

### Real-Time Monitoring
- **Live Dashboard** - Auto-updating statistics with WebSocket connection
- **Dynamic Charts** - User activity, message volume, session distribution
- **Connection Status** - Live indicator with auto-reconnection (every 5 seconds)
- **🟢 LIVE Badges** - Pulse animation when charts receive new data

### Analytics & Insights
- **User Monitoring** - Track online users (excluding admin connections)
- **Chat Analytics** - Monitor active chats, messages, avg session duration
- **Activity Graphs** - Real-time line charts with sliding window (last 20 points)
- **Message Charts** - Live bar charts showing hourly message distribution
- **Session Analysis** - Pie chart of session duration breakdown

### Management Tools
- **Feedback Management** - View, pin, mark as read, export user feedback
- **Instant Notifications** - Alert when new feedback arrives
- **System Logs** - Monitor server health, errors, warnings with filtering
- **CSV Export** - Download feedback and logs for analysis

### User Experience
- **Dark Mode** - Beautiful dark theme with smooth transitions
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Filipino Aesthetic** - Soft purple/pink color palette, minimalist design
- **Smooth Animations** - 300ms transitions, gentle easing, no flicker
- **Zero Fake Data** - All metrics from actual user activity

## 🚀 Quick Start

### Installation

```bash
cd admin-dashboard
npm install
```

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3001`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🔑 Local Development Credentials

- **Username**: `admin`
- **Password**: `admin123`

These credentials are development defaults only. Production must configure `ADMIN_USERNAME` and `ADMIN_PASSWORD` on the backend. Admin sessions expire after 12 hours; tokens stay in browser memory and require signing in again after a page refresh or backend restart.

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   └── AdminLayout.jsx       # Main layout with sidebar
│   ├── pages/
│   │   ├── Dashboard.jsx         # Overview with charts
│   │   ├── Users.jsx             # User monitoring
│   │   ├── Chats.jsx             # Chat activity
│   │   ├── Feedback.jsx          # Feedback management
│   │   ├── SystemLogs.jsx        # System logs
│   │   ├── Settings.jsx          # Settings page
│   │   └── Login.jsx             # Login page
│   ├── utils/
│   │   ├── api.js               # API utility functions
│   │   └── socket.js            # WebSocket connection
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎯 Backend Integration

The dashboard requires the backend API to provide the following endpoints:

### Authentication
- `POST /api/admin/login` - Admin login
- Response: `{ token: string }`

### Statistics
- `GET /api/admin/stats` - Get dashboard statistics
- Headers: `Authorization: Bearer <token>`

### Feedback
- `GET /api/admin/feedback` - Get all feedback
- `PATCH /api/admin/feedback/:id` - Update feedback
- `DELETE /api/admin/feedback/:id` - Delete feedback

### System Logs
- `GET /api/admin/logs?severity=error` - Get system logs

### Export
- `GET /api/admin/export/feedback` - Export feedback as CSV
- `GET /api/admin/export/logs` - Export logs as CSV

## 🔌 Real-time Updates

The dashboard connects to Socket.IO for real-time updates:

```javascript
// Admin-specific events (every 3 seconds)
socket.on('admin-stats-update', data => {
  // { onlineUsers, activeChats, totalMessages, avgSessionDuration }
})

// Chart updates (every 5 seconds + on user events)
socket.on('chart-update', data => {
  // { activityPoint, messagePoint, sessionData, activityData, hourlyData }
})

// Individual real-time events
socket.on('user_connected', data => {
  // User just connected
})

socket.on('user_disconnected', data => {
  // User just disconnected
})

socket.on('message_sent', data => {
  // Message sent in chat
})

socket.on('feedback_submitted', data => {
  // New feedback received - triggers notification
})

socket.on('chat_started', data => {
  // Chat began between two users
})

socket.on('chat_ended', data => {
  // Chat ended
})

// Connection status
socket.on('connection-status', status => {
  // { status: 'connected'|'connecting'|'reconnecting'|'disconnected', attempts }
})
```

### Connection Features:
- ✅ Auto-reconnection (5-second intervals, max 10 attempts)
- ✅ Connection status indicator in header
- ✅ Graceful handling of network issues
- ✅ WebSocket + polling fallback

### Chart Features:
- ✅ Sliding window (last 20 data points)
- ✅ Smooth 300ms animations
- ✅ Real-time updates without flicker
- ✅ Live badges with pulse animation

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize the color scheme:

```javascript
colors: {
  primary: { /* Your primary color */ },
  accent: { /* Your accent color */ }
}
```

### Features

Enable/disable features in the Settings page or modify the code directly.

## 📊 Charts

The dashboard uses [Recharts](https://recharts.org/) for data visualization:

- Line Chart: User activity over time
- Pie Chart: Session duration distribution  
- Bar Chart: Message activity by hour

## 🔒 Security

- Expiring opaque admin sessions, held in backend memory and cleared on restart
- Protected admin HTTP endpoints and Socket.IO namespace
- Login attempt throttling and backend payload validation
- HTTPS in production; configure the backend's `ADMIN_ORIGIN` to the dashboard origin

## 🚢 Deployment

### With Backend (Recommended)

Build the dashboard and serve it from the Express server:

```bash
npm run build
# Copy dist/ to backend/admin-dashboard/
```

Then update `server.js`:

```javascript
app.use('/admin', express.static(path.join(__dirname, 'admin-dashboard')))
```

### Standalone Deployment

Deploy to Vercel, Netlify, or any static hosting service.

Update `vite.config.js` with your backend URL:

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'https://your-backend-url.com'
    }
  }
})
```

## 📝 License

MIT License - Same as Sulyap main project

## 🤝 Contributing

Contributions welcome! Please maintain the minimalist Filipino aesthetic.

---

**Built with ❤️ for Sulyap**
