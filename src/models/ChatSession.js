import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'assistant'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  selectedModel: { type: String, required: true },
  name: { type: String, default: 'New Chat' },
  messages: [MessageSchema]
}, { timestamps: true });

export default mongoose.model('ChatSession', ChatSessionSchema);
