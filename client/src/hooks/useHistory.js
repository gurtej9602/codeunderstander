/**
 * useHistory.js
 * Persists the last 5 code analysis results in localStorage.
 */
import { useState } from 'react';

const HISTORY_KEY = 'codeunderstander_history';
const MAX_HISTORY = 5;

export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = (entry) => {
    setHistory(prev => {
      // Avoid exact duplicate (same fileName & savedAt)
      const isDup = prev.some(h => h.fileName === entry.fileName && h.savedAt === entry.savedAt);
      if (isDup) return prev;
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const removeFromHistory = (index) => {
    setHistory(prev => {
      const next = prev.filter((_, i) => i !== index);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  };

  return { history, addToHistory, removeFromHistory, clearHistory };
}
