import React from 'react';
import { Sparkles, ShieldCheck, Zap, Key, ExternalLink } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { useTheme } from '../context/ThemeContext';

export default function Header({ backendHealth, rateLimitCooldown }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-md"
      style={{
        borderBottom: `1px solid ${c.border}`,
        backgroundColor: c.surfaceElevated,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl p-[1px] shadow-lg"
            style={{
              background: c.btnGradient,
              boxShadow: c.btnShadow,
            }}
          >
            <div
              className="w-full h-full rounded-[11px] flex items-center justify-center"
              style={{ backgroundColor: c.bg }}
            >
              <Sparkles className="w-5 h-5" style={{ color: c.primary }} />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight" style={{ color: c.text }}>
                CodeUnderstander
              </span>
              <span
                className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: c.highlight,
                  border: `1px solid ${c.border}`,
                }}
              >
                v1.0
              </span>
            </div>
            <p className="text-xs hidden sm:block" style={{ color: c.textMuted }}>
              AI-Powered Multi-Language Code Explainer
            </p>
          </div>
        </div>

        {/* Right Actions & Badges */}
        <div className="flex items-center space-x-2 sm:space-x-3">

          {/* Theme Selector Dropdown */}
          <ThemeSelector />

          {/* Model Pill */}
          <div
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${c.border}`,
              color: c.textMuted,
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: c.secondary }} />
            <span>gemini-flash-lite-latest</span>
          </div>

          {/* Rate limit status pill */}
          <div
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${c.border}`,
              color: c.text,
            }}
          >
            <Zap
              className={`w-3.5 h-3.5 ${rateLimitCooldown > 0 ? 'animate-spin' : ''}`}
              style={{ color: rateLimitCooldown > 0 ? '#FFD51E' : c.primary }}
            />
            <span>{rateLimitCooldown > 0 ? `Wait: ${rateLimitCooldown}s` : '5s Limit'}</span>
          </div>

          {/* API Key Guide Link */}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            title="Get Gemini API key"
            className="hidden sm:flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg transition-all"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${c.border}`,
              color: c.text,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = c.primary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = c.border;
            }}
          >
            <Key className="w-3.5 h-3.5" style={{ color: '#FFD51E' }} />
            <span>API Key</span>
            <ExternalLink className="w-3 h-3" style={{ color: c.textMuted }} />
          </a>

          {/* Backend Health Dot */}
          <div
            className={`w-2.5 h-2.5 rounded-full ${backendHealth === 'checking' ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor:
                backendHealth === 'healthy'
                  ? '#22c55e'
                  : backendHealth === 'checking'
                  ? '#FFD51E'
                  : '#ef4444',
              boxShadow:
                backendHealth === 'healthy' ? '0 0 6px rgba(34, 197, 94, 0.6)' : 'none',
            }}
            title={`Backend Status: ${backendHealth}`}
          />
        </div>
      </div>
    </header>
  );
}
