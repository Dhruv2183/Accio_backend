import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid'; // Add this import
import Session from '../models/sessionModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

// Updated route to match your server.js prefix
router.post('/sessions/:sessionId/voice-upload', upload.single('audio'), async (req, res) => {
  const { sessionId } = req.params;
  const filePath = req.file?.path;

  console.log('Received sessionId:', sessionId); // Debug log

  if (!filePath) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  try {
    // Create FormData for Whisper API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Transcribe using OpenAI Whisper
    const whisperRes = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );

    const transcript = whisperRes.data.text || 'No transcript received';

    // Get session
    const session = await Session.findById(sessionId);
    if (!session) {
      fs.unlinkSync(filePath);
      return res.status(404).json({ error: 'Session not found' });
    }

    // Call Groq for AI response
    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: transcript }],
      }),
    });

    const aiData = await aiRes.json();
    const aiReply = aiData.choices?.[0]?.message?.content || 'AI could not respond.';

    session.chatHistory.push(
      { id: uuidv4(), role: 'user', content: transcript },
      { id: uuidv4(), role: 'assistant', content: aiReply }
    );
    session.lastEditedAt = new Date();
    await session.save();

    fs.unlinkSync(filePath);

    // Fixed response property name
    return res.json({ transcription: transcript, reply: aiReply });

  } catch (error) {
    console.error('Transcription or AI reply error:', error.message);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(500).json({ error: 'Voice processing failed' });
  }
});

export default router;
