/**
 * webviewView.js
 * 
 * Generates the rich interactive HTML view for CodeUnderstander inside VS Code.
 * Highly polished for maximum readability and vibrant contrast across all dark & light themes.
 */

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getWebviewContent(result, fileName, themeMode = 'auto', meta = {}) {
  const { language, difficulty, summary, analogy, concepts, stepByStep, lineByLine, keyTerms, whatYouCanLearn } = result;
  const { isSelection = false, startLine = 1, totalDocLines = lineByLine?.length || 0 } = meta;

  const diffColors = {
    beginner: { label: 'Beginner', color: '#4ade80', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.3)' },
    intermediate: { label: 'Intermediate', color: '#ffd51e', bg: 'rgba(255,213,30,0.15)', border: 'rgba(255,213,30,0.3)' },
    advanced: { label: 'Advanced', color: '#ff467a', bg: 'rgba(255,70,122,0.15)', border: 'rgba(255,70,122,0.3)' }
  };
  const diff = diffColors[difficulty] || diffColors.intermediate;

  const linesCount = lineByLine ? lineByLine.length : 0;
  const endLine = startLine + linesCount - 1;

  // Vibrant palette for concept cards to guarantee crisp readability in any dark theme
  const conceptColors = ['#38bdf8', '#ff467a', '#ffd51e', '#c084fc', '#4ade80', '#fb923c'];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeUnderstander</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background, #0d1117);
      --card-bg: var(--vscode-sideBar-background, #161b22);
      --text: var(--vscode-editor-foreground, #f8fafc);
      --text-muted: var(--vscode-descriptionForeground, #cbd5e1);
      --border: var(--vscode-widget-border, rgba(255, 255, 255, 0.15));
      --cyan: #38bdf8;
      --pink: #ff467a;
      --yellow: #ffd51e;
      --purple: #c084fc;
      --green: #4ade80;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      line-height: 1.6;
      padding: 18px 22px 50px;
    }

    /* Header Bar */
    .header-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-family: monospace;
      font-weight: 600;
    }
    .badge-lang {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.35);
    }
    .badge-diff {
      background: ${diff.bg};
      color: ${diff.color};
      border: 1px solid ${diff.border};
    }

    /* Scope Banner */
    .scope-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 16px;
      font-size: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
    }
    .scope-banner.selection {
      background: rgba(255, 213, 30, 0.1);
      border-color: rgba(255, 213, 30, 0.35);
      color: #ffd51e;
    }

    /* Cards */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 16px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
    }
    .card-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Analogy Box */
    .analogy-box {
      background: rgba(192, 132, 252, 0.12);
      border: 1px solid rgba(192, 132, 252, 0.35);
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 16px;
    }
    .analogy-title {
      color: #c084fc;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .analogy-text {
      font-style: italic;
      color: var(--text);
      font-size: 13px;
      line-height: 1.6;
    }

    /* Steps */
    .step-item {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }
    .step-num {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--card-bg);
      border: 2px solid #38bdf8;
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .step-content {
      flex: 1;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 16px;
    }
    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .step-lines {
      font-family: monospace;
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      color: #ffd51e;
      border: 1px solid var(--border);
    }

    /* Line by line */
    .search-box {
      width: 100%;
      padding: 9px 14px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-size: 12px;
      margin-bottom: 12px;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-box:focus {
      border-color: #38bdf8;
    }
    .line-table {
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .line-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 11px 14px;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
      cursor: pointer;
    }
    .line-row:last-child { border-bottom: none; }
    .line-row:hover { background: rgba(255, 255, 255, 0.05); }
    .line-row.active {
      background: rgba(56, 189, 248, 0.12);
      border-left: 3px solid #38bdf8;
    }
    .line-num {
      font-family: monospace;
      font-size: 11px;
      font-weight: 700;
      color: #ffd51e;
      background: rgba(255, 213, 30, 0.14);
      border: 1px solid rgba(255, 213, 30, 0.35);
      padding: 2px 7px;
      border-radius: 5px;
      min-width: 42px;
      text-align: center;
      flex-shrink: 0;
    }
    .line-code {
      width: 38%;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 5px 9px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px;
      color: #7dd3fc;
      overflow-x: auto;
      white-space: pre;
      flex-shrink: 0;
    }
    .line-expl {
      flex: 1;
      font-size: 12px;
      color: #f8fafc;
      line-height: 1.6;
    }

    /* Key Concepts Cards - High-Contrast Vibrant Styling */
    .concept-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 12px;
    }
    .concept-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 16px;
      transition: transform 0.15s, border-color 0.2s;
    }
    .concept-card:hover {
      transform: translateY(-2px);
    }
    .concept-name {
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 6px;
      letter-spacing: 0.01em;
    }
    .concept-desc {
      font-size: 12px;
      color: #f8fafc;
      line-height: 1.6;
    }

    /* Key Terms */
    .term-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }
    .term-row:last-child { border-bottom: none; }
    .term-badge {
      font-family: monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 5px;
      background: rgba(255, 213, 30, 0.14);
      color: #ffd51e;
      border: 1px solid rgba(255, 213, 30, 0.35);
      flex-shrink: 0;
      margin-top: 1px;
    }
    .term-meaning {
      font-size: 12px;
      color: #f8fafc;
      line-height: 1.5;
    }

    /* Action bar */
    .action-bar {
      display: flex;
      gap: 10px;
      margin-top: 22px;
      flex-wrap: wrap;
    }
    .btn {
      padding: 8px 14px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.08);
      color: #f8fafc;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .btn:hover {
      border-color: #38bdf8;
      color: #38bdf8;
    }
    .btn-sm {
      padding: 4px 10px;
      font-size: 11px;
    }
    .btn-primary {
      background: #0284c7;
      color: #ffffff;
      border-color: transparent;
    }
    .btn-primary:hover {
      background: #0369a1;
      color: #ffffff;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-bar">
    <div class="brand-title">
      <span>✨ CodeUnderstander</span>
      <span class="badge badge-lang">${escapeHtml(language)}</span>
      <span class="badge badge-diff">${escapeHtml(diff.label)}</span>
    </div>
    <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">
      ${escapeHtml(fileName)} • ${linesCount} lines explained
    </div>
  </div>

  <!-- Scope Banner -->
  ${isSelection ? `
  <div class="scope-banner selection">
    <div>
      <strong>📌 Selection Explanation:</strong> Showing lines <code>L${startLine}</code> to <code>L${endLine}</code> (${linesCount} lines)
    </div>
    <button class="btn btn-sm btn-primary" onclick="explainEntireFile()">
      📄 Explain Entire File (${totalDocLines} lines)
    </button>
  </div>
  ` : `
  <div class="scope-banner">
    <div>
      <strong>📄 Entire File:</strong> All ${linesCount} lines explained sequentially (L${startLine} to L${endLine})
    </div>
    <span style="font-size: 11px; color: #4ade80; font-weight: 600;">✓ 100% Coverage</span>
  </div>
  `}

  <!-- Summary -->
  <div class="card">
    <div class="card-title">📖 What This Code Does</div>
    <p style="color: #f8fafc; font-size: 13px; line-height: 1.7;">${escapeHtml(summary)}</p>
  </div>

  <!-- Analogy -->
  ${analogy ? `
  <div class="analogy-box">
    <div class="analogy-title">💡 Think of It Like This</div>
    <div class="analogy-text">&ldquo;${escapeHtml(analogy)}&rdquo;</div>
  </div>
  ` : ''}

  <!-- Step by Step -->
  ${stepByStep && stepByStep.length ? `
  <div class="card">
    <div class="card-title">⚡ Step-by-Step Walkthrough</div>
    <div>
      ${stepByStep.map(s => `
        <div class="step-item">
          <div class="step-num">${s.step}</div>
          <div class="step-content">
            <div class="step-header">
              <strong style="font-size: 13px; color: #f8fafc;">${escapeHtml(s.title)}</strong>
              <span class="step-lines">${escapeHtml(s.lines || '')}</span>
            </div>
            <p style="font-size: 12px; color: #f8fafc; line-height: 1.6;">${escapeHtml(s.explanation)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- Line by Line Breakdown -->
  ${lineByLine && lineByLine.length ? `
  <div class="card">
    <div class="card-title" style="justify-content: space-between;">
      <span>🔍 Line-by-Line Breakdown (${lineByLine.length} Lines)</span>
      <span style="font-size: 10px; text-transform: none; color: var(--text-muted);">Click line to jump in editor</span>
    </div>
    <input
      type="text"
      class="search-box"
      id="lineSearch"
      placeholder="Search by line # or keyword..."
      oninput="filterLines(this.value)"
    />
    <div class="line-table" id="lineTable">
      ${lineByLine.map(item => `
        <div class="line-row" data-line="${item.lineNumber}" onclick="jumpToLine(${item.lineNumber})">
          <div class="line-num">L${item.lineNumber}</div>
          <div class="line-code">${escapeHtml(item.code || ' ')}</div>
          <div class="line-expl">${escapeHtml(item.explanation || '')}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- Key Concepts -->
  ${concepts && concepts.length ? `
  <div class="card">
    <div class="card-title">🧠 Key Concepts Used (${concepts.length})</div>
    <div class="concept-grid">
      ${concepts.map((c, i) => {
        const clr = conceptColors[i % conceptColors.length];
        return `
        <div class="concept-card" style="border-left: 3px solid ${clr};">
          <div class="concept-name" style="color: ${clr}; font-weight: 700; font-size: 13px; margin-bottom: 6px;">
            ${escapeHtml(c.name)}
          </div>
          <div class="concept-desc">${escapeHtml(c.explanation)}</div>
        </div>
        `;
      }).join('')}
    </div>
  </div>
  ` : ''}

  <!-- Key Terms -->
  ${keyTerms && keyTerms.length ? `
  <div class="card">
    <div class="card-title">🏷️ Key Terms & Identifiers (${keyTerms.length})</div>
    <div>
      ${keyTerms.map(t => `
        <div class="term-row">
          <code class="term-badge">${escapeHtml(t.term)}</code>
          <span class="term-meaning">${escapeHtml(t.meaning)}</span>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- Action Bar -->
  <div class="action-bar">
    <button class="btn btn-primary" onclick="copyMarkdown()">📋 Copy as Markdown</button>
    ${isSelection ? `<button class="btn" onclick="explainEntireFile()">📄 Explain Entire File</button>` : ''}
    <button class="btn" onclick="explainAgain()">🔄 Refresh Explanation</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function jumpToLine(line) {
      document.querySelectorAll('.line-row').forEach(el => el.classList.remove('active'));
      const target = document.querySelector(\`[data-line="\${line}"]\`);
      if (target) target.classList.add('active');
      vscode.postMessage({ command: 'jumpToLine', line: line });
    }

    function filterLines(query) {
      const q = query.toLowerCase().trim();
      const rows = document.querySelectorAll('.line-row');
      rows.forEach(r => {
        const text = r.innerText.toLowerCase();
        r.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
      });
    }

    function copyMarkdown() {
      vscode.postMessage({ command: 'copyMarkdown' });
    }

    function explainAgain() {
      vscode.postMessage({ command: 'explainAgain' });
    }

    function explainEntireFile() {
      vscode.postMessage({ command: 'explainEntireFile' });
    }
  </script>
</body>
</html>`;
}

module.exports = {
  getWebviewContent,
  escapeHtml
};
