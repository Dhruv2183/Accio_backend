import express from 'express';
import axios from 'axios';
import Session from '../models/sessionModel.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/prompt', verifyToken, async (req, res) => {
  const { prompt, sessionId } = req.body;

  if (!prompt || !sessionId) {
    return res.status(400).json({ msg: 'Prompt and sessionId are required' });
  }

  try {
    // Groq Integration 
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: 'You are an expert React component generator. Return only the JSX and CSS.' },
          { role: 'user', content: prompt }
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // === 🟨 Previous OpenAI Call ===
    /*
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert React component generator. Return only the JSX and CSS.' },
        { role: 'user', content: prompt }
      ],
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    */

    // === 🟨 Previous OpenRouter Call ===
    /*
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert React component generator. Return only the JSX and CSS.' },
        { role: 'user', content: prompt }
      ],
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    */

    const aiResponse = response.data.choices?.[0]?.message?.content || '';

    const jsxStart = aiResponse.indexOf('<');
    const cssStart = aiResponse.indexOf('```css');
    const cssEnd = aiResponse.indexOf('```', cssStart + 1);

    const jsx = aiResponse.slice(jsxStart, cssStart).trim();
    const css = aiResponse.slice(cssStart + 6, cssEnd).trim();

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ msg: 'Session not found' });

    session.chatHistory.push({ role: 'user', content: prompt });
    session.chatHistory.push({ role: 'ai', content: aiResponse });
    session.generatedCode = { jsx, css };
    session.lastEditedAt = new Date();

    await session.save();

    res.json({ jsx, css, fullResponse: aiResponse });
  } catch (err) {
    console.error('AI Prompt Error:', err.message);
    res.status(500).json({ msg: 'Something went wrong with AI generation' });
  }
});

export default router;
