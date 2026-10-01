import React, { useState } from 'react';
import {
  AlignLeft, Search, Check, Copy, ChevronDown, ChevronUp,
  Download, Code2, CheckSquare, Square, FileCode, CheckCheck, Eye, X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/** Highlight a search term inside text, returning a React node */
function HighlightMatch({ text, term }) {
  if (!term || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{
        backgroundColor: 'rgba(255, 213, 30, 0.40)',
        color: '#ffffff',
        borderRadius: '3px',
        padding: '0 2px',
        fontWeight: 600,
      }}>
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}

/** Determine comment syntax based on programming language */
function getCommentSyntax(language) {
  const lang = (language || '').toLowerCase();
  if (['python', 'py', 'ruby', 'rb', 'shell', 'bash', 'sh', 'yaml', 'yml', 'perl'].some(l => lang.includes(l))) {
    return { type: 'single', prefix: '# ' };
  }
  if (['html', 'xml', 'svg'].some(l => lang.includes(l))) {
    return { type: 'wrap', start: '<!-- ', end: ' -->' };
  }
  if (['css', 'scss', 'less'].some(l => lang.includes(l))) {
    return { type: 'wrap', start: '/* ', end: ' */' };
  }
  if (['sql'].some(l => lang.includes(l))) {
    return { type: 'single', prefix: '-- ' };
  }
  // Default // for JS, TS, Java, C, C++, C#, Go, Rust, Kotlin, Swift, PHP, etc.
  return { type: 'single', prefix: '// ' };
}

export default function LineByLineExplanation({ lineByLine = [], rawCode = '', language = '', fileName = 'code' }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  const [searchTerm, setSearchTerm]       = useState('');
  const [activeLine, setActiveLine]       = useState(null);
  const [copiedIndex, setCopiedIndex]     = useState(null);
  const [isCollapsed, setIsCollapsed]     = useState(false);

  // Comment insertion & selection states
  const [selectedLines, setSelectedLines] = useState(new Set());
  const [commentStyle, setCommentStyle]   = useState('above'); // 'above' or 'inline'
  const [copiedCommented, setCopiedCommented] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  if (!lineByLine || lineByLine.length === 0) return null;

  const commentSyntax = getCommentSyntax(language);

  // Toggle single line selection
  const handleToggleLine = (lineNum) => {
    setSelectedLines(prev => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  // Toggle Select All
  const handleToggleSelectAll = () => {
    if (selectedLines.size === lineByLine.length) {
      setSelectedLines(new Set());
    } else {
      setSelectedLines(new Set(lineByLine.map(l => l.lineNumber)));
    }
  };

  // Select only non-blank lines
  const handleSelectMeaningful = () => {
    const nonBlank = lineByLine.filter(l => {
      const trim = (l.code || '').trim();
      return trim && !/^[{}()\[\];,]+$/.test(trim);
    });
    setSelectedLines(new Set(nonBlank.map(l => l.lineNumber)));
  };

  // Build code with comments embedded
  const generateCommentedCode = () => {
    // If user has specific lines selected, comment only those; otherwise comment all lines
    const targetSet = selectedLines.size > 0
      ? selectedLines
      : new Set(lineByLine.map(l => l.lineNumber));

    return lineByLine.map(item => {
      const code = item.code ?? '';
      const hasExplanation = item.explanation && item.explanation.trim();
      const shouldComment = targetSet.has(item.lineNumber) && hasExplanation && code.trim().length > 0;

      if (!shouldComment) {
        return code;
      }

      const commentBody = commentSyntax.type === 'wrap'
        ? `${commentSyntax.start}${item.explanation}${commentSyntax.end}`
        : `${commentSyntax.prefix}${item.explanation}`;

      if (commentStyle === 'inline') {
        const indentMatch = code.match(/^(\s*)/);
        return `${code}  ${commentBody}`;
      } else {
        // Place comment on line above, preserving code indentation
        const indent = (code.match(/^(\s*)/) || [''])[0];
        return `${indent}${commentBody}\n${code}`;
      }
    }).join('\n');
  };

  // Copy commented code to clipboard
  const handleCopyCommentedCode = async () => {
    try {
      const text = generateCommentedCode();
      await navigator.clipboard.writeText(text);
      setCopiedCommented(true);
      setTimeout(() => setCopiedCommented(false), 2200);
    } catch (e) {
      console.error('Failed to copy commented code:', e);
    }
  };

  // Download commented code file
  const handleDownloadCommentedCode = () => {
    const text = generateCommentedCode();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'txt';
    a.download = `${baseName}.commented.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLines = lineByLine.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(item.lineNumber).includes(term) ||
      (item.code || '').toLowerCase().includes(term) ||
      (item.explanation || '').toLowerCase().includes(term)
    );
  });

  const handleCopyLine = async (idx, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (e) {
      console.error('Failed to copy line:', e);
    }
  };

  return (
    <div style={{
      border: `1px solid ${c.border}`,
      borderRadius: '16px',
      backgroundColor: c.surface,
      overflow: 'hidden',
      transition: 'all 0.3s',
    }}>

      {/* Header toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '14px 20px',
        borderBottom: isCollapsed ? 'none' : `1px solid ${c.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlignLeft style={{ width: '16px', height: '16px', color: c.primary }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: c.text }}>Line-by-Line Code Breakdown</span>
          <span style={{
            fontSize: '10px', fontFamily: 'monospace', padding: '1px 8px',
            borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.08)',
            color: c.highlight, border: `1px solid ${c.border}`,
          }}>{lineByLine.length} lines</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search — only shown when expanded */}
          {!isCollapsed && (
            <div style={{ position: 'relative' }}>
              <Search style={{
                width: '13px', height: '13px',
                position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)',
                color: c.textMuted, pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Search line # or keyword…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '28px', paddingRight: '10px',
                  paddingTop: '6px', paddingBottom: '6px',
                  borderRadius: '10px', fontSize: '12px', width: '180px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${c.border}`,
                  color: c.text, outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e  => e.currentTarget.style.borderColor = c.primary}
                onBlur={e   => e.currentTarget.style.borderColor = c.border}
              />
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(o => !o)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            style={{
              padding: '6px', borderRadius: '8px', background: 'transparent',
              border: `1px solid ${c.border}`, cursor: 'pointer',
              color: c.textMuted, display: 'flex', alignItems: 'center',
            }}
          >
            {isCollapsed
              ? <ChevronDown style={{ width: '14px', height: '14px' }} />
              : <ChevronUp   style={{ width: '14px', height: '14px' }} />}
          </button>
        </div>
      </div>

      {/* Comment Insertion Action Bar (When expanded) */}
      {!isCollapsed && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '10px 20px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderBottom: `1px solid ${c.border}`,
          fontSize: '12px',
        }}>
          {/* Selection controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleToggleSelectAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '4px 9px', borderRadius: '6px',
                border: `1px solid ${c.border}`,
                backgroundColor: selectedLines.size === lineByLine.length ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: c.text, fontSize: '11px', cursor: 'pointer',
              }}
            >
              {selectedLines.size === lineByLine.length ? (
                <CheckSquare style={{ width: '13px', height: '13px', color: c.highlight }} />
              ) : (
                <Square style={{ width: '13px', height: '13px', color: c.textMuted }} />
              )}
              <span>{selectedLines.size > 0 ? `${selectedLines.size}/${lineByLine.length} lines` : 'Select All'}</span>
            </button>

            {selectedLines.size > 0 && (
              <button
                onClick={() => setSelectedLines(new Set())}
                style={{
                  fontSize: '11px', color: c.textMuted, background: 'none',
                  border: 'none', cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                Clear selection
              </button>
            )}

            <button
              onClick={handleSelectMeaningful}
              title="Select code lines excluding empty lines and braces"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 9px', borderRadius: '6px',
                border: `1px solid ${c.border}`, backgroundColor: 'transparent',
                color: c.textMuted, fontSize: '11px', cursor: 'pointer',
              }}
              onMouseOver={e => e.currentTarget.style.color = c.text}
              onMouseOut={e => e.currentTarget.style.color = c.textMuted}
            >
              <CheckCheck style={{ width: '12px', height: '12px', color: c.primary }} />
              <span>Select Code Lines Only</span>
            </button>
          </div>

          {/* Comment generation buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Placement option */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: c.textMuted }}>Position:</span>
              <select
                value={commentStyle}
                onChange={e => setCommentStyle(e.target.value)}
                style={{
                  padding: '3px 8px', borderRadius: '6px',
                  backgroundColor: 'rgba(0,0,0,0.35)', border: `1px solid ${c.border}`,
                  color: c.text, fontSize: '11px', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="above">Above Line (// comment)</option>
                <option value="inline">Inline (code // comment)</option>
              </select>
            </div>

            {/* Preview button */}
            <button
              onClick={() => setShowPreviewModal(true)}
              title="Preview code with injected comments"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: '8px',
                border: `1px solid ${c.border}`,
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: c.text, fontSize: '11px', cursor: 'pointer',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = c.primary}
              onMouseOut={e => e.currentTarget.style.borderColor = c.border}
            >
              <Eye style={{ width: '12px', height: '12px', color: c.highlight }} />
              <span>Preview</span>
            </button>

            {/* Copy commented code */}
            <button
              onClick={handleCopyCommentedCode}
              title="Copy original code with line explanations added as comments"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '8px',
                border: 'none',
                background: c.btnGradient,
                boxShadow: c.btnShadow,
                color: '#ffffff', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s, transform 0.1s',
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.92'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              {copiedCommented ? (
                <>
                  <Check style={{ width: '13px', height: '13px', color: '#ffffff' }} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Code2 style={{ width: '13px', height: '13px' }} />
                  <span>Copy Code with Comments</span>
                </>
              )}
            </button>

            {/* Download commented file */}
            <button
              onClick={handleDownloadCommentedCode}
              title="Download source code file with comments added"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '5px 10px', borderRadius: '8px',
                border: `1px solid ${c.border}`,
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: c.text, fontSize: '11px', cursor: 'pointer',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.color = c.highlight; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text; }}
            >
              <Download style={{ width: '12px', height: '12px' }} />
              <span>Download File</span>
            </button>
          </div>
        </div>
      )}

      {/* Lines */}
      {!isCollapsed && (
        <div style={{ maxHeight: '640px', overflowY: 'auto' }}>
          {filteredLines.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: c.textMuted }}>
              No lines match &ldquo;{searchTerm}&rdquo;
            </div>
          ) : (
            filteredLines.map((item, idx) => {
              const isSelected    = activeLine === item.lineNumber;
              const isChecked     = selectedLines.has(item.lineNumber);
              const isBlankOrBrace = !item.code || /^\s*[\{\}\(\)\[\];]?\s*$/.test(item.code);

              return (
                <div
                  key={item.lineNumber ?? idx}
                  onClick={() => setActiveLine(isSelected ? null : item.lineNumber)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 16px',
                    borderBottom: idx < filteredLines.length - 1 ? `1px solid ${c.border}` : 'none',
                    borderLeft: isSelected ? `3px solid ${c.primary}` : '3px solid transparent',
                    backgroundColor: isChecked
                      ? 'rgba(56, 189, 248, 0.05)'
                      : isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseOver={e => { if (!isSelected && !isChecked) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)'; }}
                  onMouseOut={e  => { if (!isSelected && !isChecked) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* Line Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLine(item.lineNumber);
                    }}
                    title={isChecked ? 'Deselect line for commenting' : 'Select line to include comments'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      color: isChecked ? c.highlight : c.textMuted,
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {isChecked ? (
                      <CheckSquare style={{ width: '15px', height: '15px', color: c.highlight }} />
                    ) : (
                      <Square style={{ width: '15px', height: '15px' }} />
                    )}
                  </button>

                  {/* Line number pill */}
                  <span style={{
                    flexShrink: 0, fontSize: '11px', fontFamily: 'monospace', fontWeight: 700,
                    padding: '2px 7px', borderRadius: '6px',
                    minWidth: '36px', textAlign: 'center',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                    color: isSelected ? c.highlight : c.textMuted,
                    border: `1px solid ${isSelected ? c.primary : c.border}`,
                    transition: 'all 0.15s',
                  }}>
                    L{item.lineNumber}
                  </span>

                  {/* Code snippet */}
                  <div style={{
                    flexShrink: 0, width: '38%',
                    borderRadius: '8px', padding: '5px 10px',
                    backgroundColor: c.codeBg, border: `1px solid ${c.border}`,
                    fontFamily: 'monospace', fontSize: '11px',
                    color: c.codeText, overflowX: 'auto', whiteSpace: 'pre',
                  }}>
                    <HighlightMatch text={item.code || ' '} term={searchTerm} />
                  </div>

                  {/* Explanation + single-line copy */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <p style={{
                      fontSize: '12px', lineHeight: '1.65', margin: 0,
                      color: isBlankOrBrace ? c.textMuted : c.text,
                      fontStyle: isBlankOrBrace ? 'italic' : 'normal',
                      fontWeight: isSelected ? 600 : 400,
                    }}>
                      <HighlightMatch text={item.explanation || ''} term={searchTerm} />
                    </p>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleCopyLine(idx, `${item.code} // L${item.lineNumber}: ${item.explanation}`);
                      }}
                      title="Copy line with explanation"
                      style={{
                        padding: '4px', borderRadius: '6px', background: 'transparent',
                        border: 'none', cursor: 'pointer', flexShrink: 0, color: c.textMuted,
                      }}
                      onMouseOver={e => e.currentTarget.style.color = c.text}
                      onMouseOut={e  => e.currentTarget.style.color = c.textMuted}
                    >
                      {copiedIndex === idx
                        ? <Check style={{ width: '13px', height: '13px', color: c.highlight }} />
                        : <Copy  style={{ width: '13px', height: '13px' }} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Preview Commented Code Modal */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}
        onClick={() => setShowPreviewModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '860px',
              maxHeight: '85vh',
              backgroundColor: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: `1px solid ${c.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode style={{ width: '18px', height: '18px', color: c.primary }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: c.text }}>
                  Preview Commented Code
                </span>
                <span style={{
                  fontSize: '11px', fontFamily: 'monospace', padding: '2px 8px',
                  borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.08)',
                  color: c.highlight, border: `1px solid ${c.border}`
                }}>
                  {selectedLines.size > 0 ? `${selectedLines.size} commented lines` : 'All lines commented'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleCopyCommentedCode}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: c.btnGradient, border: 'none',
                    color: '#ffffff', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {copiedCommented ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                  <span>{copiedCommented ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={handleDownloadCommentedCode}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '6px 12px', borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${c.border}`,
                    color: c.text, fontSize: '11px', cursor: 'pointer'
                  }}
                >
                  <Download style={{ width: '13px', height: '13px' }} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    padding: '6px', borderRadius: '8px', background: 'transparent',
                    border: 'none', color: c.textMuted, cursor: 'pointer'
                  }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: c.codeBg }}>
              <pre style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                color: c.codeText,
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {generateCommentedCode()}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
