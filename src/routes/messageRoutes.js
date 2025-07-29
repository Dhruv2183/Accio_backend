import express from 'express';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import Session from '../models/sessionModel.js';

const router = express.Router();

router.post('/send', async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // GROQ API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', 
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || 'AI could not respond.';

    session.chatHistory.push(
      { id: uuidv4(), role: 'user', content: message },
      { id: uuidv4(), role: 'assistant', content: aiReply }
    );

    session.lastEditedAt = new Date();
    await session.save();

    res.status(200).json({ reply: aiReply, messages: session.chatHistory });

    // Old OpenRouter API 
    /*
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: message }],
      }),
    });
    */

  } catch (err) {
    console.error('Message send error:', err.message);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

export default router;
