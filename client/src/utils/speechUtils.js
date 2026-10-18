/**
 * speechUtils.js
 * Builds speech sections from Gemini's code review response.
 */

export function buildExplanationSpeechSections(reviewResult, fileName = 'code file') {
  if (!reviewResult) return [];

  const sections = [];

  // 1. Overview & Summary
  let overviewText = `Code explanation for ${fileName}. `;
  if (reviewResult.language) {
    overviewText += `Language: ${reviewResult.language}. `;
  }
  if (reviewResult.difficulty) {
    overviewText += `Difficulty: ${reviewResult.difficulty}. `;
  }
  if (reviewResult.summary) {
    overviewText += `Here is what this code does: ${reviewResult.summary}`;
  }

  sections.push({
    id: 'summary',
    title: 'Overview & Summary',
    text: overviewText,
  });

  // 2. Real-World Analogy
  if (reviewResult.analogy) {
    sections.push({
      id: 'analogy',
      title: 'Think of It Like This',
      text: `Think of it like this: ${reviewResult.analogy}`,
    });
  }

  // 3. Key Concepts
  if (reviewResult.concepts && reviewResult.concepts.length > 0) {
    const conceptsSummary = reviewResult.concepts
      .map((c, i) => `Concept ${i + 1}: ${c.name}. ${c.explanation}`)
      .join(' ');
    sections.push({
      id: 'concepts',
      title: 'Key Concepts',
      text: `Key concepts used in this code: ${conceptsSummary}`,
    });
  }

  // 4. Step-by-Step Walkthrough
  if (reviewResult.stepByStep && reviewResult.stepByStep.length > 0) {
    const stepsSummary = reviewResult.stepByStep
      .map(s => `Step ${s.step}: ${s.title}, covering ${s.lines}. ${s.explanation}`)
      .join(' ');
    sections.push({
      id: 'steps',
      title: 'Step-by-Step Walkthrough',
      text: `Step-by-step walkthrough: ${stepsSummary}`,
    });
  }

  // 5. Key Terms
  if (reviewResult.keyTerms && reviewResult.keyTerms.length > 0) {
    const termsSummary = reviewResult.keyTerms
      .slice(0, 5) // keep it concise for speech
      .map(t => `${t.term}: ${t.meaning}`)
      .join('. ');
    sections.push({
      id: 'terms',
      title: 'Key Terms',
      text: `Key terms to know: ${termsSummary}`,
    });
  }

  // 6. What You Can Learn
  if (reviewResult.whatYouCanLearn && reviewResult.whatYouCanLearn.length > 0) {
    const learnSummary = reviewResult.whatYouCanLearn.join('. ');
    sections.push({
      id: 'learning',
      title: 'What You Can Learn',
      text: `Key takeaways from this code: ${learnSummary}`,
    });
  }

  return sections;
}
