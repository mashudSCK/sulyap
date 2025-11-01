const socket = io();

const landingScreen = document.getElementById('landing-screen');
const waitingScreen = document.getElementById('waiting-screen');
const chatScreen = document.getElementById('chat-screen');
const disconnectedScreen = document.getElementById('disconnected-screen');

const startBtn = document.getElementById('start-btn');
const cancelWaitingBtn = document.getElementById('cancel-waiting-btn');
const endChatBtn = document.getElementById('end-chat-btn');
const newChatBtn = document.getElementById('new-chat-btn');

const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');
const disconnectMessage = document.getElementById('disconnect-message');

let isInChat = false;

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
  if (screen === chatScreen) {
    messageInput.focus();
  }
}

function addMessage(text, type = 'received') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'message-bubble';
  bubbleDiv.textContent = text;
  messageDiv.appendChild(bubbleDiv);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(text) {
  const systemDiv = document.createElement('div');
  systemDiv.className = 'system-message';
  systemDiv.innerHTML = `<p>${text}</p>`;
  messagesContainer.appendChild(systemDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function clearMessages() {
  messagesContainer.innerHTML = '';
}

startBtn.addEventListener('click', () => {
  socket.emit('start-chat');
  showScreen(waitingScreen);
});

cancelWaitingBtn.addEventListener('click', () => {
  socket.emit('end-chat');
  showScreen(landingScreen);
});

endChatBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to end this chat?')) {
    socket.emit('end-chat');
    isInChat = false;
    disconnectMessage.textContent = 'You ended the chat.';
    showScreen(disconnectedScreen);
  }
});

newChatBtn.addEventListener('click', () => {
  socket.emit('start-chat');
  showScreen(waitingScreen);
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message && isInChat) {
    addMessage(message, 'sent');
    socket.emit('send-message', { message });
    messageInput.value = '';
    messageInput.focus();
  }
});

socket.on('waiting', (data) => {
  showScreen(waitingScreen);
});

socket.on('chat-start', (data) => {
  isInChat = true;
  clearMessages();
  addSystemMessage(data.message);
  showScreen(chatScreen);
});

socket.on('receive-message', (data) => {
  if (isInChat) {
    addMessage(data.message, 'received');
  }
});

socket.on('partner-left', (data) => {
  isInChat = false;
  disconnectMessage.textContent = data.message;
  showScreen(disconnectedScreen);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
  if (isInChat) {
    isInChat = false;
    disconnectMessage.textContent = 'Connection lost. Please check your internet.';
    showScreen(disconnectedScreen);
  }
});

window.addEventListener('beforeunload', (e) => {
  if (isInChat) {
    e.preventDefault();
    e.returnValue = 'You are in an active chat. Are you sure you want to leave?';
    return e.returnValue;
  }
});

console.log('🌟 Sulyap initialized - Fleeting conversations await');
