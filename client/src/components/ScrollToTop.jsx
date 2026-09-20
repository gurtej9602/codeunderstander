import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ScrollToTop() {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title="Back to top"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 50,
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: c.btnGradient,
        boxShadow: c.btnShadow,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.9,
        transition: 'transform 0.2s, opacity 0.2s',
      }}
      onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.opacity = '1'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '0.9'; }}
    >
      <ArrowUp style={{ width: '20px', height: '20px', color: '#ffffff' }} />
    </button>
  );
}
