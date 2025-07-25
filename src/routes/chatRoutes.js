import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import ChatSession from '../models/chatSession.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// GROQ AI
async function getAIResponse(messages, selectedModel) {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: selectedModel || 'llama3-70b-8192',
        messages: messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY?.slice(0, 5)); 
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI response:', error.response?.data || error.message);
    return "Sorry, the assistant is currently unavailable.";
  }
}

/*
// ORIGINAL OpenRouter version 
async function getAIResponse(messages, selectedModel) {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: selectedModel || 'openai/gpt-3.5-turbo',
        messages: messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI response:', error.response?.data || error.message);
    return "Sorry, the assistant is currently unavailable.";
  }
}
*/

/*
// ORIGINAL OpenAI version 
async function getAIResponse(messages, selectedModel) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: selectedModel || 'gpt-3.5-turbo',
        messages: messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI response:', error.response?.data || error.message);
    return "Sorry, the assistant is currently unavailable.";
  }
}
*/

// Send message and store chat
router.post('/send', async (req, res) => {
  const { sessionId, message, selectedModel, userId } = req.body;

  try {
    let session = await ChatSession.findOne({ sessionId });

    if (!session) {
      session = new ChatSession({
        sessionId: sessionId || uuidv4(),
        userId, 
        selectedModel,
        name: 'New Chat',
        messages: [],
      });
    }

    if (session.name === 'New Chat' && session.messages.length === 0) {
      session.name = message.trim().slice(0, 50); 
    }

    session.selectedModel = selectedModel;
    session.messages.push({ sender: 'user', message });

    const formattedMessages = session.messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message,
    }));

    const aiReply = await getAIResponse(formattedMessages, selectedModel);
    session.messages.push({ sender: 'assistant', message: aiReply });

    await session.save();

    res.status(200).json({
      sessionId: session.sessionId,
      response: aiReply,
      history: session.messages,
      name: session.name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all ChatSessions for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await ChatSession.find({ userId }).sort({ updatedAt: -1 });
    res.status(200).json({ sessions });
  } catch (err) {
    console.error('Error fetching ChatSessions:', err.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Chat history
router.get('/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({
      sessionId: session.sessionId,
      selectedModel: session.selectedModel,
      messages: session.messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
