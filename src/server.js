import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './utils/db.js';


import aiRoutes from './routes/aiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from "./routes/sessionRoutes.js";
import messageRoutes from './routes/messageRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import codeRoutes from './routes/codeRoutes.js';
import chatRoutes from './routes/chatRoutes.js';




dotenv.config();
const app = express();
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true, 
}));
app.use(express.json());

// DB connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api', aiRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('🔥 Backend is live');
});

const PORT = process.env.PORT || 18000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
