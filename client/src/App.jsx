import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import CodePreview from './components/CodePreview';
import LoadingScanner from './components/LoadingScanner';
import UnderstandingHeader from './components/UnderstandingHeader';
import StepByStep from './components/StepByStep';
import ConceptCards from './components/ConceptCards';
import LineByLineExplanation from './components/LineByLineExplanation';
import ErrorAlert from './components/ErrorAlert';
import ScrollToTop from './components/ScrollToTop';
import HistoryPanel from './components/HistoryPanel';
import { useTheme } from './context/ThemeContext';
import { useHistory } from './hooks/useHistory';
import { Brain, ArrowRight, RotateCcw, Download, Copy, Check, Shield } from 'lucide-react';

const THROTTLE_SECONDS = 5;

export default function App() {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  const { history, addToHistory, removeFromHistory, clearHistory } = useHistory();

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [fileError, setFileError] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [autoRetryIn, setAutoRetryIn] = useState(0);
  const [backendHealth, setBackendHealth] = useState('checking');
  const [isCopiedMarkdown, setIsCopiedMarkdown] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setBackendHealth(d.status === 'healthy' ? 'healthy' : 'unhealthy'))
      .catch(() => setBackendHealth('offline'));
  }, []);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const id = setInterval(() => setCooldownRemaining(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldownRemaining]);

  useEffect(() => {
    if (autoRetryIn <= 0) return;
    if (autoRetryIn === 1) {
      const t = setTimeout(() => { setAutoRetryIn(0); handleExplainCode(); }, 1000);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => setAutoRetryIn(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [autoRetryIn]);

  // ⌨️ Keyboard shortcut: press Enter to analyze
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'button') return;
        if (fileContent && !reviewResult && !isLoading && cooldownRemaining === 0) {
          handleExplainCode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileContent, reviewResult, isLoading, cooldownRemaining]);

  const handleExplainCode = async () => {
    if (!fileContent || !selectedFile) { setFileError('Please upload or select a code file first.'); return; }
    if (cooldownRemaining > 0) return;
    setIsLoading(true);
    setApiError(null);
    setReviewResult(null);
    setCooldownRemaining(THROTTLE_SECONDS);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fileContent, extension: selectedFile.extension, fileName: selectedFile.name })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        const err = { status: res.status, message: result.error || 'Failed to understand the code.', isRateLimit: res.status === 429 || result.isRateLimit, isApiKeyMissing: res.status === 401 || result.isApiKeyMissing, isHighDemand: res.status === 503 };
        if (res.status === 503) { setApiError(err); setCooldownRemaining(10); setAutoRetryIn(10); return; }
        setApiError(err); return;
      }
      setReviewResult(result.data);
      // Save to history
      const now = new Date();
      addToHistory({
        fileName: selectedFile.name,
        language: result.data.language,
        difficulty: result.data.difficulty,
        lineCount: result.data.lineByLine?.length || 0,
        savedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        result: result.data,
        fileContent,
        fileExtension: selectedFile.extension,
      });
    } catch {
      setApiError({ status: 500, message: 'Could not connect to the backend server. Make sure it is running on http://localhost:5000' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null); setFileContent(''); setDetectedLanguage('');
    setFileError(null); setReviewResult(null); setApiError(null);
    setAutoRetryIn(0); setCooldownRemaining(0);
  };

  const handleRestoreHistory = (entry) => {
    setSelectedFile({ name: entry.fileName, size: 0, extension: entry.fileExtension, isSample: false });
    setFileContent(entry.fileContent);
    setDetectedLanguage(entry.language);
    setReviewResult(entry.result);
    setApiError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildMarkdown = () => {
    if (!reviewResult) return '';
    const { language, difficulty, summary, analogy, concepts, stepByStep, lineByLine, keyTerms, whatYouCanLearn } = reviewResult;
    const lbl = lineByLine?.length
      ? `\n## Line-by-Line Breakdown\n` + lineByLine.map(l => `- **L${l.lineNumber}**: \`${l.code}\` — ${l.explanation}`).join('\n')
      : '';
    return `# Code Explanation: ${selectedFile?.name}\n**Language**: ${language} | **Difficulty**: ${difficulty}\n\n## What This Code Does\n${summary}\n\n## Think of It Like This\n${analogy}\n\n## Key Concepts\n${concepts.map(c => `- **${c.name}**: ${c.explanation}`).join('\n')}\n\n## Step-by-Step Walkthrough\n${stepByStep.map(s => `### Step ${s.step}: ${s.title} (${s.lines})\n${s.explanation}`).join('\n\n')}\n${lbl}\n\n## Key Terms\n${keyTerms.map(t => `- \`${t.term}\`: ${t.meaning}`).join('\n')}\n\n## What You Can Learn\n${whatYouCanLearn.map(p => `- ${p}`).join('\n')}\n`;
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown());
      setIsCopiedMarkdown(true);
      setTimeout(() => setIsCopiedMarkdown(false), 2000);
    } catch (e) { console.error(e); }
  };

  const handleDownloadMarkdown = () => {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `explanation-${selectedFile?.name || 'code'}.md`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (!reviewResult) return;
    const blob = new Blob([JSON.stringify(reviewResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `explanation-${selectedFile?.name || 'code'}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: c.bg, color: c.text }}>

      <Header backendHealth={backendHealth} rateLimitCooldown={cooldownRemaining} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-mono"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: c.border, color: c.highlight }}>
            <Brain className="w-3.5 h-3.5" style={{ color: c.primary }} />
            <span>Powered by Gemini · Explains Any Code in Plain English</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: c.text }}>
            Understand Any Code File Instantly
          </h1>
          <p className="text-sm sm:text-base" style={{ color: c.textMuted }}>
            Upload a code file and get a plain-English breakdown — step-by-step walkthrough, key concepts explained, real-world analogies, and a line-by-line breakdown.
          </p>
        </div>

        {/* Upload Card */}
        <section className="rounded-3xl border p-6 sm:p-8 shadow-2xl space-y-6 transition-all duration-300"
          style={{ backgroundColor: c.surface, borderColor: c.border, backdropFilter: 'blur(16px)' }}>

          <DropZone
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            fileContent={fileContent}
            setFileContent={setFileContent}
            detectedLanguage={detectedLanguage}
            setDetectedLanguage={setDetectedLanguage}
            fileError={fileError}
            setFileError={setFileError}
            disabled={isLoading}
            isAnalyzed={Boolean(reviewResult)}
            onClear={() => { setReviewResult(null); setApiError(null); setAutoRetryIn(0); setCooldownRemaining(0); }}
          />

          {fileContent && !reviewResult && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.textMuted }}>Code Preview</span>
              <CodePreview code={fileContent} fileName={selectedFile?.name} extension={selectedFile?.extension} isCollapsedDefault={false} />
            </div>
          )}

          {fileContent && !reviewResult && !isLoading && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center space-x-2 text-xs" style={{ color: c.textMuted }}>
                <Shield className="w-4 h-4" style={{ color: c.primary }} />
                <span>
                  Protected · 5s cooldown · 200KB limit · Press{' '}
                  <kbd style={{
                    padding: '1px 6px', borderRadius: '4px',
                    border: `1px solid ${c.border}`,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    fontSize: '10px', fontFamily: 'monospace'
                  }}>Enter</kbd>
                  {' '}to analyze
                </span>
              </div>
              <button
                type="button"
                onClick={handleExplainCode}
                disabled={isLoading || cooldownRemaining > 0}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
                  cooldownRemaining > 0 ? 'cursor-not-allowed opacity-60' : 'hover:scale-[1.02]'
                }`}
                style={cooldownRemaining > 0
                  ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: c.textMuted, border: `1px solid ${c.border}` }
                  : { background: c.btnGradient, color: '#ffffff', boxShadow: c.btnShadow }
                }
              >
                {cooldownRemaining > 0 ? (
                  <span>Wait {cooldownRemaining}s…</span>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Explain This Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {isLoading && <LoadingScanner language={detectedLanguage} />}

        {apiError && <ErrorAlert error={apiError} onRetry={handleExplainCode} />}

        {autoRetryIn > 0 && (
          <div className="flex items-center justify-center space-x-3 p-3 rounded-xl text-sm"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: `1px solid ${c.border}`, color: c.highlight }}>
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: c.primary, borderTopColor: 'transparent' }} />
            <span>Auto-retrying in <strong style={{ color: c.highlight }}>{autoRetryIn}s</strong> — Gemini is warming up…</span>
          </div>
        )}

        {/* History Panel */}
        {history.length > 0 && !reviewResult && (
          <HistoryPanel
            history={history}
            onRestore={handleRestoreHistory}
            onRemove={removeFromHistory}
            onClear={clearHistory}
          />
        )}

        {reviewResult && (
          <section className="space-y-6 pt-2">

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl"
              style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: c.highlight }} />
                <span className="text-sm font-semibold" style={{ color: c.text }}>Explanation Complete</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: c.textMuted, border: `1px solid ${c.border}` }}>
                  {reviewResult.lineByLine?.length || 0} lines · {reviewResult.stepByStep?.length || 0} steps
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleCopyMarkdown}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: c.text, border: `1px solid ${c.border}` }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.color = c.highlight; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text; }}>
                  {isCopiedMarkdown ? <Check className="w-3.5 h-3.5" style={{ color: c.highlight }} /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedMarkdown ? 'Copied!' : 'Copy .md'}</span>
                </button>
                <button onClick={handleDownloadMarkdown}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: c.text, border: `1px solid ${c.border}` }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.color = c.highlight; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text; }}>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
                <button onClick={handleDownloadJson}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: c.text, border: `1px solid ${c.border}` }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.color = c.highlight; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text; }}>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
                <button onClick={handleReset}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.10)', color: c.highlight, border: `1px solid ${c.border}` }}
                  onMouseOver={e => e.currentTarget.style.borderColor = c.primary}
                  onMouseOut={e => e.currentTarget.style.borderColor = c.border}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Explain Another File</span>
                </button>
              </div>
            </div>

            <UnderstandingHeader data={{ ...reviewResult, fileName: selectedFile?.name }} />
            <StepByStep steps={reviewResult.stepByStep} />
            <LineByLineExplanation lineByLine={reviewResult.lineByLine} rawCode={fileContent} />
            <ConceptCards concepts={reviewResult.concepts} keyTerms={reviewResult.keyTerms} />

            {/* History Panel after results */}
            {history.length > 1 && (
              <HistoryPanel
                history={history}
                onRestore={handleRestoreHistory}
                onRemove={removeFromHistory}
                onClear={clearHistory}
              />
            )}

          </section>
        )}

      </main>

      <footer className="py-6 mt-12 text-center text-xs transition-colors duration-300"
        style={{ borderTop: `1px solid ${c.border}`, backgroundColor: c.bgSecondary, color: c.textMuted }}>
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p><strong style={{ color: c.text }}>CodeUnderstander</strong> — Explains code in plain English.</p>
          <p style={{ color: c.textMuted, fontSize: '11px' }}>
            Theme: {currentTheme.name} ({currentTheme.tag}) · 16 languages · Press <kbd style={{ padding: '0 4px', borderRadius: '3px', border: `1px solid ${c.border}`, fontFamily: 'monospace' }}>Enter</kbd> to analyze
          </p>
        </div>
      </footer>

      <ScrollToTop />

    </div>
  );
}
