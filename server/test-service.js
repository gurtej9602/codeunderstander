const { enforceFreeTierTokenLimit, cleanAndParseJsonResponse } = require('./services/geminiService');
const { buildReviewPrompt, getSupportedExtensions } = require('./config/promptTemplates');

console.log('--- RUNNING CODEUNDERSTANDER UNIT CHECKS ---');

// 1. Truncation test (> 200KB)
const largeString = 'x'.repeat(250 * 1024);
const truncResult = enforceFreeTierTokenLimit(largeString);
console.log('1. Truncation Test (>200KB):', truncResult.wasTruncated ? 'PASS' : 'FAIL');

// 2. Markdown fence stripping test
const fenceJson = '```json\n{\n  "summary": "Sample clean code.",\n  "qualityScore": 8.5,\n  "issues": []\n}\n```';
const parsed = cleanAndParseJsonResponse(fenceJson);
console.log('2. Markdown Code Fence Stripping:', parsed.qualityScore === 8.5 ? 'PASS' : 'FAIL');

// 3. Prompt routing verification
const extensions = ['.java', '.py', '.js', '.cpp', '.html', '.css'];
for (const ext of extensions) {
  const routed = buildReviewPrompt(ext, 'sample code');
  console.log(`3. Prompt Router [${ext} -> ${routed.language}]:`, routed.fullPrompt.length > 100 ? 'PASS' : 'FAIL');
}

console.log('4. Supported Extensions List:', getSupportedExtensions().join(', '));
console.log('--- ALL UNIT VERIFICATIONS COMPLETE ---');
