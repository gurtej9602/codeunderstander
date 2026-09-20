const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');
const { analyzeCodeWithGemini } = require('./services/geminiService');

async function testLiveExplanation() {
  console.log('Testing live Gemini explanation of code...');
  console.log('Using API Key prefix:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(0, 6) + '...' : 'NONE');

  const javaFilePath = path.join(__dirname, '..', 'samples', 'Sample.java');
  const sampleJavaCode = fs.readFileSync(javaFilePath, 'utf8');

  try {
    const startTime = Date.now();
    const result = await analyzeCodeWithGemini(sampleJavaCode, '.java');
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n=== LIVE GEMINI EXPLANATION SUCCEEDED IN ${elapsed}s ===`);
    console.log('Language      :', result.language);
    console.log('Difficulty    :', result.difficulty);
    console.log('Summary       :', result.summary);
    console.log('Analogy       :', result.analogy);
    console.log(`Concepts (${result.concepts.length}):`);
    result.concepts.forEach(c => console.log(`  - ${c.name}: ${c.explanation}`));
    console.log(`Steps (${result.stepByStep.length}):`);
    result.stepByStep.forEach(s => console.log(`  Step ${s.step} [${s.lines}]: ${s.title}`));
    if (result.lineByLine && result.lineByLine.length) {
      console.log(`\nLine-by-Line Breakdown (${result.lineByLine.length} lines):`);
      result.lineByLine.slice(0, 10).forEach(l => console.log(`  L${l.lineNumber}: ${l.code} -> ${l.explanation}`));
      if (result.lineByLine.length > 10) {
        console.log(`  ... and ${result.lineByLine.length - 10} more lines explained!`);
      }
    }
    console.log(`\nKey Terms (${result.keyTerms.length}):`);
    result.keyTerms.forEach(t => console.log(`  \`${t.term}\`: ${t.meaning}`));
    console.log('Learn:', result.whatYouCanLearn);
    console.log('==================================================\n');
  } catch (err) {
    console.error('LIVE TEST FAILED:');
    console.error('Status Code:', err.statusCode);
    console.error('Message:', err.message);
    process.exit(1);
  }
}

testLiveExplanation();
