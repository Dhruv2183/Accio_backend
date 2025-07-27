import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

// Initialize express first
const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'https://acciojob-assessment-frontend.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes AFTER middleware
import voiceRoutes from './src/routes/voiceRoutes.js';
import codeRoutes from './src/routes/codeRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';

app.use('/api/voice', voiceRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/upload', uploadRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Ensure CORS headers
  res.header('Access-Control-Allow-Origin', 'https://acciojob-assessment-frontend.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

export const handler = serverless(app);