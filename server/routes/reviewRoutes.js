const express = require('express');
const router = express.Router();
const { analyzeCodeWithGemini, MAX_FILE_SIZE_BYTES } = require('../services/geminiService');
const { freeTierRateLimiter, getRateLimitStatus } = require('../middleware/rateLimiter');
const { getSupportedExtensions, LANGUAGE_PROMPT_CONFIG } = require('../config/promptTemplates');

/**
 * GET /api/review/supported-languages
 * Returns list of language configurations available for review.
 */
router.get('/supported-languages', (req, res) => {
  const supported = Object.entries(LANGUAGE_PROMPT_CONFIG).map(([ext, val]) => ({
    extension: ext,
    name: val.languageName,
    persona: val.persona
  }));

  res.json({
    success: true,
    supportedExtensions: getSupportedExtensions(),
    languages: supported,
    maxSizeBytes: MAX_FILE_SIZE_BYTES
  });
});

/**
 * GET /api/review/rate-limit-status
 * Returns remaining cooldown and RPM statistics for the caller.
 */
router.get('/rate-limit-status', (req, res) => {
  const status = getRateLimitStatus(req);
  res.json({
    success: true,
    data: status
  });
});

/**
 * POST /api/review
 * Analyzes uploaded code snippet using Gemini 1.5 Flash on the free tier.
 * Rate limited to max 1 request every 5 seconds per client.
 */
router.post('/review', freeTierRateLimiter, async (req, res) => {
  try {
    const { code, extension, fileName } = req.body;

    // 1. Input Validation
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid source code content to review.'
      });
    }

    if (!extension || typeof extension !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'File extension is required to route to the appropriate language reviewer.'
      });
    }

    // 2. Execute analysis via Gemini Free Tier
    const reviewData = await analyzeCodeWithGemini(code, extension);

    // 3. Return success payload
    return res.json({
      success: true,
      data: {
        ...reviewData,
        fileName: fileName || `code${extension}`,
        reviewedAt: new Date().toISOString()
      }
    });

  } catch (err) {
    const statusCode = err.statusCode || 500;
    
    // Explicit 429 response message adherence
    if (err.isRateLimit || statusCode === 429) {
      return res.status(429).json({
        success: false,
        isRateLimit: true,
        error: 'Free tier limit reached, please wait a minute and try again.'
      });
    }

    if (err.isApiKeyMissing) {
      return res.status(401).json({
        success: false,
        isApiKeyMissing: true,
        error: err.message
      });
    }

    return res.status(statusCode).json({
      success: false,
      error: err.message || 'An unexpected error occurred during code analysis.'
    });
  }
});

module.exports = router;
