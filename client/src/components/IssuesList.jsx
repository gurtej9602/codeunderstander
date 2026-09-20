import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Copy, Check, Filter } from 'lucide-react';

export default function IssuesList({ issues = [] }) {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const filteredIssues = issues.filter(issue => {
    if (filterSeverity === 'all') return true;
    return issue.severity === filterSeverity;
  });

  const handleCopySuggestion = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to copy suggestion:', e);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="uppercase">High</span>
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="uppercase">Medium</span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Info className="w-3.5 h-3.5" />
            <span className="uppercase">Low</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Issues Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <span>Detected Findings</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Review actionable recommendations ordered by code location and severity
          </p>
        </div>

        {/* Severity Filter Buttons */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
          {['all', 'high', 'medium', 'low'].map((sev) => {
            const count = sev === 'all' ? issues.length : issues.filter(i => i.severity === sev).length;
            return (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                  filterSeverity === sev
                    ? 'bg-cyan-500 text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {sev} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* No Issues Found State */}
      {filteredIssues.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-200">No issues found for this filter!</h4>
          <p className="text-xs text-slate-400 mt-1">
            {filterSeverity === 'all'
              ? 'Your code appears clean according to current domain checks.'
              : `No ${filterSeverity}-severity findings detected.`}
          </p>
        </div>
      )}

      {/* Issue Cards */}
      <div className="space-y-3">
        {filteredIssues.map((issue) => (
          <div
            key={issue.id}
            className="rounded-xl border border-slate-800/80 bg-slate-900/70 hover:bg-slate-900 transition-all p-5 shadow-sm hover:border-slate-700"
          >
            {/* Top row: Line + Severity */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  {issue.line > 0 ? `Line ${issue.line}` : 'File Scope'}
                </span>
                {getSeverityBadge(issue.severity)}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-200 font-medium leading-snug">
              {issue.description}
            </p>

            {/* Suggested Fix Box */}
            {issue.suggestion && (
              <div className="mt-3 rounded-lg bg-slate-950/80 border border-slate-800/90 p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 mb-1.5">
                  <span className="flex items-center space-x-1">
                    <span>Suggested Fix:</span>
                  </span>
                  <button
                    onClick={() => handleCopySuggestion(issue.id, issue.suggestion)}
                    className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors text-[11px]"
                    title="Copy suggestion"
                  >
                    {copiedId === issue.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {issue.suggestion}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}
