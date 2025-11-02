import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.connectionStatus = 'disconnected'; // disconnected, connecting, connected
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    this.connectionStatus = 'connecting';
    this.emitStatus('connecting');

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      query: {
        admin: true
      },
      reconnection: true,
      reconnectionDelay: RECONNECT_INTERVAL,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      transports: ['websocket', 'polling']
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Admin socket connected');
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.emitStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Admin socket disconnected:', reason);
      this.connectionStatus = 'disconnected';
      this.emitStatus('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error.message);
      this.handleReconnection();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      this.reconnectAttempts = attemptNumber;
      this.emitStatus('reconnecting', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after max attempts');
      this.emitStatus('failed');
    });

    // Admin-specific real-time events
    this.socket.on('admin-stats-update', (data) => {
      this.emit('stats-update', data);
    });

    this.socket.on('admin-new-feedback', (data) => {
      this.emit('new-feedback', data);
    });

    this.socket.on('admin-chat-event', (data) => {
      this.emit('chat-event', data);
    });

    this.socket.on('admin-error-log', (data) => {
      this.emit('error-log', data);
    });

    // Chart-specific updates
    this.socket.on('chart-update', (data) => {
      this.emit('chart-update', data);
    });

    // New real-time events
    this.socket.on('user_connected', (data) => {
      this.emit('user-connected', data);
    });

    this.socket.on('user_disconnected', (data) => {
      this.emit('user-disconnected', data);
    });

    this.socket.on('chat_started', (data) => {
      this.emit('chat-started', data);
    });

    this.socket.on('chat_ended', (data) => {
      this.emit('chat-ended', data);
    });

    this.socket.on('feedback_submitted', (data) => {
      this.emit('feedback-submitted', data);
    });

    this.socket.on('message_sent', (data) => {
      this.emit('message-sent', data);
    });
  }

  handleReconnection() {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.connectionStatus = 'reconnecting';
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = 'disconnected';
      this.emitStatus('disconnected');
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  emitStatus(status, detail = null) {
    this.emit('connection-status', { status, detail, attempts: this.reconnectAttempts });
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;
