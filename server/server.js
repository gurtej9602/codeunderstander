const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies up to 1MB
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API health endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.json({
    status: 'healthy',
    service: 'CodeUnderstander API',
    freeTierModel: 'gemini-flash-lite-latest (primary) + 3-model fallback pool',
    geminiApiKeyConfigured: hasKey,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Mount Code Review routes
app.use('/api', reviewRoutes);

// Serve production frontend build if available
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error occurred. Please try again.'
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CodeUnderstander Backend running on http://localhost:${PORT}`);
  console.log(`🛡️  Models: gemini-flash-lite-latest → gemini-flash-latest → gemini-3.6-flash (FREE-TIER POOL)`);
  console.log(`🔑 Gemini API Key configured: ${Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')}`);
  console.log(`⏱️  Rate limiting: 5s per user & max 14 requests/min`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
