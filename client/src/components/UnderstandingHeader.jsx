import React from 'react';
import { BookOpen, Lightbulb, GraduationCap, Clock, FileText, BarChart2, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function UnderstandingHeader({ data }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  if (!data) return null;
  const { language, difficulty, summary, analogy, whatYouCanLearn, wasTruncated, fileName, reviewedAt, lineByLine, stepByStep } = data;

  const difficultyColors = {
    beginner:     { label: 'Beginner',     color: '#22c55e', bars: 1 },
    intermediate: { label: 'Intermediate', color: c.highlight, bars: 2 },
    advanced:     { label: 'Advanced',     color: c.primary,  bars: 3 },
  };

  const diff = difficultyColors[difficulty] || difficultyColors.intermediate;
  const formattedTime = reviewedAt
    ? new Date(reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  // Stats
  const lineCount   = lineByLine?.length  || 0;
  const stepCount   = stepByStep?.length  || 0;
  const readMin     = Math.max(1, Math.ceil(lineCount * 5 / 200));

  const stats = [
    { icon: FileText,  label: 'Lines',      value: lineCount,          color: c.primary   },
    { icon: BarChart2, label: 'Steps',      value: stepCount,          color: c.secondary },
    { icon: Zap,       label: 'Difficulty', value: diff.label,         color: diff.color  },
    { icon: Clock,     label: 'Est. Read',  value: `~${readMin}m`,     color: c.highlight },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Top bar: language + difficulty + filename */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '12px', fontFamily: 'monospace', fontWeight: 600,
            padding: '3px 12px', borderRadius: '999px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: c.highlight, border: `1px solid ${c.border}`,
          }}>{language}</span>

          <span style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', fontWeight: 600,
            padding: '3px 12px', borderRadius: '999px',
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: diff.color, border: `1px solid ${c.border}`,
          }}>
            <span style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3].map(i => (
                <span key={i} style={{
                  display: 'inline-block', width: '6px', height: '12px', borderRadius: '2px',
                  backgroundColor: i <= diff.bars ? diff.color : 'rgba(255,255,255,0.15)',
                }} />
              ))}
            </span>
            {diff.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontFamily: 'monospace', color: c.textMuted }}>
          <Clock style={{ width: '12px', height: '12px' }} />
          <span>{fileName} · {formattedTime}</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            borderRadius: '12px', padding: '14px 10px',
            border: `1px solid ${c.border}`,
            backgroundColor: c.surface,
            textAlign: 'center',
          }}>
            <Icon style={{ width: '16px', height: '16px', color, margin: '0 auto 5px' }} />
            <div style={{ fontSize: '17px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: c.textMuted, marginTop: '3px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Truncation warning */}
      {wasTruncated && (
        <div style={{
          padding: '10px 14px', borderRadius: '12px', fontSize: '12px',
          backgroundColor: 'rgba(255,213,30,0.1)',
          border: '1px solid rgba(255,213,30,0.3)',
          color: '#FFD51E',
        }}>
          ⚠️ File was truncated at 200KB limit. The explanation covers the visible portion.
        </div>
      )}

      {/* Summary card */}
      <div style={{
        borderRadius: '16px', padding: '20px',
        backgroundColor: c.surface, border: `1px solid ${c.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.05em', color: c.textMuted, margin: '0 0 10px',
        }}>
          <BookOpen style={{ width: '15px', height: '15px', color: c.primary }} />
          What This Code Does
        </h3>
        <p style={{ fontSize: '14px', lineHeight: '1.7', color: c.text, margin: 0 }}>{summary}</p>
      </div>

      {/* Analogy */}
      {analogy && (
        <div style={{
          borderRadius: '16px', padding: '20px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: `1px solid ${c.border}`,
        }}>
          <h3 style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: c.secondary, margin: '0 0 10px',
          }}>
            <Lightbulb style={{ width: '15px', height: '15px', color: c.highlight }} />
            Think of It Like This
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: c.text, fontStyle: 'italic', margin: 0 }}>
            &ldquo;{analogy}&rdquo;
          </p>
        </div>
      )}

      {/* What You Can Learn */}
      {whatYouCanLearn?.length > 0 && (
        <div style={{
          borderRadius: '16px', padding: '20px',
          backgroundColor: c.surface, border: `1px solid ${c.border}`,
        }}>
          <h3 style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: c.textMuted, margin: '0 0 12px',
          }}>
            <GraduationCap style={{ width: '15px', height: '15px', color: '#22c55e' }} />
            What You Can Learn From This Code
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {whatYouCanLearn.map((point, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: c.text }}>
                <span style={{ marginTop: '6px', width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, backgroundColor: c.primary }} />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
