import React, { useState } from 'react';
import { Layers, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function Section({ icon: Icon, title, badge, isOpen, onToggle, children, iconColor }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  return (
    <div style={{
      border: `1px solid ${c.border}`,
      borderRadius: '16px',
      backgroundColor: c.surface,
      overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 20px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          borderBottom: isOpen ? `1px solid ${c.border}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon style={{ width: '16px', height: '16px', color: iconColor || c.primary }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: c.text }}>{title}</span>
          {badge !== undefined && (
            <span style={{
              fontSize: '10px', fontFamily: 'monospace', padding: '1px 8px',
              borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.08)',
              color: c.highlight, border: `1px solid ${c.border}`,
            }}>{badge}</span>
          )}
        </div>
        {isOpen
          ? <ChevronUp style={{ width: '16px', height: '16px', color: c.textMuted }} />
          : <ChevronDown style={{ width: '16px', height: '16px', color: c.textMuted }} />}
      </button>
      {isOpen && <div style={{ padding: '16px 20px' }}>{children}</div>}
    </div>
  );
}

export default function ConceptCards({ concepts = [], keyTerms = [] }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  const [conceptsOpen, setConceptsOpen] = useState(true);
  const [termsOpen, setTermsOpen] = useState(true);

  if (!concepts.length && !keyTerms.length) return null;

  const conceptPalettes = [
    { titleColor: c.primary },
    { titleColor: c.secondary },
    { titleColor: c.highlight },
    { titleColor: c.accent },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {concepts.length > 0 && (
        <Section
          icon={Layers}
          title="Key Concepts Used"
          badge={concepts.length}
          isOpen={conceptsOpen}
          onToggle={() => setConceptsOpen(o => !o)}
          iconColor={c.primary}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '12px',
          }}>
            {concepts.map((concept, i) => {
              const pal = conceptPalettes[i % conceptPalettes.length];
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: '12px', padding: '14px',
                    border: `1px solid ${c.border}`,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = pal.titleColor}
                  onMouseOut={e => e.currentTarget.style.borderColor = c.border}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', color: pal.titleColor, marginBottom: '6px' }}>
                    {concept.name}
                  </div>
                  <p style={{ fontSize: '12px', lineHeight: '1.6', color: c.text, margin: 0 }}>
                    {concept.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {keyTerms.length > 0 && (
        <Section
          icon={Tag}
          title="Key Terms & Identifiers"
          badge={keyTerms.length}
          isOpen={termsOpen}
          onToggle={() => setTermsOpen(o => !o)}
          iconColor={c.highlight}
        >
          <div>
            {keyTerms.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '16px',
                  padding: '10px 0',
                  borderBottom: i < keyTerms.length - 1 ? `1px solid ${c.border}` : 'none',
                }}
              >
                <code style={{
                  flexShrink: 0, fontSize: '11px', fontFamily: 'monospace',
                  fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: c.highlight, border: `1px solid ${c.border}`,
                  marginTop: '2px',
                }}>{item.term}</code>
                <p style={{ fontSize: '13px', lineHeight: '1.4', color: c.text, margin: 0 }}>{item.meaning}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
