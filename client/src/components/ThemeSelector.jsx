import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSelector() {
  const { currentTheme, themeId, changeTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const c = currentTheme.colors;
  const themeList = Object.values(themes);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm"
        style={{
          backgroundColor: c.surface,
          border: `1px solid ${c.border}`,
          color: c.text,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = c.primary;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = c.border;
        }}
        title="Change theme palette"
      >
        <Palette className="w-3.5 h-3.5" style={{ color: c.primary }} />
        <span className="hidden md:inline font-semibold">{currentTheme.name}</span>

        {/* Color Dots Pill */}
        <div className="flex items-center space-x-0.5">
          {currentTheme.preview.map((hex, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full inline-block border"
              style={{ backgroundColor: hex, borderColor: 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>

        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: c.textMuted }}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl z-50 p-2 border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          style={{
            backgroundColor: c.surfaceElevated,
            borderColor: c.border,
            boxShadow: `0 20px 45px -10px ${c.bgSecondary}`,
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b mb-1 flex items-center justify-between" style={{ borderColor: c.border }}>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>
              Color Themes
            </p>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: c.highlight,
                border: `1px solid ${c.border}`,
              }}
            >
              {themeList.length} Palettes
            </span>
          </div>

          {/* Scrollable list */}
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {themeList.map((thm) => {
              const isSelected = thm.id === themeId;
              return (
                <button
                  key={thm.id}
                  type="button"
                  onClick={() => {
                    changeTheme(thm.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all group"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.09)' : 'transparent',
                    border: isSelected ? `1px solid ${c.primary}` : '1px solid transparent',
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex items-center space-x-2.5">
                    {/* 4-dot palette preview */}
                    <div className="flex items-center space-x-1 p-1 rounded-lg bg-black/40 border border-white/10 shrink-0">
                      {thm.preview.map((dotColor, idx) => (
                        <span
                          key={idx}
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: dotColor }}
                        />
                      ))}
                    </div>

                    <div>
                      <div className="font-semibold text-xs" style={{ color: isSelected ? c.primary : thm.colors.text }}>
                        {thm.name}
                      </div>
                      <div className="text-[10px]" style={{ color: c.textMuted }}>
                        {thm.tag}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 shrink-0" style={{ color: c.primary }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
