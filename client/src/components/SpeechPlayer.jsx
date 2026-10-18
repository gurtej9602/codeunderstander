import React, { useState } from 'react';
import {
  Volume2, VolumeX, Play, Pause, Square, SkipForward, SkipBack,
  Gauge, ChevronDown, Sparkles, X, Minimize2, Maximize2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SPEEDS = [0.8, 1.0, 1.25, 1.5];

export default function SpeechPlayer({
  isPlaying,
  isPaused,
  currentSectionIndex,
  currentSectionTitle,
  totalSections,
  rate,
  voices = [],
  selectedVoice,
  onPlay,
  onPause,
  onResume,
  onStop,
  onNext,
  onPrevious,
  onRateChange,
  onVoiceChange,
  fileName,
}) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  const [isMinimized, setIsMinimized] = useState(false);
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);

  if (!isPlaying && !isPaused) return null;

  return (
    <aside
      aria-label="Audio Narration Player"
      className="fixed bottom-6 right-6 z-50 max-w-lg w-[calc(100vw-3rem)] rounded-2xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{
        backgroundColor: c.surfaceElevated || c.surface,
        border: `1px solid ${c.borderStrong || c.border}`,
        boxShadow: `0 10px 40px -10px rgba(0,0,0,0.6), 0 0 25px -5px ${c.primary}40`,
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Sound wave / progress header */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b gap-3"
        style={{ borderColor: c.border }}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          {/* Animated sound wave bars */}
          <div className="flex items-end space-x-0.5 h-4 w-5 shrink-0">
            {[40, 90, 60, 100, 50].map((h, i) => (
              <span
                key={i}
                className={`w-0.5 rounded-full transition-all duration-200 ${
                  isPlaying && !isPaused ? 'animate-pulse' : ''
                }`}
                style={{
                  height: isPlaying && !isPaused ? `${h}%` : '20%',
                  backgroundColor: isPlaying && !isPaused ? c.highlight : c.textMuted,
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span
                className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold"
                style={{
                  backgroundColor: isPaused ? 'rgba(255,255,255,0.08)' : `${c.primary}30`,
                  color: isPaused ? c.textMuted : c.highlight,
                }}
              >
                {isPaused ? 'Paused' : 'Speaking Out Loud'}
              </span>
              <span className="text-xs font-semibold truncate" style={{ color: c.text }}>
                {fileName || 'Gemini Explanation'}
              </span>
            </div>
          </div>
        </div>

        {/* Top right minimize & close */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(m => !m)}
            className="p-1.5 rounded-lg text-xs transition-colors hover:bg-white/10"
            style={{ color: c.textMuted }}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onStop}
            className="p-1.5 rounded-lg text-xs transition-colors hover:bg-white/10"
            style={{ color: c.textMuted }}
            title="Stop & Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main player body */}
      {!isMinimized && (
        <div className="p-4 space-y-3">
          {/* Current Section indicator */}
          <div
            className="p-2.5 rounded-xl flex items-center justify-between text-xs"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${c.border}`,
            }}
          >
            <div className="flex items-center space-x-2 truncate">
              <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: c.primary }} />
              <span className="font-medium truncate" style={{ color: c.text }}>
                {currentSectionTitle || 'Preparing explanation...'}
              </span>
            </div>
            {totalSections > 0 && (
              <span
                className="text-[11px] font-mono shrink-0 px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: c.textMuted,
                }}
              >
                {currentSectionIndex + 1} / {totalSections}
              </span>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Speed toggle */}
            <div className="flex items-center space-x-1">
              {SPEEDS.map(s => (
                <button
                  key={s}
                  onClick={() => onRateChange && onRateChange(s)}
                  className="px-2 py-1 rounded text-[11px] font-mono font-medium transition-all"
                  style={{
                    backgroundColor: rate === s ? c.primary : 'rgba(255, 255, 255, 0.06)',
                    color: rate === s ? '#ffffff' : c.textMuted,
                    border: `1px solid ${rate === s ? c.primary : 'transparent'}`,
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Playback action buttons */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={onPrevious}
                disabled={currentSectionIndex <= 0}
                className="p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                style={{ color: c.text }}
                title="Previous Section"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {isPaused ? (
                <button
                  onClick={onResume}
                  className="p-2.5 rounded-xl font-bold flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md"
                  style={{ background: c.btnGradient, color: '#ffffff' }}
                  title="Resume speaking"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="p-2.5 rounded-xl font-bold flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md"
                  style={{ background: c.btnGradient, color: '#ffffff' }}
                  title="Pause speaking"
                >
                  <Pause className="w-4 h-4 fill-current" />
                </button>
              )}

              <button
                onClick={onNext}
                disabled={currentSectionIndex >= totalSections - 1}
                className="p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                style={{ color: c.text }}
                title="Next Section"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={onStop}
                className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Stop playback"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Voice Selector if multiple voices exist */}
          {voices && voices.length > 1 && (
            <div className="pt-1">
              <button
                onClick={() => setShowVoiceSelect(v => !v)}
                className="text-[11px] flex items-center justify-between w-full px-2 py-1 rounded transition-colors hover:bg-white/5"
                style={{ color: c.textMuted }}
              >
                <span className="truncate">
                  Voice: {selectedVoice ? selectedVoice.name : 'System Default'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showVoiceSelect ? 'rotate-180' : ''}`} />
              </button>

              {showVoiceSelect && (
                <div
                  className="mt-1 max-h-32 overflow-y-auto rounded-lg p-1 space-y-0.5 border"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    borderColor: c.border,
                  }}
                >
                  {voices.map((v, i) => (
                    <button
                      key={v.name + i}
                      onClick={() => {
                        onVoiceChange && onVoiceChange(v);
                        setShowVoiceSelect(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] truncate transition-colors ${
                        selectedVoice?.name === v.name ? 'font-bold' : ''
                      }`}
                      style={{
                        backgroundColor: selectedVoice?.name === v.name ? `${c.primary}30` : 'transparent',
                        color: selectedVoice?.name === v.name ? c.highlight : c.text,
                      }}
                    >
                      {v.name} ({v.lang})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
