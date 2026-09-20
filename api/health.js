/**
 * api/health.js — Vercel Serverless Function
 * GET /api/health
 */
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.status(200).json({
    status: 'healthy',
    service: 'CodeUnderstander API (Vercel Serverless)',
    timestamp: new Date().toISOString(),
  });
};
