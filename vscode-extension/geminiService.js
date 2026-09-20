/**
 * geminiService.js — CodeUnderstander VS Code Extension
 *
 * Standalone Gemini REST client with:
 *  - Model failover pool
 *  - Chunked line-by-line fetching for 100% line coverage
 *  - Smart contextual fallbacks for missed lines
 */

const { buildExplainPrompt, getPromptConfig } = require('./promptTemplates');

const MODEL_POOL = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

const LINES_PER_CHUNK = 60; // Max lines per chunk request

// ─────────────────────────────────────────────────────────────────────────────
// Smart fallback explanations
// ─────────────────────────────────────────────────────────────────────────────

function generateContextualFallback(lineText, lineNum) {
  const raw  = lineText ?? '';
  const trim = raw.trim();

  if (!trim) return 'Blank line — visual spacing between code sections.';

  if (/^[{}()\[\];,]+$/.test(trim)) {
    if (trim === '{')  return 'Opens a new code block.';
    if (trim === '}')  return 'Closes the preceding code block.';
    if (trim === '};') return 'Closes the block and ends the statement.';
    if (trim === ');') return 'Ends the current statement or function call.';
    return 'Structural punctuation — closes or delimits a code block.';
  }

  if (/^(import|#include|using|require|from)\b/.test(trim))
    return 'Imports a required library, module, or package for use in this file.';
  if (/^(package|namespace)\s+/.test(trim))
    return 'Declares the package or namespace that organises this file.';
  if (/^\/\//.test(trim))  return 'Single-line developer comment — describes what the nearby code does.';
  if (/^#/.test(trim))     return 'Comment line — provides a human-readable note for developers.';
  if (/^\/\*/.test(trim))  return 'Start of a block comment.';
  if (/^\*/.test(trim))    return 'Part of a block or JSDoc comment.';
  if (/^return\b/.test(trim)) return 'Returns a value or exits the current function.';
  if (/^(throw|raise)\b/.test(trim)) return 'Throws an exception or error when something goes wrong.';
  if (/^(System\.out|console\.|print|printf|println|echo|puts)\b/.test(trim))
    return 'Outputs a value or message to the console or screen.';
  if (/^(var|let|const|int|float|double|string|boolean|char|long)\s+/.test(trim))
    return 'Declares and possibly initialises a variable.';
  if (/^(public|private|protected|static|async|def|func|fn|fun)\b/.test(trim))
    return 'Declares a function or method with its parameters and return type.';
  if (/^(if|else if|else|switch)\b/.test(trim))
    return 'Conditional statement — executes code only when a specific condition is met.';
  if (/^(for|while|do|foreach)\b/.test(trim))
    return 'Loop — repeats a block of code multiple times.';
  if (/^(try|catch|finally)\b/.test(trim))
    return 'Error-handling block — catches exceptions and allows graceful recovery.';
  if (/^[@#!]/.test(trim))
    return 'Annotation or decorator that modifies the behaviour of the next declaration.';

  return `Executes a program statement (line ${lineNum}).`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reconcile: merge AI output + fill 100% of lines
// ─────────────────────────────────────────────────────────────────────────────

function reconcileAllLines(rawLineByLine, originalCode, startLine = 1) {
  const fileLines  = (originalCode || '').split('\n');
  const totalLines = fileLines.length;

  const geminiMap = new Map();
  if (Array.isArray(rawLineByLine)) {
    for (const item of rawLineByLine) {
      if (!item) continue;
      const num = typeof item.lineNumber === 'number'
        ? item.lineNumber
        : parseInt(item.lineNumber, 10);
      if (!isNaN(num)) geminiMap.set(num, item);
    }
  }

  const result = [];
  for (let idx = 0; idx < totalLines; idx++) {
    const lineNum   = startLine + idx;
    const verbatim  = fileLines[idx];
    const ai        = geminiMap.get(lineNum);
    if (ai && ai.explanation && ai.explanation.trim()) {
      result.push({ lineNumber: lineNum, code: verbatim, explanation: ai.explanation.trim() });
    } else {
      result.push({ lineNumber: lineNum, code: verbatim, explanation: generateContextualFallback(verbatim, lineNum) });
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw REST call to Gemini
// ─────────────────────────────────────────────────────────────────────────────

async function callGeminiRest(apiKey, promptText) {
  let lastError = null;
  for (const model of MODEL_POOL) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature:      0.15,
            maxOutputTokens:  8192,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Quota exceeded. Please wait a minute.');
        if (response.status === 401 || response.status === 403) throw new Error('Invalid API key.');
        if (response.status === 503) { lastError = new Error(`${model} overloaded (503)`); continue; }
        throw new Error(`HTTP ${response.status}`);
      }

      const data    = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error(`Empty response from ${model}`);
      return rawText;
    } catch (err) {
      lastError = err;
      if (/quota|API key|Invalid/i.test(err.message)) throw err;
    }
  }
  throw lastError || new Error('All Gemini models failed.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse raw JSON text safely
// ─────────────────────────────────────────────────────────────────────────────

function parseJson(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  if (cleaned.endsWith('```'))   cleaned = cleaned.replace(/\s*```$/, '');
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/[\[{][\s\S]*/);
    if (m) {
      // Try to find closing bracket
      const arr = cleaned.match(/\[[\s\S]*\]/);
      const obj = cleaned.match(/\{[\s\S]*\}/);
      if (arr) try { return JSON.parse(arr[0]); } catch {}
      if (obj) try { return JSON.parse(obj[0]); } catch {}
    }
    throw new Error('Could not parse AI response as JSON');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chunk prompt for missing lines
// ─────────────────────────────────────────────────────────────────────────────

function buildChunkPrompt(fileLines, startLine, endLine, languageName, docStartLine) {
  const slice = fileLines
    .slice(startLine - docStartLine, endLine - docStartLine + 1)
    .map((line, i) => `${startLine + i} | ${line}`)
    .join('\n');

  return `You are explaining ${languageName} code line by line.

Below is a numbered slice (lines ${startLine} to ${endLine}).
Return ONLY a raw JSON array — NO markdown, NO backticks, NO extra text.
The array must have EXACTLY ${endLine - startLine + 1} items, one per line, in order.

Format:
[
  { "lineNumber": ${startLine}, "code": "...", "explanation": "..." },
  ...
  { "lineNumber": ${endLine},   "code": "...", "explanation": "..." }
]

Rules:
- Blank lines → "Blank line for visual spacing."
- Closing braces → explain what block they close.
- 1-2 clear sentences per line.

CODE SLICE:
\`\`\`${languageName.toLowerCase()}
${slice}
\`\`\``;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch missing lines in chunks
// ─────────────────────────────────────────────────────────────────────────────

async function fetchMissingChunks(apiKey, fileLines, missingNums, languageName, docStartLine) {
  if (!missingNums.length) return [];

  // Group into ranges (allow ≤5 gap so we don't over-fragment)
  const ranges = [];
  let start = missingNums[0], end = missingNums[0];
  for (let i = 1; i < missingNums.length; i++) {
    if (missingNums[i] <= end + 5) { end = missingNums[i]; }
    else { ranges.push({ start, end }); start = missingNums[i]; end = missingNums[i]; }
  }
  ranges.push({ start, end });

  // Split into chunks of LINES_PER_CHUNK
  const chunks = [];
  for (const { start, end } of ranges) {
    for (let s = start; s <= end; s += LINES_PER_CHUNK) {
      chunks.push({ start: s, end: Math.min(s + LINES_PER_CHUNK - 1, end) });
    }
  }

  const recovered = [];
  for (const { start, end } of chunks) {
    try {
      const prompt  = buildChunkPrompt(fileLines, start, end, languageName, docStartLine);
      const rawText = await callGeminiRest(apiKey, prompt);
      let parsed;
      try {
        parsed = parseJson(rawText);
        // If it's an object with an array inside, extract the array
        if (!Array.isArray(parsed) && typeof parsed === 'object') {
          const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
          if (key) parsed = parsed[key];
        }
      } catch {
        continue;
      }
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.lineNumber && item.explanation) recovered.push(item);
        }
      }
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.warn(`Chunk ${start}-${end} failed:`, err.message);
    }
  }
  return recovered;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

async function explainCode(apiKey, code, extension, startLine = 1) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API key is not set. Configure it in CodeUnderstander settings.');
  }

  const promptConfig = getPromptConfig(extension);
  const prompt       = buildExplainPrompt(extension, code, startLine);
  const fileLines    = code.split('\n');
  const totalLines   = fileLines.length;

  // 1. Main call
  let rawText;
  try {
    rawText = await callGeminiRest(apiKey, prompt);
  } catch (err) {
    throw err;
  }

  // 2. Parse
  let parsed;
  try {
    parsed = parseJson(rawText);
  } catch {
    parsed = {};
  }

  // 3. Build initial lineByLine array
  let lineByLine = Array.isArray(parsed.lineByLine) ? parsed.lineByLine : [];

  // 4. Find missing lines
  const coveredSet = new Set();
  for (const item of lineByLine) {
    const n = typeof item.lineNumber === 'number' ? item.lineNumber : parseInt(item.lineNumber, 10);
    if (!isNaN(n)) coveredSet.add(n);
  }
  const missingNums = [];
  for (let n = startLine; n < startLine + totalLines; n++) {
    if (!coveredSet.has(n)) missingNums.push(n);
  }

  // 5. Fetch missing in chunks
  if (missingNums.length > 0) {
    const recovered = await fetchMissingChunks(apiKey, fileLines, missingNums, promptConfig.languageName, startLine);
    lineByLine = [...lineByLine, ...recovered];
  }

  // 6. Reconcile & finalise
  const finalLineByLine = reconcileAllLines(lineByLine, code, startLine);

  return {
    language:         promptConfig.languageName,
    difficulty:       ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty?.toLowerCase())
                        ? parsed.difficulty.toLowerCase()
                        : 'intermediate',
    summary:          parsed.summary || 'Code explanation completed.',
    analogy:          parsed.analogy || '',
    concepts:         Array.isArray(parsed.concepts)        ? parsed.concepts        : [],
    stepByStep:       Array.isArray(parsed.stepByStep)      ? parsed.stepByStep      : [],
    lineByLine:       finalLineByLine,
    keyTerms:         Array.isArray(parsed.keyTerms)        ? parsed.keyTerms        : [],
    whatYouCanLearn:  Array.isArray(parsed.whatYouCanLearn) ? parsed.whatYouCanLearn : [],
  };
}

module.exports = { explainCode, MODEL_POOL };
