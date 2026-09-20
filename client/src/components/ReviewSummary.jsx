import React from 'react';
import { BookOpen, AlertTriangle, ShieldCheck, Clock, FileText } from 'lucide-react';
import QualityBadge from './QualityBadge';

export default function ReviewSummary({ reviewData }) {
  if (!reviewData) return null;

  const {
    language,
    qualityScore,
    summary,
    issuesCount,
    issues = [],
    wasTruncated,
    fileName,
    reviewedAt
  } = reviewData;

  const highCount = issues.filter(i => i.severity === 'high').length;
  const medCount = issues.filter(i => i.severity === 'medium').length;
  const lowCount = issues.filter(i => i.severity === 'low').length;

  const formattedDate = reviewedAt
    ? new Date(reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Quality Score Radial Badge */}
      <div className="md:col-span-1">
        <QualityBadge score={qualityScore} />
      </div>

      {/* Summary Card and Metrics */}
      <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col justify-between shadow-xl">
        <div>
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {language || 'Source'} Audit
              </span>
              <span className="text-xs text-slate-400 font-mono truncate max-w-[180px]">
                {fileName}
              </span>
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Truncation Warning if >200KB */}
          {wasTruncated && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>File content was truncated at 200KB limit.</span>
            </div>
          )}

          {/* Executive Summary */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Executive Summary</span>
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">
              {summary}
            </p>
          </div>
        </div>

        {/* Severity Metrics Breakdown Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Total Issues</span>
            <span className="text-lg font-bold font-mono text-slate-100">{issuesCount || issues.length}</span>
          </div>

          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs text-rose-400 block">High</span>
            <span className="text-lg font-bold font-mono text-rose-300">{highCount}</span>
          </div>

          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs text-amber-400 block">Medium</span>
            <span className="text-lg font-bold font-mono text-amber-300">{medCount}</span>
          </div>

          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs text-blue-400 block">Low</span>
            <span className="text-lg font-bold font-mono text-blue-300">{lowCount}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
