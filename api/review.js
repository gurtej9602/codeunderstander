/**
 * api/review.js — Vercel Serverless Function
 * POST /api/review
 *
 * Ports the full Express geminiService logic into a single serverless function.
 * API key is set once as a Vercel environment variable (GEMINI_API_KEY).
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MODEL_POOL = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

const MAX_FILE_SIZE_BYTES = 200 * 1024;
const LINES_PER_CHUNK = 60;

// ─── Helpers ────────────────────────────────────────────────────────────────

function enforceLimit(content) {
  if (!content) return { sanitizedContent: '', wasTruncated: false };
  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > MAX_FILE_SIZE_BYTES) {
    return {
      sanitizedContent: content.slice(0, MAX_FILE_SIZE_BYTES) + '\n/* [truncated at 200KB] */',
      wasTruncated: true,
    };
  }
  return { sanitizedContent: content, wasTruncated: false };
}

function parseJson(raw) {
  if (!raw) throw new Error('Empty response from Gemini');
  let s = raw.trim();
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(s); } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Could not parse JSON from AI response');
  }
}

function getLanguage(ext) {
  const map = {
    '.java': 'Java', '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript',
    '.jsx': 'React JSX', '.tsx': 'React TSX', '.cpp': 'C++', '.c': 'C',
    '.go': 'Go', '.rs': 'Rust', '.html': 'HTML', '.css': 'CSS',
    '.php': 'PHP', '.rb': 'Ruby', '.kt': 'Kotlin', '.swift': 'Swift',
  };
  return map[ext?.toLowerCase()] || 'Generic';
}

function fallback(lineText, lineNum) {
  const t = (lineText ?? '').trim();
  if (!t) return 'Blank line for visual spacing.';
  if (/^[{}()\[\];,]+$/.test(t)) {
    if (t === '{') return 'Opens a new code block.';
    if (t === '}') return 'Closes the preceding code block.';
    return 'Structural punctuation that delimits a block or statement.';
  }
  if (/^\s*(\/\/|#|\/\*|\*|<!--|--|;;\s*$)/.test(t)) return 'Comment — developer note, not executed.';
  if (/\b(import|require|using|include|from)\b/.test(t)) return 'Import statement — loads an external module or library.';
  if (/\b(class|interface|enum|struct)\b/.test(t)) return 'Defines a new type or data structure.';
  if (/\b(function|def|func|fn|sub|method|void|public|private|protected|static)\b/.test(t)) return 'Declares a function or method.';
  if (/\b(if|else|elif|switch|case|when)\b/.test(t)) return 'Conditional logic — controls which code path runs.';
  if (/\b(for|while|do|loop|foreach|each)\b/.test(t)) return 'Loop — repeats a block of code.';
  if (/\b(return|yield)\b/.test(t)) return 'Returns a value from the current function.';
  if (/\b(const|let|var|val|int|string|bool|float|double|long)\b/.test(t)) return 'Variable declaration — stores a value in memory.';
  if (/\b(try|catch|finally|throw|throws|raise|except)\b/.test(t)) return 'Error handling — manages exceptions gracefully.';
  if (/\b(new|create|make|build)\b/.test(t)) return 'Creates a new instance of an object.';
  if (/\b(print|log|console|System\.out|printf|echo|puts)\b/.test(t)) return 'Outputs a value for debugging or display.';
  return `Line ${lineNum}: executes a code instruction in this block.`;
}

function reconcile(lines, codeLines) {
  const map = {};
  for (const item of lines) if (item.lineNumber) map[item.lineNumber] = item;
  const result = [];
  for (let i = 1; i <= codeLines.length; i++) {
    result.push({
      lineNumber: i,
      code: codeLines[i - 1],
      explanation: map[i]?.explanation || fallback(codeLines[i - 1], i),
    });
  }
  return result;
}

// ─── Gemini REST call ────────────────────────────────────────────────────────

async function callGemini(prompt, schema) {
  for (const model of MODEL_POOL) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          ...(schema ? { responseSchema: schema } : {}),
        },
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 429 || res.status === 503) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      return parseJson(text);
    } catch { continue; }
  }
  throw new Error('All Gemini models failed or are rate limited');
}

// ─── Main analysis prompt ────────────────────────────────────────────────────

function buildPrompt(code, language, fileName, codeLines) {
  return `You are an expert ${language} educator. Analyze this code and return ONLY valid JSON.

FILE: ${fileName}
LANGUAGE: ${language}
LINES: ${codeLines.length}

CODE:
\`\`\`${language}
${code}
\`\`\`

Return this exact JSON structure:
{
  "language": "${language}",
  "difficulty": "beginner|intermediate|advanced",
  "summary": "2-3 sentence plain-English description of what this code does",
  "analogy": "one creative real-world analogy",
  "concepts": [{"name": "...", "explanation": "..."}],
  "stepByStep": [{"step": 1, "title": "...", "lines": "L1-L5", "explanation": "..."}],
  "lineByLine": [{"lineNumber": 1, "explanation": "..."}, ...],
  "keyTerms": [{"term": "...", "meaning": "..."}],
  "whatYouCanLearn": ["..."]
}

STRICT RULES FOR lineByLine:
- You MUST include EVERY line from 1 to ${codeLines.length} — no gaps allowed.
- lineNumber must be an integer starting at 1.
- Do NOT include a "code" field — only lineNumber and explanation.
- Each explanation must be meaningful (not just "code line").`;
}

function buildChunkPrompt(code, language, startLine, lines) {
  const numbered = lines.map((l, i) => `${startLine + i}: ${l}`).join('\n');
  return `Explain each of these ${language} code lines. Return ONLY JSON array.
Lines ${startLine} to ${startLine + lines.length - 1}:
\`\`\`
${numbered}
\`\`\`
Return: [{"lineNumber": ${startLine}, "explanation": "..."}, ...]
Include ALL lines ${startLine} to ${startLine + lines.length - 1}. No gaps.`;
}

// ─── Fetch missing lines in chunks ──────────────────────────────────────────

async function fetchMissingChunks(codeLines, presentNums, language) {
  const missing = [];
  for (let i = 1; i <= codeLines.length; i++) {
    if (!presentNums.has(i)) missing.push(i);
  }
  if (missing.length === 0) return [];

  const extras = [];
  // Group consecutive missing lines into chunks
  let start = missing[0];
  let group = [missing[0]];
  for (let i = 1; i <= missing.length; i++) {
    if (i < missing.length && missing[i] === missing[i - 1] + 1) {
      group.push(missing[i]);
    } else {
      // Split group into LINES_PER_CHUNK batches
      for (let j = 0; j < group.length; j += LINES_PER_CHUNK) {
        const batch = group.slice(j, j + LINES_PER_CHUNK);
        const batchLines = batch.map(n => codeLines[n - 1]);
        try {
          const result = await callGemini(buildChunkPrompt(batchLines.join('\n'), language, batch[0], batchLines));
          if (Array.isArray(result)) extras.push(...result);
          else if (result?.lineByLine) extras.push(...result.lineByLine);
        } catch { /* fallback will cover */ }
      }
      if (i < missing.length) { start = missing[i]; group = [missing[i]]; }
    }
  }
  return extras;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ success: false, error: 'Method not allowed' }); return; }

  if (!GEMINI_API_KEY) {
    return res.status(401).json({ success: false, error: 'GEMINI_API_KEY not configured', isApiKeyMissing: true });
  }

  const { code, extension, fileName = 'unknown' } = req.body || {};
  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, error: 'No code provided' });
  }

  const { sanitizedContent, wasTruncated } = enforceLimit(code);
  const codeLines = sanitizedContent.split('\n');
  const language = getLanguage(extension);

  try {
    // ── Main analysis call ──
    const prompt = buildPrompt(sanitizedContent, language, fileName, codeLines);
    const result = await callGemini(prompt);

    // ── Guarantee 100% line coverage ──
    const lineByLine = Array.isArray(result.lineByLine) ? result.lineByLine : [];
    const presentNums = new Set(lineByLine.map(l => l.lineNumber));
    const missing = codeLines.length - presentNums.size;

    let allLines = [...lineByLine];
    if (missing > 0) {
      const extras = await fetchMissingChunks(codeLines, presentNums, language);
      allLines = [...allLines, ...extras];
    }

    const finalLines = reconcile(allLines, codeLines);

    const response = {
      language: result.language || language,
      difficulty: result.difficulty || 'intermediate',
      summary: result.summary || 'Code analysis complete.',
      analogy: result.analogy || '',
      concepts: Array.isArray(result.concepts) ? result.concepts : [],
      stepByStep: Array.isArray(result.stepByStep) ? result.stepByStep : [],
      lineByLine: finalLines,
      keyTerms: Array.isArray(result.keyTerms) ? result.keyTerms : [],
      whatYouCanLearn: Array.isArray(result.whatYouCanLearn) ? result.whatYouCanLearn : [],
      wasTruncated,
      fileName,
      reviewedAt: new Date().toISOString(),
    };

    console.log(`[Vercel] ${fileName} | ${language} | ${finalLines.length}/${codeLines.length} lines`);
    return res.status(200).json({ success: true, data: response });

  } catch (err) {
    console.error('[Vercel] Analysis error:', err.message);
    const isRateLimit = err.message?.includes('rate') || err.message?.includes('429');
    return res.status(isRateLimit ? 429 : 500).json({
      success: false,
      error: isRateLimit ? 'Rate limit hit. Please wait a moment and try again.' : err.message,
      isRateLimit,
    });
  }
};
