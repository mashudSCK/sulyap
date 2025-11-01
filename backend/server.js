const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, '../frontend')));

const waitingQueue = [];
const activePairs = new Map();
const PORT = process.env.PORT || 3000;

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
        partnerSocket.emit('receive-message', { 
          message: data.message,
          senderName: socket.username 
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
  console.log('💬 Fleeting conversations, momentary connections\n');
});
