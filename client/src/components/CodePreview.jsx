import React, { useState } from 'react';
import { Copy, Check, FileCode, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function CodePreview({ code, fileName, extension, isCollapsedDefault = false }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isCollapsedDefault);

  if (!code) return null;

  const lines = code.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden shadow-xl transition-all duration-300"
      style={{ border: `1px solid ${c.border}`, backgroundColor: c.surfaceElevated }}
    >
      {/* Code Header Bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 text-xs"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderBottom: `1px solid ${c.border}` }}
      >
        <div className="flex items-center space-x-2 font-mono" style={{ color: c.textMuted }}>
          <FileCode className="w-4 h-4" style={{ color: c.secondary }} />
          <span className="font-semibold" style={{ color: c.text }}>{fileName || 'source_code'}</span>
          <span style={{ color: c.textDim }}>({lines.length} lines)</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 rounded transition-all text-xs"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${c.border}`,
              color: c.textMuted,
            }}
            title="Copy code"
            onMouseOver={e => e.currentTarget.style.color = c.text}
            onMouseOut={e => e.currentTarget.style.color = c.textMuted}
          >
            {copied ? <Check className="w-3.5 h-3.5" style={{ color: c.highlight }} /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded transition-all text-xs"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${c.border}`,
              color: c.textMuted,
            }}
            onMouseOver={e => e.currentTarget.style.color = c.text}
            onMouseOut={e => e.currentTarget.style.color = c.textMuted}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body with Line Numbers */}
      {isExpanded && (
        <div
          className="max-h-80 overflow-y-auto font-mono text-xs p-4"
          style={{ backgroundColor: c.codeBg, color: c.text }}
        >
          <div className="table w-full border-collapse">
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              return (
                <div key={idx} className="table-row group hover:bg-white/5">
                  <span
                    className="table-cell pr-4 text-right select-none w-10 opacity-50"
                    style={{ color: c.textMuted }}
                  >
                    {lineNum}
                  </span>
                  <span
                    className="table-cell whitespace-pre-wrap break-all"
                    style={{ color: c.text }}
                  >
                    {lineText || ' '}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
