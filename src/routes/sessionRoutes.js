import express from 'express';
import Session from '../models/sessionModel.js';
import axios from 'axios';

const router = express.Router();

router.post('/new', async (req, res) => {
  try {
    const { name, userId, model, memory } = req.body;

    if (!name || !userId || !model) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = new Session({
      name,
      userId,
      model,
      memory: memory || '',
      createdAt: new Date(),
      chatHistory: [],
      generatedCode: {},
    });

    await session.save();
    res.status(201).json({ sessionId: session._id });
  } catch (error) {
    console.error('🔥 Error in POST /sessions/new:', error); 
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

//  GET: Get all sessions for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const sessions = await Session.find({ userId }).sort({ updatedAt: -1 });
    res.status(200).json({ sessions });
  } catch (err) {
    console.error('Error fetching user sessions:', err.message);
    res.status(500).json({ error: 'Failed to fetch user sessions' });
  }
});

//  GET: Get a specific session by sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.status(200).json(session);
  } catch (err) {
    console.error('Error fetching session:', err.message);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

//  DELETE: Delete entire session by sessionId
router.delete('/:sessionId', async (req, res) => {
  try {
    const deleted = await Session.findByIdAndDelete(req.params.sessionId);
    if (!deleted) return res.status(404).json({ error: 'Session not found' });

    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Error deleting session:', err.message);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

//  DELETE: Delete a specific message by messageId in session
router.delete('/:sessionId/message/:messageId', async (req, res) => {
  try {
    const { sessionId, messageId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.history = session.history.filter(
      msg => msg._id.toString() !== messageId
    );

    session.lastEditedAt = new Date();
    await session.save();

    res.status(200).json({ message: 'Message deleted', updatedHistory: session.history });
  } catch (err) {
    console.error('Error deleting message:', err.message);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});
//  POST: Send a message in a session and get AI response

router.post('/:sessionId/message', async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.chatHistory.push({ role: 'user', content: message });

    const payload = {
      model: session.model, // e.g. 'gpt-4', 'claude-3-opus'
      messages: session.chatHistory.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content,
      })),
    };

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    const aiRes = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const aiReply = aiRes.data.choices[0].message.content;

    session.chatHistory.push({ role: 'ai', content: aiReply });
    session.lastEditedAt = new Date();
    await session.save();

    res.status(200).json({
      aiReply,
      updatedHistory: session.chatHistory,
    });
  } catch (err) {
    console.error('Error generating AI reply:', err.message);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

// GET memory
router.get('/:sessionId/memory', async (req, res) => {
  const { sessionId } = req.params;
  console.log('Requested Session ID:', sessionId);

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json({ memory: session.memory });
  } catch (err) {
  console.error('Memory fetch error:', err);
  res.status(500).json({ error: 'Failed to fetch memory' });
}
});

// POST memory (update)
router.post('/:sessionId/memory', async (req, res) => {
  const { sessionId } = req.params;
  const { memory } = req.body;

  if (typeof memory !== 'string') {
    return res.status(400).json({ error: 'Memory must be a string' });
  }

  try {
    const session = await Session.findByIdAndUpdate(
      sessionId,
      { memory },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json({ message: 'Memory updated successfully', memory: session.memory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update memory' });
  }
});


export default router;
