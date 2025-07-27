import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './utils/db.js';


import aiRoutes from './routes/aiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from "./routes/sessionRoutes.js";
import messageRoutes from './routes/messageRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import codeRoutes from './routes/codeRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors({
  origin: [
    'https://acciojob-assessment-frontend.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true, 
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/video-frames', express.static(path.join(__dirname, 'uploads/video_captioning/frames')));


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
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send('🔥 Backend is live');
});

const PORT = process.env.PORT || 18000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


