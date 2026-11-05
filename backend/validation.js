const MAX_MESSAGE_LENGTH = 2000;
const MAX_FEEDBACK_COMMENT_LENGTH = 2000;

function validateChatPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.message !== 'string') return null;
  const message = data.message.trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;

  let replyTo = null;
  if (data.replyTo && typeof data.replyTo === 'object' && !Array.isArray(data.replyTo)) {
    const { text: replyMessage, messageId } = data.replyTo;
    if (typeof replyMessage === 'string' && typeof messageId === 'string') {
      replyTo = { text: replyMessage.slice(0, MAX_MESSAGE_LENGTH), messageId: messageId.slice(0, 100) };
    }
  }
  return { message, replyTo };
}

function validateFeedbackPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const rating = Number(data.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  if (data.comment !== undefined && typeof data.comment !== 'string') return null;
  if (data.referralCode !== undefined && typeof data.referralCode !== 'string') return null;

  return {
    rating,
    comment: (data.comment || '').trim().slice(0, MAX_FEEDBACK_COMMENT_LENGTH),
    referralCode: (data.referralCode || '').trim().slice(0, 100)
  };
}

function sanitizeFeedbackUpdates(updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) return {};
  const safe = {};
  if (typeof updates.read === 'boolean') safe.read = updates.read;
  if (typeof updates.pinned === 'boolean') safe.pinned = updates.pinned;
  return safe;
}

function isSafeFeedbackId(id) {
  return typeof id === 'string' && /^feedback-[0-9]{13}(?:-[a-f0-9]{8})?$/.test(id);
}

module.exports = { validateChatPayload, validateFeedbackPayload, sanitizeFeedbackUpdates, isSafeFeedbackId };
