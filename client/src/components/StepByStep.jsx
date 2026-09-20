import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function StepByStep({ steps = [] }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!steps.length) return null;

  return (
    <div style={{
      border: `1px solid ${c.border}`,
      borderRadius: '16px',
      backgroundColor: c.surface,
      overflow: 'hidden',
      transition: 'all 0.3s',
    }}>
      {/* Collapsible header */}
      <button
        onClick={() => setIsCollapsed(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderBottom: isCollapsed ? 'none' : `1px solid ${c.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu style={{ width: '16px', height: '16px', color: c.primary }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: c.text }}>Step-by-Step Walkthrough</span>
          <span style={{
            fontSize: '10px', fontFamily: 'monospace', padding: '1px 8px',
            borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.08)',
            color: c.highlight, border: `1px solid ${c.border}`,
          }}>{steps.length} steps</span>
        </div>
        {isCollapsed
          ? <ChevronDown style={{ width: '16px', height: '16px', color: c.textMuted }} />
          : <ChevronUp style={{ width: '16px', height: '16px', color: c.textMuted }} />}
      </button>

      {!isCollapsed && (
        <div style={{ padding: '20px 20px 20px 44px', position: 'relative' }}>
          {/* Vertical timeline */}
          <div style={{
            position: 'absolute',
            left: '29px',
            top: '28px',
            bottom: '28px',
            width: '2px',
            borderRadius: '999px',
            background: `linear-gradient(to bottom, ${c.primary} 0%, ${c.secondary} 50%, transparent 100%)`,
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {steps.map((step) => (
              <div key={step.step} style={{ position: 'relative', display: 'flex', gap: '16px' }}>
                {/* Step circle */}
                <div style={{
                  position: 'absolute',
                  left: '-23px',
                  top: '10px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: c.bg,
                  border: `2px solid ${c.primary}`,
                  boxShadow: `0 0 10px ${c.border}`,
                  zIndex: 1,
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: c.highlight }}>{step.step}</span>
                </div>

                {/* Step content */}
                <div
                  style={{
                    flex: 1,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    border: `1px solid ${c.border}`,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    transition: 'border-color 0.2s',
                    cursor: 'default',
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = c.primary}
                  onMouseOut={e => e.currentTarget.style.borderColor = c.border}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: c.text, margin: 0 }}>{step.title}</h4>
                    {step.lines && (
                      <span style={{
                        flexShrink: 0, fontSize: '11px', fontFamily: 'monospace',
                        padding: '2px 8px', borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: c.highlight, border: `1px solid ${c.border}`,
                      }}>{step.lines}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: '1.6', color: c.text, margin: 0 }}>{step.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
