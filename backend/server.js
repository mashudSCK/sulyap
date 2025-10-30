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

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('start-chat', () => {
    if (waitingQueue.length > 0) {
      const partnerId = waitingQueue.shift();
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        activePairs.set(socket.id, partnerId);
        activePairs.set(partnerId, socket.id);
        socket.emit('chat-start', { message: 'Connected!' });
        partnerSocket.emit('chat-start', { message: 'Connected!' });
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
        partnerSocket.emit('receive-message', { message: data.message });
      }
    }
  });

  socket.on('end-chat', () => {
    handleDisconnection(socket);
  });

  socket.on('disconnect', () => {
    handleDisconnection(socket);
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
  console.log('Server running on port ' + PORT);
});
