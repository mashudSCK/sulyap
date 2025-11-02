const socket = io();

// Screen elements
const landingScreen = document.getElementById('landing-screen');
const waitingScreen = document.getElementById('waiting-screen');
const chatScreen = document.getElementById('chat-screen');
const disconnectedScreen = document.getElementById('disconnected-screen');

// Button elements
const startBtn = document.getElementById('start-btn');
const cancelWaitingBtn = document.getElementById('cancel-waiting-btn');
const endChatBtn = document.getElementById('end-chat-btn');
const newChatBtn = document.getElementById('new-chat-btn');

// Message elements
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');
const disconnectMessage = document.getElementById('disconnect-message');

// User info elements
const usernameInput = document.getElementById('username-input');
const onlineCountElement = document.getElementById('online-count');
const typingIndicator = document.getElementById('typing-indicator');
const yourNameText = document.getElementById('your-name-text');
const partnerNameText = document.getElementById('partner-name-text');

// Modal elements
const exitModal = document.getElementById('exit-modal');
const modalStayBtn = document.getElementById('modal-stay-btn');
const modalEndBtn = document.getElementById('modal-end-btn');

// NEW: Reply functionality elements
const replyPreview = document.getElementById('reply-preview');
const replyMessageText = document.getElementById('reply-message-text');
const replyLabel = document.getElementById('reply-label');
const cancelReplyBtn = document.getElementById('cancel-reply-btn');

// NEW: Referral elements
const copyLinkBtn = document.getElementById('copy-link-btn');
const referralLinkInput = document.getElementById('referral-link-input');

// NEW: Feedback elements
const feedbackBtn = document.getElementById('feedback-btn');
const feedbackModal = document.getElementById('feedback-modal');
const closeFeedbackBtn = document.getElementById('close-feedback-btn');
const starRating = document.getElementById('star-rating');
const stars = document.querySelectorAll('.star');
const feedbackText = document.getElementById('feedback-text');
const charCount = document.getElementById('char-count');
const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
const thankyouModal = document.getElementById('thankyou-modal');

// NEW: Notification sound
const notificationSound = document.getElementById('notification-sound');

// State variables
let isInChat = false;
let typingTimeout = null;
let replyingToMessage = null;
let replyingToMessageId = null; // NEW: Track message ID for scroll-to-original
let selectedRating = 0;
let messageCounter = 0; // NEW: Assign unique IDs to messages

// Get referral parameter from URL
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get('ref') || '';
if (referralCode) {
  console.log('🔗 Referred by:', referralCode);
}

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
  if (screen === chatScreen) {
    messageInput.focus();
  }
  
  // Update referral link with current username
  if (screen === disconnectedScreen) {
    const username = usernameInput.value.trim() || 'friend';
    referralLinkInput.value = `https://sulyap.onrender.com/?ref=${encodeURIComponent(username)}`;
  }
}

function addMessage(text, type = 'received', messageId = null, replyData = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  
  // Assign unique message ID
  if (!messageId) {
    messageId = `msg-${Date.now()}-${messageCounter++}`;
  }
  messageDiv.dataset.messageId = messageId;
  
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'message-bubble';
  
  // NEW: Add reply quote if this is a reply (Messenger-style)
  if (replyData) {
    bubbleDiv.classList.add('with-reply');
    
    const replyQuote = document.createElement('div');
    replyQuote.className = 'reply-quote';
    replyQuote.dataset.originalMessageId = replyData.originalMessageId;
    
    replyQuote.innerHTML = `
      <div class="reply-quote-icon">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3.5 8H12.5M3.5 8L7 4.5M3.5 8L7 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="reply-quote-content">
        <div class="reply-quote-label">Replied to</div>
        <div class="reply-quote-text">${escapeHtml(replyData.originalText)}</div>
      </div>
    `;
    
    // NEW: Click on reply quote to scroll to original message
    replyQuote.addEventListener('click', (e) => {
      e.stopPropagation();
      scrollToOriginalMessage(replyData.originalMessageId);
    });
    
    bubbleDiv.appendChild(replyQuote);
  }
  
  // Add message text
  const messageText = document.createElement('div');
  messageText.className = 'message-text';
  messageText.textContent = text;
  bubbleDiv.appendChild(messageText);
  
  // NEW: Add click event for reply functionality (only for received messages)
  if (type === 'received') {
    bubbleDiv.addEventListener('click', () => {
      if (isInChat) {
        setReplyMessage(text, messageId);
        bubbleDiv.classList.add('replying');
        setTimeout(() => bubbleDiv.classList.remove('replying'), 300);
      }
    });
  }
  
  messageDiv.appendChild(bubbleDiv);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageDiv;
}

// NEW: Scroll to and highlight original message
function scrollToOriginalMessage(messageId) {
  const originalMessage = document.querySelector(`[data-message-id="${messageId}"]`);
  if (originalMessage) {
    originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const bubble = originalMessage.querySelector('.message-bubble');
    if (bubble) {
      bubble.classList.add('highlight');
      setTimeout(() => bubble.classList.remove('highlight'), 1000);
    }
  }
}

// NEW: Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

// NEW: Reply functionality
function setReplyMessage(message, messageId) {
  replyingToMessage = message;
  replyingToMessageId = messageId; // Store for scroll-to-original
  replyMessageText.textContent = message;
  replyLabel.textContent = 'Replying to'; // Show "Replying to" while composing
  replyPreview.style.display = 'flex';
  messageInput.focus();
}

function clearReplyMessage() {
  replyingToMessage = null;
  replyingToMessageId = null;
  replyPreview.style.display = 'none';
}

// NEW: Play notification sound
function playNotificationSound() {
  notificationSound.volume = 0.4; // Set to 40% for softer, more pleasant sound
  notificationSound.currentTime = 0;
  notificationSound.play().catch(err => {
    console.log('Could not play notification sound:', err);
  });
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
    // NEW: Create reply data for Messenger-style layout
    let replyData = null;
    if (replyingToMessage && replyingToMessageId) {
      replyData = {
        originalText: replyingToMessage,
        originalMessageId: replyingToMessageId
      };
    }
    
    // Add message with reply data
    const sentMessageId = addMessage(message, 'sent', null, replyData);
    
    // Send to server (include reply info)
    const messageData = {
      message: message,
      replyTo: replyData ? {
        text: replyingToMessage,
        messageId: replyingToMessageId
      } : null
    };
    
    socket.emit('send-message', messageData);
    messageInput.value = '';
    clearReplyMessage(); // Clear reply after sending
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
  clearReplyMessage(); // NEW: Clear any reply state
  messageCounter = 0; // Reset message counter for new chat
  showScreen(chatScreen);
  
  // Update header with partner's name
  yourNameText.textContent = `You are chatting with ${data.partnerName}`;
  partnerNameText.style.display = 'none';
  
  // NEW: Play notification sound when matched
  playNotificationSound();
  
  // Add system message with animation
  setTimeout(() => {
    addSystemMessage('🎉 You\'re now connected! Start the conversation.');
  }, 300);
});

socket.on('receive-message', (data) => {
  if (isInChat) {
    // NEW: Handle reply data if present
    let replyData = null;
    if (data.replyTo) {
      replyData = {
        originalText: data.replyTo.text,
        originalMessageId: data.replyTo.messageId
      };
    }
    addMessage(data.message, 'received', null, replyData);
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

// NEW: Reply button event listener
cancelReplyBtn.addEventListener('click', clearReplyMessage);

// NEW: Referral copy link functionality
copyLinkBtn.addEventListener('click', () => {
  referralLinkInput.select();
  document.execCommand('copy');
  
  // Visual feedback
  copyLinkBtn.classList.add('copied');
  const originalHTML = copyLinkBtn.innerHTML;
  copyLinkBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  
  setTimeout(() => {
    copyLinkBtn.classList.remove('copied');
    copyLinkBtn.innerHTML = originalHTML;
  }, 2000);
});

// NEW: Social share buttons
document.querySelector('.share-btn.facebook').addEventListener('click', () => {
  const url = encodeURIComponent(referralLinkInput.value);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
});

document.querySelector('.share-btn.messenger').addEventListener('click', () => {
  const url = encodeURIComponent(referralLinkInput.value);
  window.open(`fb-messenger://share/?link=${url}`, '_blank');
});

document.querySelector('.share-btn.twitter').addEventListener('click', () => {
  const url = encodeURIComponent(referralLinkInput.value);
  const text = encodeURIComponent('Just had an amazing fleeting conversation on Sulyap! Try it out:');
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
});

// NEW: Feedback modal functionality
feedbackBtn.addEventListener('click', () => {
  feedbackModal.classList.add('active');
  selectedRating = 0;
  feedbackText.value = '';
  charCount.textContent = '0';
  stars.forEach(star => star.classList.remove('active'));
});

closeFeedbackBtn.addEventListener('click', () => {
  feedbackModal.classList.remove('active');
});

// NEW: Star rating functionality
stars.forEach(star => {
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.dataset.rating);
    stars.forEach((s, index) => {
      if (index < selectedRating) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  });
  
  star.addEventListener('mouseenter', () => {
    const rating = parseInt(star.dataset.rating);
    stars.forEach((s, index) => {
      if (index < rating) {
        s.style.filter = 'grayscale(0%)';
        s.style.opacity = '1';
      }
    });
  });
  
  star.addEventListener('mouseleave', () => {
    stars.forEach((s, index) => {
      if (index >= selectedRating) {
        s.style.filter = 'grayscale(100%)';
        s.style.opacity = '0.4';
      }
    });
  });
});

// NEW: Character count for feedback
feedbackText.addEventListener('input', () => {
  charCount.textContent = feedbackText.value.length;
});

// NEW: Submit feedback
submitFeedbackBtn.addEventListener('click', () => {
  if (selectedRating === 0) {
    alert('Please select a rating before submitting.');
    return;
  }
  
  const feedbackData = {
    rating: selectedRating,
    comment: feedbackText.value.trim(),
    timestamp: new Date().toISOString(),
    referralCode: referralCode
  };
  
  // Send feedback to server
  socket.emit('submit-feedback', feedbackData);
  
  // Show thank you modal
  feedbackModal.classList.remove('active');
  thankyouModal.classList.add('active');
  
  // Auto-close thank you modal after 3 seconds
  setTimeout(() => {
    thankyouModal.classList.remove('active');
  }, 3000);
});

// Close modal on outside click
exitModal.addEventListener('click', (e) => {
  if (e.target === exitModal) {
    hideExitModal();
  }
});

// NEW: Close feedback modals on outside click
feedbackModal.addEventListener('click', (e) => {
  if (e.target === feedbackModal) {
    feedbackModal.classList.remove('active');
  }
});

thankyouModal.addEventListener('click', (e) => {
  if (e.target === thankyouModal) {
    thankyouModal.classList.remove('active');
  }
});

window.addEventListener('beforeunload', (e) => {
  if (isInChat) {
    e.preventDefault();
    e.returnValue = 'You are in an active chat. Are you sure you want to leave?';
    return e.returnValue;
  }
});

// NEW: Mobile swipe gesture for reply (optional enhancement)
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

messagesContainer.addEventListener('touchstart', (e) => {
  if (e.target.closest('.message-bubble')) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }
}, false);

messagesContainer.addEventListener('touchend', (e) => {
  const bubble = e.target.closest('.message-bubble');
  if (bubble && isInChat) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture(bubble);
  }
}, false);

function handleSwipeGesture(bubble) {
  const swipeDistanceX = touchEndX - touchStartX;
  const swipeDistanceY = Math.abs(touchEndY - touchStartY);
  
  // Check if it's a horizontal swipe (not vertical scroll)
  if (Math.abs(swipeDistanceX) > 50 && swipeDistanceY < 50) {
    const messageDiv = bubble.closest('.message');
    const messageId = messageDiv.dataset.messageId;
    const messageText = bubble.querySelector('.message-text');
    const message = messageText ? messageText.textContent : bubble.textContent;
    
    setReplyMessage(message, messageId);
    bubble.classList.add('replying');
    setTimeout(() => bubble.classList.remove('replying'), 300);
  }
}

console.log('🌟 Sulyap initialized - Fleeting conversations await');
console.log('✨ Enhanced features: Fixed Header, Messenger-style Reply, Soft Notifications, Referrals, Feedback');
console.log('💜 Polished UX: Better spacing, smooth animations, scroll-to-original');
