import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, DEFAULT_THEME_ID } from '../utils/themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try {
      const saved = localStorage.getItem('codeunderstander_theme');
      return saved && THEMES[saved] ? saved : DEFAULT_THEME_ID;
    } catch (_) {
      return DEFAULT_THEME_ID;
    }
  });

  const currentTheme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];

  // Apply CSS variables to root whenever theme changes
  useEffect(() => {
    try {
      localStorage.setItem('codeunderstander_theme', themeId);
    } catch (_) {}

    const root = document.documentElement;
    const c = currentTheme.colors;

    root.style.setProperty('--bg', c.bg);
    root.style.setProperty('--bg-secondary', c.bgSecondary);
    root.style.setProperty('--surface', c.surface);
    root.style.setProperty('--surface-elevated', c.surfaceElevated);
    root.style.setProperty('--border', c.border);
    root.style.setProperty('--border-strong', c.borderStrong);
    root.style.setProperty('--primary', c.primary);
    root.style.setProperty('--secondary', c.secondary);
    root.style.setProperty('--accent', c.accent);
    root.style.setProperty('--highlight', c.highlight);
    root.style.setProperty('--text', c.text);
    root.style.setProperty('--text-muted', c.textMuted);
    root.style.setProperty('--text-dim', c.textDim);
    root.style.setProperty('--btn-gradient', c.btnGradient);
    root.style.setProperty('--btn-shadow', c.btnShadow);
    root.style.setProperty('--code-bg', c.codeBg);
    root.style.setProperty('--code-text', c.codeText);

    document.body.style.backgroundColor = c.bg;
    document.body.style.color = c.text;
  }, [currentTheme, themeId]);

  const changeTheme = (id) => {
    if (THEMES[id]) {
      setThemeId(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themeId, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
