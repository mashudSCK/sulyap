const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json());

const waitingQueue = [];
const activePairs = new Map();
const PORT = process.env.PORT || 3000;

// NEW: Feedback storage directory
const feedbackDir = path.join(__dirname, 'feedback');
if (!fs.existsSync(feedbackDir)) {
  fs.mkdirSync(feedbackDir, { recursive: true });
}

// Broadcast online user count to all clients
function broadcastOnlineCount() {
  const onlineCount = io.engine.clientsCount;
  io.emit('online-count', { count: onlineCount });
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send current online count to new user and broadcast to all
  broadcastOnlineCount();

  socket.on('start-chat', (data) => {
    const username = data?.username || 'Stranger';
    socket.username = username;
    
    if (waitingQueue.length > 0) {
      const partnerId = waitingQueue.shift();
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        activePairs.set(socket.id, partnerId);
        activePairs.set(partnerId, socket.id);
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
      }
    } else {
      waitingQueue.push(socket.id);
      socket.emit('waiting', { message: 'Waiting...' });
    }
  });

  socket.on('send-message', (data) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        // Forward message with reply data if present
        partnerSocket.emit('receive-message', { 
          message: data.message,
          senderName: socket.username,
          replyTo: data.replyTo || null // Include reply metadata
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
  socket.on('submit-feedback', (data) => {
    console.log('📝 Feedback received:', {
      rating: data.rating,
      hasComment: !!data.comment,
      referral: data.referralCode || 'none'
    });
    
    // Save feedback to file
    const feedbackFile = path.join(feedbackDir, `feedback-${Date.now()}.json`);
    fs.writeFile(feedbackFile, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error('Error saving feedback:', err);
      } else {
        console.log('✅ Feedback saved successfully');
      }
    });
    
    // Acknowledge receipt
    socket.emit('feedback-received', { success: true });
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
  const partnerId = activePairs.get(socket.id);
  if (partnerId) {
    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit('partner-left', { message: 'Partner left' });
    }
    activePairs.delete(socket.id);
    activePairs.delete(partnerId);
  }
  const queueIndex = waitingQueue.indexOf(socket.id);
  if (queueIndex > -1) {
    waitingQueue.splice(queueIndex, 1);
  }
}

server.listen(PORT, () => {
  console.log('\n🌟 Sulyap Server running on http://localhost:' + PORT);
  console.log('💬 Fleeting conversations, momentary connections');
  console.log('✨ New features enabled: Fixed Header, Reply, Notifications, Referrals, Feedback');
  console.log('📁 Feedback directory:', feedbackDir);
  console.log('');
});
