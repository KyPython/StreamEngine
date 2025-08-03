const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  value: { type: String, required: true, minlength: 1, maxlength: 500 },
  timestamp: { type: Date, required: true }
});

function validateMessage(data) {
  return typeof data.value === 'string' && data.value.length > 0 && data.timestamp;
}

// Optional: text index for full-text search
// MessageSchema.index({ value: 'text' });

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
module.exports.validateMessage = validateMessage;