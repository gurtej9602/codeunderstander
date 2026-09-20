import React, { useState } from 'react';
import { History, Trash2, ChevronDown, ChevronRight, RotateCcw, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function HistoryPanel({ history, onRestore, onRemove, onClear }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  const [isOpen, setIsOpen] = useState(false);

  if (!history || history.length === 0) return null;

  const diffColor = {
    beginner: '#22c55e',
    intermediate: c.highlight,
    advanced: c.primary,
  };

  const langEmoji = {
    Java: '☕', Python: '🐍', JavaScript: '🟨', TypeScript: '🔷',
    'React JSX': '⚛️', 'React TSX': '⚛️', 'C++': '⚙️', C: '⚙️',
    Go: '🐹', Rust: '🦀', HTML: '🌐', CSS: '🎨',
    PHP: '🐘', Ruby: '💎', Kotlin: '🟣', Swift: '🍎',
  };

  return (
    <div style={{
      border: `1px solid ${c.border}`,
      borderRadius: '16px',
      backgroundColor: c.surface,
      overflow: 'hidden',
      transition: 'all 0.3s',
    }}>
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: c.text,
          borderBottom: isOpen ? `1px solid ${c.border}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History style={{ width: '15px', height: '15px', color: c.primary }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>Recent Analyses</span>
          <span style={{
            fontSize: '10px', fontFamily: 'monospace',
            padding: '1px 7px', borderRadius: '999px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: c.highlight, border: `1px solid ${c.border}`,
          }}>{history.length}</span>
        </div>
        {isOpen
          ? <ChevronDown style={{ width: '15px', height: '15px', color: c.textMuted }} />
          : <ChevronRight style={{ width: '15px', height: '15px', color: c.textMuted }} />}
      </button>

      {isOpen && (
        <div>
          {history.map((entry, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 18px',
                borderBottom: i < history.length - 1 ? `1px solid ${c.border}` : 'none',
                gap: '8px',
              }}
            >
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px' }}>{langEmoji[entry.language] || '📄'}</span>
                  <span style={{
                    fontSize: '12px', fontWeight: 600, color: c.text,
                    fontFamily: 'monospace', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px',
                  }}>
                    {entry.fileName}
                  </span>
                  <span style={{
                    fontSize: '10px', padding: '1px 6px', borderRadius: '999px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: diffColor[entry.difficulty] || c.highlight,
                    border: `1px solid ${c.border}`,
                  }}>
                    {entry.language}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: c.textMuted, marginTop: '2px' }}>
                  {entry.savedAt} · {entry.lineCount} lines · {entry.difficulty}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => onRestore(entry)}
                  title="Restore this analysis"
                  style={{
                    padding: '5px 9px', borderRadius: '8px',
                    border: `1px solid ${c.border}`,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    cursor: 'pointer', color: c.textMuted,
                    fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                  onMouseOver={e => e.currentTarget.style.color = c.text}
                  onMouseOut={e => e.currentTarget.style.color = c.textMuted}
                >
                  <RotateCcw style={{ width: '11px', height: '11px' }} />
                  <span>Restore</span>
                </button>
                <button
                  onClick={() => onRemove(i)}
                  title="Remove from history"
                  style={{
                    padding: '5px', borderRadius: '8px',
                    border: `1px solid ${c.border}`,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    cursor: 'pointer', color: c.textMuted,
                  }}
                  onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseOut={e => e.currentTarget.style.color = c.textMuted}
                >
                  <X style={{ width: '11px', height: '11px' }} />
                </button>
              </div>
            </div>
          ))}

          {history.length > 1 && (
            <div style={{ padding: '8px 18px', borderTop: `1px solid ${c.border}` }}>
              <button
                onClick={onClear}
                style={{
                  fontSize: '10px', color: c.textDim,
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
                onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={e => e.currentTarget.style.color = c.textDim}
              >
                <Trash2 style={{ width: '11px', height: '11px' }} />
                Clear all history
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
