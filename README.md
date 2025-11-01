# Sulyap - Anonymous Fleeting Conversations

**Sulyap** (Filipino for "glance" or "fleeting look") - A privacy-focused chat application for brief, anonymous encounters with strangers. Connect, exchange messages, then let go. Like a momentary glance, conversations disappear without a trace.

Built with Node.js, Express, Socket.IO, and vanilla JavaScript.

## ✨ Features

- 🎲 **Random Pairing**: Automatically matches users with random chat partners
- 🔒 **100% Anonymous**: No registration, authentication, or personal data required
- 💬 **Real-Time Messaging**: Instant message delivery using WebSocket technology
- 🗑️ **Zero Data Retention**: All conversations deleted immediately when chat ends
- 📱 **Mobile-First Design**: Fully responsive across all devices
- ⚡ **Lightweight**: Minimal dependencies, fast performance
- 🎨 **Clean UI**: Minimalist design with smooth animations

## ✨ What is Sulyap?

**Sulyap** represents the fleeting nature of anonymous connections:
- 🌟 **Brief Encounters** - Connect with a stranger for a momentary conversation
- 👻 **No Traces** - Messages disappear when the chat ends
- 🔒 **Complete Anonymity** - No registration, no data stored
- 💨 **Ephemeral** - Like a glance that fades away

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (comes with Node.js)

### Installation

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## 🌐 Deploy to Render.com (FREE)

**Full deployment guide**: See **`backend/DEPLOY-RENDER.md`** for detailed instructions.

### Quick Deployment Steps:

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Sulyap chat app"
   git remote add origin https://github.com/YOUR_USERNAME/sulyap.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Sign up at [Render.com](https://render.com) (free, no credit card)
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Click **"Apply"**
   - Wait 2-5 minutes for deployment

3. **Access your live app**:
   - Render provides URL: `https://your-app-name.onrender.com`
   - Share with friends worldwide! 🌍

**Note**: Free tier spins down after 15 min of inactivity. First visit takes 30-60 seconds to wake up.

### Keep App Warm (Optional)
Use [UptimeRobot](https://uptimerobot.com) (free) to ping your app every 5 minutes and prevent spin-down.

## 📁 Project Structure

```
sulyap/
├── backend/
│   ├── server.js           # Main server file with Socket.IO logic
│   ├── package.json        # Backend dependencies
│   ├── README.md           # Backend documentation
│   └── DEPLOY-RENDER.md    # Detailed deployment guide
│
├── frontend/
│   ├── index.html          # Main HTML file with all screens
│   ├── styles.css          # Mobile-first responsive styles
│   └── app.js              # Client-side Socket.IO handling
│
├── render.yaml             # Render.com deployment config
├── .gitignore
└── README.md               # This file
```

## 🔧 How It Works

### User Flow

1. **Landing**: User clicks "Start Chatting"
2. **Waiting**: Server adds user to waiting queue
3. **Pairing**: When another user joins, server pairs them
4. **Chatting**: Users exchange messages in real-time
5. **Ending**: Either user can end chat; both are disconnected

### Technical Architecture

#### Backend (server.js)
- Express server serves frontend static files
- Socket.IO manages WebSocket connections
- Waiting queue stores unpaired users
- Active pairs map tracks current conversations
- All data exists only in memory (no database)

#### Frontend (app.js)
- Socket.IO client connects to server
- Event-driven architecture for UI updates
- Screen management system (landing, waiting, chat, disconnected)
- Real-time message rendering

## 🎯 Key Features Explained

### Random Pairing Algorithm
- First user joins → added to waiting queue
- Second user joins → paired with first user
- Both removed from queue and added to active pairs
- Private channel established for their conversation

### Privacy & Security
- No user data collection
- No message logging or storage
- No cookies or tracking
- Messages exist only in transit
- Conversation deleted on disconnect

### Real-Time Communication
- WebSocket protocol via Socket.IO
- Bidirectional event-based communication
- Auto-reconnection on network issues
- Disconnect detection and handling

## 🛠️ Configuration

### Port Configuration

Default port is `3000`. To change:

```javascript
// In backend/server.js
const PORT = process.env.PORT || 3000;
```

Or set environment variable:
```bash
PORT=8080 npm start
```

### CORS Settings

To allow connections from specific origins:

```javascript
// In backend/server.js
const io = socketIO(server, {
  cors: {
    origin: "http://yourdomain.com",
    methods: ["GET", "POST"]
  }
});
```

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🧪 Testing

### Local Testing with Multiple Users

1. Start the server
2. Open `http://localhost:3000` in two browser windows/tabs
3. Click "Start Chatting" in both windows
4. Test messaging, disconnection, and reconnection

### Network Testing

Test on local network:
1. Find your local IP (e.g., `ipconfig` on Windows, `ifconfig` on Mac/Linux)
2. Access from another device: `http://YOUR_IP:3000`

## 🔒 Security Considerations

- Rate limiting recommended for production
- Consider adding profanity filter
- Implement report/block functionality for abuse
- Add CAPTCHA to prevent bot spam
- Use HTTPS in production (Render provides free SSL)

## 🐛 Troubleshooting

### "Cannot connect to server"
- Ensure server is running (`npm start` in backend directory)
- Check firewall settings
- Verify port is not in use

### "Waiting forever for partner"
- Open another browser window to test
- Check server logs for errors
- Verify Socket.IO connection in browser console

### Messages not sending
- Check browser console for errors
- Verify Socket.IO connection status
- Ensure both users are properly paired

## 📈 Future Enhancements

- [ ] Video/audio chat support
- [ ] Interest-based matching
- [ ] Language preferences
- [ ] Typing indicators
- [ ] Message reactions/emojis
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)
- [ ] Rate limiting and spam protection
- [ ] Admin dashboard for monitoring

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check `backend/DEPLOY-RENDER.md` for deployment help
- Review server logs in Render Dashboard

---

**Built with ❤️ for privacy and simplicity**

**Deploy Status**: Ready for deployment to Render.com 🚀
