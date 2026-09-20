/**
 * geminiService.js
 * ================
 * Handles all Gemini API calls for CodeUnderstander.
 *
 * KEY FEATURE: Chunked line-by-line analysis
 * ------------------------------------------
 * For files with many lines, Gemini can truncate its JSON output before
 * explaining every line. To guarantee 100% coverage we:
 *   1. Send the full file for the main analysis (summary, concepts, steps, etc.)
 *   2. For lineByLine: if any lines are missing after the main call, we send
 *      the missing lines in small batches (≤60 lines each) and merge results.
 *   3. reconcileAllLines() fills any remaining gaps with smart fallbacks.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildReviewPrompt } = require('../config/promptTemplates');

// Free-tier model pool — tried in order until one succeeds
const MODEL_POOL = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

const MAX_FILE_SIZE_BYTES = 200 * 1024; // 200 KB

// How many lines to explain per chunk request (keeps each request well under token limits)
const LINES_PER_CHUNK = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function enforceFreeTierTokenLimit(content) {
  if (!content) return { sanitizedContent: '', wasTruncated: false, originalLength: 0 };
  const originalLength = Buffer.byteLength(content, 'utf8');
  if (originalLength > MAX_FILE_SIZE_BYTES) {
    const truncated = content.slice(0, MAX_FILE_SIZE_BYTES);
    return {
      sanitizedContent: truncated + '\n\n/* [NOTE: Code truncated at 200KB limit] */',
      wasTruncated: true,
      originalLength,
    };
  }
  return { sanitizedContent: content, wasTruncated: false, originalLength };
}

function cleanAndParseJsonResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from Gemini API');
  }
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  if (cleaned.endsWith('```'))   cleaned = cleaned.replace(/\s*```$/, '');
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error(`Failed to parse AI response: ${initialErr.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart fallback explanations for lines the AI missed
// ─────────────────────────────────────────────────────────────────────────────

function generateContextualFallback(lineText, lineNum) {
  const raw  = lineText ?? '';
  const trim = raw.trim();

  if (!trim) return 'Blank line — visual spacing between code sections.';

  // Pure brace / bracket lines
  if (/^[{}()\[\];,]+$/.test(trim)) {
    if (trim === '{')   return 'Opens a new code block.';
    if (trim === '}')   return 'Closes the preceding code block.';
    if (trim === '};')  return 'Closes the block and ends the statement.';
    if (trim === '()')  return 'Empty parameter list.';
    if (trim === ');')  return 'Ends the current statement or function call.';
    return 'Structural punctuation — closes or delimits a code block.';
  }

  // Import / include / require / using
  if (/^(import|#include|using|require|from)\b/.test(trim))
    return 'Imports a required library, module, or package for use in this file.';

  // Package / namespace declaration
  if (/^(package|namespace)\s+/.test(trim))
    return 'Declares the package or namespace that organises this file.';

  // Single-line comments
  if (/^\/\//.test(trim))  return 'Single-line developer comment — describes what the nearby code does.';
  if (/^#/.test(trim))     return 'Comment line — provides a human-readable note for developers.';
  if (/^\/\*/.test(trim))  return 'Start of a block comment — describes a section or function.';
  if (/^\*/.test(trim))    return 'Part of a block or JSDoc comment.';

  // Return statement
  if (/^return\b/.test(trim)) return 'Returns a value or exits the current function.';

  // Throw / raise
  if (/^(throw|raise)\b/.test(trim)) return 'Throws an exception or error when a problem occurs.';

  // Print / log
  if (/^(System\.out|console\.|print|printf|println|echo|puts)\b/.test(trim))
    return 'Outputs a value or message to the console or screen.';

  // Variable declaration keywords
  if (/^(var|let|const|int|float|double|string|boolean|char|long|short|byte|auto)\s+/.test(trim))
    return 'Declares and possibly initialises a variable.';

  // Class / interface / struct / enum declaration
  if (/^(public\s+|private\s+|protected\s+)?(class|interface|struct|enum|record)\s+/.test(trim))
    return 'Declares a new class, interface, struct, or enumeration.';

  // Function / method declaration
  if (/^(public|private|protected|static|async|def|func|fn|fun)\b/.test(trim))
    return 'Declares a function or method with its parameters and return type.';

  // Annotation / decorator
  if (/^[@#!]/.test(trim))
    return 'Annotation or decorator that modifies the behaviour of the next declaration.';

  // If / else / switch
  if (/^(if|else if|else|switch)\b/.test(trim))
    return 'Conditional statement — executes code only when a specific condition is true.';

  // Loops
  if (/^(for|while|do|foreach)\b/.test(trim))
    return 'Loop — repeats a block of code multiple times.';

  // Try / catch / finally
  if (/^(try|catch|finally)\b/.test(trim))
    return 'Error-handling block — catches exceptions and allows graceful recovery.';

  // Generic fallback
  return `Executes a program statement (line ${lineNum}).`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reconcile: merge AI output + fill 100% of lines
// ─────────────────────────────────────────────────────────────────────────────

function reconcileAllLines(rawLineByLine, originalCode) {
  const fileLines = (originalCode || '').split('\n');
  const totalLines = fileLines.length;

  // Build a map from lineNumber → item
  const geminiMap = new Map();
  if (Array.isArray(rawLineByLine)) {
    for (const item of rawLineByLine) {
      if (!item) continue;
      const num = typeof item.lineNumber === 'number'
        ? item.lineNumber
        : parseInt(item.lineNumber, 10);
      if (!isNaN(num) && num >= 1 && num <= totalLines) {
        geminiMap.set(num, item);
      }
    }
  }

  const result = [];
  for (let n = 1; n <= totalLines; n++) {
    const verbatim = fileLines[n - 1];
    const ai       = geminiMap.get(n);
    if (ai && ai.explanation && ai.explanation.trim()) {
      result.push({ lineNumber: n, code: verbatim, explanation: ai.explanation.trim() });
    } else {
      result.push({ lineNumber: n, code: verbatim, explanation: generateContextualFallback(verbatim, n) });
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw Gemini call — tries each model in the pool
// ─────────────────────────────────────────────────────────────────────────────

async function callGemini(apiKey, promptText) {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of MODEL_POOL) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.15,
          maxOutputTokens: 8192,
        },
      });
      const result   = await model.generateContent(promptText);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.warn(`[${modelName}] ${err.message}`);
      lastError = err;
      if (err.status === 429 || /429|quota|RESOURCE_EXHAUSTED/i.test(err.message)) break;
      if (err.status === 503 || /503|overload|demand/i.test(err.message)) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }
  }
  throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chunk prompt: asks Gemini to explain ONLY a slice of lines
// ─────────────────────────────────────────────────────────────────────────────

function buildChunkPrompt(fileLines, startLine, endLine, languageName) {
  const slice = fileLines
    .slice(startLine - 1, endLine)
    .map((line, i) => `${startLine + i} | ${line}`)
    .join('\n');

  return `You are a programming tutor explaining ${languageName} code line by line.

Below is a NUMBERED SLICE of a ${languageName} file (lines ${startLine} to ${endLine}).
For EVERY line in this slice, write a plain-English explanation.

RULES:
- You MUST return ONLY a raw JSON array (no markdown, no backticks).
- The array must have EXACTLY ${endLine - startLine + 1} elements — one per line.
- Sequence: from lineNumber ${startLine} to lineNumber ${endLine} with NO gaps.
- For blank lines, write: "Blank line for visual spacing."
- For closing braces/brackets, explain what block they close.
- Keep each explanation to 1-2 clear sentences.

JSON array format (return THIS structure, nothing else):
[
  { "lineNumber": ${startLine}, "code": "<exact code>", "explanation": "<explanation>" },
  ...
  { "lineNumber": ${endLine},   "code": "<exact code>", "explanation": "<explanation>" }
]

CODE SLICE:
\`\`\`${languageName.toLowerCase()}
${slice}
\`\`\``;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch missing lines via chunk requests
// ─────────────────────────────────────────────────────────────────────────────

async function fetchMissingLineChunks(apiKey, fileLines, missingLineNums, languageName) {
  if (!missingLineNums.length) return [];

  // Group consecutive missing lines into ranges
  const ranges = [];
  let start = missingLineNums[0];
  let end   = missingLineNums[0];
  for (let i = 1; i < missingLineNums.length; i++) {
    if (missingLineNums[i] <= end + 5) {
      // Extend range (allow small gaps so we don't over-fragment)
      end = missingLineNums[i];
    } else {
      ranges.push({ start, end });
      start = missingLineNums[i];
      end   = missingLineNums[i];
    }
  }
  ranges.push({ start, end });

  // Chunk ranges that are too large
  const chunks = [];
  for (const { start, end } of ranges) {
    for (let s = start; s <= end; s += LINES_PER_CHUNK) {
      chunks.push({ start: s, end: Math.min(s + LINES_PER_CHUNK - 1, end) });
    }
  }

  const recovered = [];
  for (const { start, end } of chunks) {
    try {
      const prompt = buildChunkPrompt(fileLines, start, end, languageName);
      const rawText = await callGemini(apiKey, prompt);

      // Parse: expect a JSON array
      let parsed;
      try {
        let cleaned = rawText.trim();
        if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
        if (cleaned.endsWith('```'))   cleaned = cleaned.replace(/\s*```$/, '');
        cleaned = cleaned.trim();
        // Extract array if nested inside object
        if (cleaned.startsWith('{')) {
          const m = cleaned.match(/\[[\s\S]*\]/);
          if (m) cleaned = m[0];
        }
        parsed = JSON.parse(cleaned);
      } catch {
        console.warn(`Chunk ${start}-${end}: could not parse JSON, using fallbacks`);
        continue;
      }

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.lineNumber && item.explanation) {
            recovered.push(item);
          }
        }
      }

      // Brief pause between chunk requests to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.warn(`Chunk ${start}-${end} failed: ${err.message}`);
    }
  }

  return recovered;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalise the full AI result
// ─────────────────────────────────────────────────────────────────────────────

function normalizeReviewResult(parsed, language, wasTruncated) {
  const difficulty = ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty)
    ? parsed.difficulty
    : 'intermediate';

  const concepts = Array.isArray(parsed.concepts)
    ? parsed.concepts.map(c => ({ name: c.name || 'Concept', explanation: c.explanation || '' }))
    : [];

  const stepByStep = Array.isArray(parsed.stepByStep)
    ? parsed.stepByStep.map((s, i) => ({
        step:        s.step || i + 1,
        title:       s.title || `Step ${i + 1}`,
        lines:       s.lines || '',
        explanation: s.explanation || '',
      }))
    : [];

  const keyTerms = Array.isArray(parsed.keyTerms)
    ? parsed.keyTerms.map(t => ({ term: t.term || 'Term', meaning: t.meaning || '' }))
    : [];

  const whatYouCanLearn = Array.isArray(parsed.whatYouCanLearn)
    ? parsed.whatYouCanLearn.filter(Boolean)
    : [];

  return {
    language,
    summary:          parsed.summary || 'Code explanation completed.',
    difficulty,
    concepts,
    stepByStep,
    lineByLine:       Array.isArray(parsed.lineByLine) ? parsed.lineByLine : [],
    keyTerms,
    analogy:          parsed.analogy || '',
    whatYouCanLearn,
    wasTruncated,
    reviewedAt:       new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

async function analyzeCodeWithGemini(code, extension) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    const err = new Error('Gemini API key not configured. Add your key to server/.env');
    err.statusCode = 401;
    err.isApiKeyMissing = true;
    throw err;
  }

  // 1. Sanitise input
  const { sanitizedContent, wasTruncated } = enforceFreeTierTokenLimit(code);
  if (!sanitizedContent.trim()) {
    const err = new Error('Cannot analyse empty code content.');
    err.statusCode = 400;
    throw err;
  }

  // 2. Build main prompt
  const { language, fullPrompt } = buildReviewPrompt(extension, sanitizedContent);
  const fileLines = sanitizedContent.split('\n');
  const totalLines = fileLines.length;

  // 3. Main Gemini call
  let rawText;
  try {
    rawText = await callGemini(apiKey, fullPrompt);
  } catch (apiError) {
    handleApiError(apiError);
  }

  let parsed;
  try {
    parsed = cleanAndParseJsonResponse(rawText);
  } catch {
    parsed = {};
  }

  // 4. Normalise the main result (lineByLine may be partial)
  const normalised = normalizeReviewResult(parsed, language, wasTruncated);

  // 5. Find which line numbers are still missing
  const coveredSet = new Set();
  for (const item of normalised.lineByLine) {
    const n = typeof item.lineNumber === 'number' ? item.lineNumber : parseInt(item.lineNumber, 10);
    if (!isNaN(n)) coveredSet.add(n);
  }

  const missingLines = [];
  for (let n = 1; n <= totalLines; n++) {
    if (!coveredSet.has(n)) missingLines.push(n);
  }

  // 6. If lines are missing, fetch them in chunks
  if (missingLines.length > 0) {
    console.log(`[LineByLine] ${missingLines.length}/${totalLines} lines missing — fetching in chunks`);
    const recovered = await fetchMissingLineChunks(apiKey, fileLines, missingLines, language);
    // Merge recovered items into lineByLine array
    normalised.lineByLine = [...normalised.lineByLine, ...recovered];
  }

  // 7. Final reconcile — fills any remaining gaps and sorts
  normalised.lineByLine = reconcileAllLines(normalised.lineByLine, sanitizedContent);

  console.log(`[LineByLine] Final coverage: ${normalised.lineByLine.length}/${totalLines} lines`);
  return normalised;
}

function handleApiError(apiError) {
  console.error('Gemini API Error:', apiError.message);
  const isRateLimit =
    apiError.status === 429 ||
    /429|quota|RESOURCE_EXHAUSTED/i.test(apiError.message);
  if (isRateLimit) {
    const err = new Error('Rate limit reached. Please wait a minute and try again.');
    err.statusCode = 429; err.isRateLimit = true; throw err;
  }
  if (apiError.status === 503 || /503|high demand|temporar/i.test(apiError.message)) {
    const err = new Error('Gemini is experiencing high demand. Retrying shortly…');
    err.statusCode = 503; throw err;
  }
  if (/API_KEY_INVALID|key not valid/i.test(apiError.message) || apiError.status === 400) {
    const err = new Error('Invalid Gemini API key. Verify at https://aistudio.google.com/');
    err.statusCode = 401; throw err;
  }
  const err = new Error(`Gemini error: ${apiError.message || 'Unknown error'}`);
  err.statusCode = apiError.status || 500; throw err;
}

module.exports = {
  MAX_FILE_SIZE_BYTES,
  enforceFreeTierTokenLimit,
  cleanAndParseJsonResponse,
  analyzeCodeWithGemini,
};
