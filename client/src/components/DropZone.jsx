import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode2, AlertCircle, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { SAMPLE_CODES } from '../utils/sampleCodes';
import { useTheme } from '../context/ThemeContext';

const SUPPORTED_EXTENSIONS = [
  '.java', '.py', '.js', '.ts', '.jsx', '.tsx',
  '.cpp', '.c', '.go', '.rs', '.html', '.css',
  '.php', '.rb', '.kt', '.swift',
];
const MAX_BYTES = 200 * 1024; // 200KB limit

export default function DropZone({
  selectedFile,
  setSelectedFile,
  fileContent,
  setFileContent,
  detectedLanguage,
  setDetectedLanguage,
  fileError,
  setFileError,
  disabled,
  isAnalyzed = false,
  onClear
}) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const getLanguageFromExt = (ext) => {
    switch (ext.toLowerCase()) {
      case '.java':  return 'Java';
      case '.py':    return 'Python';
      case '.js':    return 'JavaScript';
      case '.ts':    return 'TypeScript';
      case '.jsx':   return 'React JSX';
      case '.tsx':   return 'React TSX';
      case '.cpp':   return 'C++';
      case '.c':     return 'C';
      case '.go':    return 'Go';
      case '.rs':    return 'Rust';
      case '.html':  return 'HTML';
      case '.css':   return 'CSS';
      case '.php':   return 'PHP';
      case '.rb':    return 'Ruby';
      case '.kt':    return 'Kotlin';
      case '.swift': return 'Swift';
      default:       return 'Generic';
    }
  };

  const validateAndProcessFile = (file) => {
    setFileError(null);

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setFileError(`Unsupported file extension "${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      return;
    }

    if (file.size > MAX_BYTES) {
      setFileError(`File size (${(file.size / 1024).toFixed(1)} KB) exceeds the 200 KB limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (!content || !content.trim()) {
        setFileError('The selected file is empty.');
        return;
      }
      setSelectedFile({
        name: file.name,
        size: file.size,
        extension: ext,
        isSample: false
      });
      setFileContent(content);
      setDetectedLanguage(getLanguageFromExt(ext));
      if (onClear) onClear();
    };
    reader.onerror = () => {
      setFileError('Failed to read the file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleLoadSample = (sampleKey) => {
    if (disabled) return;
    const sample = SAMPLE_CODES[sampleKey];
    if (!sample) return;

    setFileError(null);
    setSelectedFile({
      name: sample.fileName,
      size: new Blob([sample.code]).size,
      extension: sample.extension,
      isSample: true
    });
    setFileContent(sample.code);
    setDetectedLanguage(sample.language);
    if (onClear) onClear();
  };

  const handleClear = () => {
    setSelectedFile(null);
    setFileContent('');
    setDetectedLanguage('');
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onClear) onClear();
  };

  return (
    <div className="space-y-4">
      {/* Hidden native input */}
      <input
        type="file"
        ref={fileInputRef}
        accept={SUPPORTED_EXTENSIONS.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Main Dropzone / Selected File Card */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 ${
            isDragOver ? 'scale-[1.01]' : ''
          }`}
          style={
            isDragOver
              ? {
                  borderColor: c.primary,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  boxShadow: c.btnShadow,
                }
              : {
                  borderColor: c.border,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                }
          }
        >
          <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${c.border}`,
              }}
            >
              <UploadCloud className="w-8 h-8" style={{ color: c.primary }} />
            </div>

            <div>
              <p className="text-base font-medium" style={{ color: c.text }}>
                <span
                  className="font-semibold underline underline-offset-4"
                  style={{ color: c.primary }}
                >
                  Click to browse
                </span>{' '}
                or drag and drop your code file here
              </p>
              <p className="text-xs mt-1" style={{ color: c.textMuted }}>
                Max 200 KB per file • Evaluated using Gemini Flash
              </p>
            </div>

            {/* Supported format chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '6px', paddingTop: '8px', maxWidth: '480px' }}>
              {SUPPORTED_EXTENSIONS.map((ext) => (
                <span
                  key={ext}
                  style={{
                    padding: '3px 9px',
                    fontSize: '11px', fontFamily: 'monospace', fontWeight: 500,
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: c.highlight,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div
          className="rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300"
          style={{
            border: `1px solid ${c.border}`,
            backgroundColor: c.surfaceElevated,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${c.border}`,
                }}
              >
                <FileCode2 className="w-6 h-6" style={{ color: c.secondary }} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-base font-mono truncate max-w-xs sm:max-w-md" style={{ color: c.text }}>
                    {selectedFile.name}
                  </h3>
                  {selectedFile.isSample && (
                    <span
                      className="text-[10px] uppercase font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: c.highlight,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      Sample
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-xs mt-0.5" style={{ color: c.textMuted }}>
                  <span style={{ color: c.primary }}>{detectedLanguage}</span>
                  <span>•</span>
                  <span>{(selectedFile.size / 1024).toFixed(1)} KB / 200 KB</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1" style={{ color: '#22c55e' }}>
                    <CheckCircle2 className="w-3 h-3 inline" />
                    <span>Ready</span>
                  </span>
                </div>
              </div>
            </div>

            {!isAnalyzed ? (
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: c.text,
                    border: `1px solid ${c.border}`,
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = c.primary}
                  onMouseOut={e => e.currentTarget.style.borderColor = c.border}
                >
                  Change File
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={disabled}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: c.primary,
                    border: `1px solid ${c.border}`,
                  }}
                  title="Remove file"
                  onMouseOver={e => e.currentTarget.style.borderColor = c.primary}
                  onMouseOut={e => e.currentTarget.style.borderColor = c.border}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 self-end sm:self-center">
                <span
                  className="px-3 py-1 text-xs font-semibold rounded-full flex items-center space-x-1.5"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.35)',
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                  <span>Analyzed</span>
                </span>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Validation / File Error Notice */}
      {fileError && (
        <div
          className="flex items-start space-x-2 p-3.5 rounded-xl text-xs"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <span>{fileError}</span>
        </div>
      )}

      {/* Quick-Load Samples Section (hidden while viewing analysis) */}
      {!isAnalyzed && (
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs mb-2" style={{ color: c.textMuted }}>
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: c.primary }} />
              <span className="font-medium">Or test immediately with a ready sample:</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(SAMPLE_CODES).map(([key, sample]) => {
              const isSelected = selectedFile?.name === sample.fileName;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleLoadSample(key)}
                  disabled={disabled}
                  className="px-3 py-2 text-left rounded-xl text-xs transition-all"
                  style={
                    isSelected
                      ? {
                          border: `1px solid ${c.primary}`,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: c.highlight,
                          boxShadow: `0 0 12px ${c.border}`,
                        }
                      : {
                          border: `1px solid ${c.border}`,
                          backgroundColor: 'rgba(0, 0, 0, 0.25)',
                          color: c.text,
                        }
                  }
                >
                  <div className="font-semibold">{sample.language}</div>
                  <div className="text-[10px] font-mono truncate" style={{ color: c.textMuted }}>
                    {sample.fileName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
