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

// New elements
const usernameInput = document.getElementById('username-input');
const onlineCountElement = document.getElementById('online-count');
const typingIndicator = document.getElementById('typing-indicator');
const yourNameText = document.getElementById('your-name-text');
const partnerNameText = document.getElementById('partner-name-text');
const exitModal = document.getElementById('exit-modal');
const modalStayBtn = document.getElementById('modal-stay-btn');
const modalEndBtn = document.getElementById('modal-end-btn');

let isInChat = false;
let typingTimeout = null;

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
  const username = usernameInput.value.trim() || 'Stranger';
  socket.emit('start-chat', { username });
  showScreen(waitingScreen);
});

cancelWaitingBtn.addEventListener('click', () => {
  socket.emit('end-chat');
  showScreen(landingScreen);
});

endChatBtn.addEventListener('click', () => {
  showExitModal();
});

modalStayBtn.addEventListener('click', () => {
  hideExitModal();
});

modalEndBtn.addEventListener('click', () => {
  hideExitModal();
  socket.emit('end-chat');
  isInChat = false;
  disconnectMessage.textContent = 'You ended the chat.';
  showScreen(disconnectedScreen);
  clearUsername();
});

newChatBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim() || 'Stranger';
  socket.emit('start-chat', { username });
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
    socket.emit('stop-typing');
  }
});

// Typing indicator
let typingTimer;
messageInput.addEventListener('input', () => {
  if (!isInChat) return;
  
  socket.emit('typing');
  
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit('stop-typing');
  }, 1000);
});

socket.on('waiting', (data) => {
  showScreen(waitingScreen);
});

socket.on('chat-start', (data) => {
  isInChat = true;
  clearMessages();
  showScreen(chatScreen);
  
  // Update header with partner's name
  yourNameText.textContent = `You are chatting with ${data.partnerName}`;
  partnerNameText.style.display = 'none'; // Hide the partner name element
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
  clearUsername();
});

// Online count
socket.on('online-count', (data) => {
  onlineCountElement.textContent = data.count;
});

// Typing indicators
socket.on('partner-typing', () => {
  if (typingIndicator) {
    typingIndicator.style.display = 'block';
  }
});

socket.on('partner-stop-typing', () => {
  if (typingIndicator) {
    typingIndicator.style.display = 'none';
  }
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
  if (isInChat) {
    isInChat = false;
    disconnectMessage.textContent = 'Connection lost. Please check your internet.';
    showScreen(disconnectedScreen);
    clearUsername();
  }
});

// Modal functions
function showExitModal() {
  exitModal.classList.add('active');
}

function hideExitModal() {
  exitModal.classList.remove('active');
}

function clearUsername() {
  yourNameText.textContent = 'Stranger';
  partnerNameText.textContent = 'Stranger';
}

// Close modal on outside click
exitModal.addEventListener('click', (e) => {
  if (e.target === exitModal) {
    hideExitModal();
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
