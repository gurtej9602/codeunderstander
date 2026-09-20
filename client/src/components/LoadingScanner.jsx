import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, ShieldAlert, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ANALYSIS_STEPS = [
  { text: 'Reading the code structure and identifying patterns...', icon: Cpu },
  { text: 'Routing to language-specific explanation engine...', icon: Sparkles },
  { text: 'Building step-by-step walkthrough and finding key concepts...', icon: ShieldAlert },
  { text: 'Writing plain-English explanation and real-world analogy...', icon: Check },
];

export default function LoadingScanner({ language }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentStep(p => (p + 1) % ANALYSIS_STEPS.length), 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden transition-all duration-300"
      style={{
        border: `1px solid ${c.border}`,
        backgroundColor: c.surfaceElevated,
      }}
    >
      {/* Animated top gradient bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 animate-pulse"
        style={{ background: c.radarGlow }}
      />

      <div className="max-w-md mx-auto space-y-6">
        {/* Scanner ring */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{ border: `2px solid ${c.border}` }}
          />
          <div
            className="absolute inset-2 rounded-full border-2 border-dashed animate-spin"
            style={{ borderColor: c.primary, animationDuration: '6s' }}
          />
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-inner"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${c.border}`,
            }}
          >
            <Sparkles className="w-6 h-6 animate-pulse" style={{ color: c.primary }} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold" style={{ color: c.text }}>
            Understanding {language || 'Code'} with Gemini…
          </h3>
          <p className="text-xs mt-1" style={{ color: c.textMuted }}>
            Building plain-English explanation, step-by-step walkthrough &amp; analogies
          </p>
        </div>

        {/* Step ticker */}
        <div
          className="rounded-xl p-3 text-left"
          style={{
            backgroundColor: c.codeBg,
            border: `1px solid ${c.border}`,
          }}
        >
          <div className="flex items-center space-x-2 text-xs font-mono" style={{ color: c.highlight }}>
            {React.createElement(ANALYSIS_STEPS[currentStep].icon, {
              className: 'w-4 h-4 shrink-0 animate-bounce',
              style: { color: c.primary },
            })}
            <span className="truncate">{ANALYSIS_STEPS[currentStep].text}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div
            className="h-full rounded-full w-3/4 animate-pulse"
            style={{ background: c.btnGradient }}
          />
        </div>

        <p className="text-[11px]" style={{ color: c.textDim }}>
          Respecting Gemini API limits. Explanation will be ready in seconds.
        </p>
      </div>
    </div>
  );
}
