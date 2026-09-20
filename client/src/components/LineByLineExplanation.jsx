import React, { useState } from 'react';
import { AlignLeft, Search, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
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

export default function LineByLineExplanation({ lineByLine = [], rawCode = '' }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  const [searchTerm, setSearchTerm]   = useState('');
  const [activeLine, setActiveLine]   = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!lineByLine || lineByLine.length === 0) return null;

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
        gap: '10px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  borderRadius: '10px', fontSize: '12px', width: '200px',
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
              const isBlankOrBrace = !item.code || /^\s*[\{\}\(\)\[\];]?\s*$/.test(item.code);

              return (
                <div
                  key={item.lineNumber ?? idx}
                  onClick={() => setActiveLine(isSelected ? null : item.lineNumber)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 20px',
                    borderBottom: idx < filteredLines.length - 1 ? `1px solid ${c.border}` : 'none',
                    borderLeft: isSelected ? `3px solid ${c.primary}` : '3px solid transparent',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseOver={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)'; }}
                  onMouseOut={e  => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
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

                  {/* Explanation + copy */}
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
                      title="Copy line"
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
    </div>
  );
}
