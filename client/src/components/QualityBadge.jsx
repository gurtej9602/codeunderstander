import React from 'react';

export default function QualityBadge({ score }) {
  const numericScore = typeof score === 'number' ? score : parseFloat(score) || 0;
  const clampedScore = Math.min(10, Math.max(0, numericScore));

  // Determine color scheme based on score out of 10
  let theme = {
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    bgColor: 'bg-rose-500/10',
    strokeColor: '#f43f5e',
    label: 'Needs Major Refactoring',
    grade: 'C'
  };

  if (clampedScore >= 8.0) {
    theme = {
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      bgColor: 'bg-emerald-500/10',
      strokeColor: '#10b981',
      label: 'Production Ready & Clean',
      grade: 'A'
    };
  } else if (clampedScore >= 5.0) {
    theme = {
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      bgColor: 'bg-amber-500/10',
      strokeColor: '#f59e0b',
      label: 'Adequate with Moderate Issues',
      grade: 'B'
    };
  }

  // Calculate SVG circular stroke offset
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 10) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${theme.borderColor} ${theme.bgColor} text-center relative overflow-hidden`}>
      {/* Score gauge circle */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="text-slate-800"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={theme.strokeColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold font-mono tracking-tight ${theme.textColor}`}>
            {clampedScore.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            out of 10
          </span>
        </div>
      </div>

      {/* Label and Grade */}
      <div className="mt-3">
        <div className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-200">
          Grade {theme.grade} • {theme.label}
        </div>
      </div>
    </div>
  );
}
