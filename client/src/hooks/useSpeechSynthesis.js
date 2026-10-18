import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Clean up text for natural pronunciation by browser speech synthesis.
 * Removes markdown symbols, translates common code operators to words, and trims whitespace.
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, 'code block omitted.') // don't read huge code blocks
    .replace(/`([^`]+)`/g, '$1') // remove inline backticks
    .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold
    .replace(/\*([^*]+)\*/g, '$1') // remove italic
    .replace(/#{1,6}\s+/g, '') // remove headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove links, keep text
    .replace(/===?/g, ' equals ')
    .replace(/!==?/g, ' does not equal ')
    .replace(/<=/g, ' less than or equal to ')
    .replace(/>=/g, ' greater than or equal to ')
    .replace(/&&/g, ' and ')
    .replace(/\|\|/g, ' or ')
    .replace(/=>/g, ' arrow ')
    .replace(/\+\+/g, ' increment ')
    .replace(/--/g, ' decrement ')
    .replace(/\b(e\.g\.|eg)\b/gi, 'for example')
    .replace(/\b(i\.e\.|ie)\b/gi, 'that is')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into small sentence-based chunks (< 160 chars)
 * to prevent Chrome SpeechSynthesis 15-second cutoff bug.
 */
function splitIntoChunks(text, maxChunkLen = 160) {
  if (!text) return [];
  // Split on sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];

  for (const rawSentence of sentences) {
    const s = rawSentence.trim();
    if (!s) continue;
    if (s.length <= maxChunkLen) {
      chunks.push(s);
    } else {
      // Split on clauses (commas, semicolons, dashes)
      const clauses = s.split(/([,;:\-—]\s+)/);
      let current = '';
      for (const part of clauses) {
        if ((current + part).length <= maxChunkLen) {
          current += part;
        } else {
          if (current.trim()) chunks.push(current.trim());
          current = part;
        }
      }
      if (current.trim()) chunks.push(current.trim());
    }
  }
  return chunks.length > 0 ? chunks : [text];
}

/**
 * Custom React hook for controlling Web Speech API text-to-speech.
 */
export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentSectionTitle, setCurrentSectionTitle] = useState('');
  const [rate, setRateState] = useState(1.0);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Internal playback queue & refs
  const sectionsRef = useRef([]);
  const sectionIdxRef = useRef(0);
  const chunkIdxRef = useRef(0);
  const chunksRef = useRef([]);
  const rateRef = useRef(1.0);
  const voiceRef = useRef(null);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const keepAliveTimerRef = useRef(null);

  // Initialize SpeechSynthesis and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices && availableVoices.length > 0) {
          // Filter to English voices or all if none
          const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
          const voiceList = englishVoices.length > 0 ? englishVoices : availableVoices;
          setVoices(voiceList);

          // Choose a good default voice (Google US English, Samantha, Natural, or first English)
          const preferred =
            voiceList.find(v => /natural|neural|google|samantha/i.test(v.name)) ||
            voiceList.find(v => v.lang === 'en-US') ||
            voiceList[0];

          if (preferred && !voiceRef.current) {
            setSelectedVoice(preferred);
            voiceRef.current = preferred;
          }
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        if (keepAliveTimerRef.current) {
          clearInterval(keepAliveTimerRef.current);
        }
      };
    } else {
      setIsSupported(false);
    }
  }, []);

  // Chrome SpeechSynthesis keep-alive workaround
  const startKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    keepAliveTimerRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis && isPlayingRef.current && !isPausedRef.current) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }, []);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  }, []);

  // Stop playback cleanly
  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    stopKeepAlive();
    isPlayingRef.current = false;
    isPausedRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSectionIndex(0);
    setCurrentSectionTitle('');
    sectionIdxRef.current = 0;
    chunkIdxRef.current = 0;
    chunksRef.current = [];
  }, [stopKeepAlive]);

  // Speak next chunk in current section or advance to next section
  const speakNextChunk = useCallback(() => {
    if (!isPlayingRef.current) return;

    // Check if more chunks in current section
    if (chunkIdxRef.current < chunksRef.current.length) {
      const textToSpeak = chunksRef.current[chunkIdxRef.current];
      chunkIdxRef.current += 1;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = rateRef.current;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (isPlayingRef.current && !isPausedRef.current) {
          speakNextChunk();
        }
      };

      utterance.onerror = (e) => {
        // Canceled or interrupted is normal when stopping or changing
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('SpeechSynthesis error:', e);
        }
        if (isPlayingRef.current && !isPausedRef.current) {
          speakNextChunk();
        }
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    // Advance to next section
    sectionIdxRef.current += 1;
    if (sectionIdxRef.current < sectionsRef.current.length) {
      const nextSec = sectionsRef.current[sectionIdxRef.current];
      setCurrentSectionIndex(sectionIdxRef.current);
      setCurrentSectionTitle(nextSec.title || `Section ${sectionIdxRef.current + 1}`);
      chunksRef.current = splitIntoChunks(nextSec.text);
      chunkIdxRef.current = 0;
      speakNextChunk();
    } else {
      // Completed all sections!
      stop();
    }
  }, [stop]);

  // Main start speaking method
  const speak = useCallback((sectionsInput) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    stopKeepAlive();

    // Standardize input into array of sections: [{ id, title, text }]
    let sections = [];
    if (typeof sectionsInput === 'string') {
      sections = [{ id: 'text', title: 'Explanation', text: cleanTextForSpeech(sectionsInput) }];
    } else if (Array.isArray(sectionsInput)) {
      sections = sectionsInput
        .map((s, i) => ({
          id: s.id || `sec-${i}`,
          title: s.title || `Section ${i + 1}`,
          text: cleanTextForSpeech(s.text || ''),
        }))
        .filter(s => s.text && s.text.trim().length > 0);
    }

    if (sections.length === 0) return;

    sectionsRef.current = sections;
    sectionIdxRef.current = 0;
    chunkIdxRef.current = 0;
    chunksRef.current = splitIntoChunks(sections[0].text);

    isPlayingRef.current = true;
    isPausedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentSectionIndex(0);
    setCurrentSectionTitle(sections[0].title);

    startKeepAlive();
    speakNextChunk();
  }, [speakNextChunk, startKeepAlive, stopKeepAlive]);

  // Pause playback
  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPlayingRef.current) {
      window.speechSynthesis.pause();
      isPausedRef.current = true;
      setIsPaused(true);
    }
  }, []);

  // Resume playback
  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isPlayingRef.current) {
      window.speechSynthesis.resume();
      isPausedRef.current = false;
      setIsPaused(false);
    }
  }, []);

  // Skip to next section
  const nextSection = useCallback(() => {
    if (!isPlayingRef.current || sectionsRef.current.length === 0) return;
    window.speechSynthesis.cancel();
    if (sectionIdxRef.current + 1 < sectionsRef.current.length) {
      sectionIdxRef.current += 1;
      const sec = sectionsRef.current[sectionIdxRef.current];
      setCurrentSectionIndex(sectionIdxRef.current);
      setCurrentSectionTitle(sec.title);
      chunksRef.current = splitIntoChunks(sec.text);
      chunkIdxRef.current = 0;
      speakNextChunk();
    } else {
      stop();
    }
  }, [speakNextChunk, stop]);

  // Skip to previous section
  const previousSection = useCallback(() => {
    if (!isPlayingRef.current || sectionsRef.current.length === 0) return;
    window.speechSynthesis.cancel();
    if (sectionIdxRef.current > 0) {
      sectionIdxRef.current -= 1;
      const sec = sectionsRef.current[sectionIdxRef.current];
      setCurrentSectionIndex(sectionIdxRef.current);
      setCurrentSectionTitle(sec.title);
      chunksRef.current = splitIntoChunks(sec.text);
      chunkIdxRef.current = 0;
      speakNextChunk();
    } else {
      chunkIdxRef.current = 0;
      speakNextChunk();
    }
  }, [speakNextChunk]);

  // Change playback rate
  const setRate = useCallback((newRate) => {
    rateRef.current = newRate;
    setRateState(newRate);
  }, []);

  // Change voice
  const setVoice = useCallback((newVoice) => {
    voiceRef.current = newVoice;
    setSelectedVoice(newVoice);
  }, []);

  return {
    isSupported,
    isPlaying,
    isPaused,
    currentSectionIndex,
    currentSectionTitle,
    totalSections: sectionsRef.current.length,
    rate,
    voices,
    selectedVoice,
    speak,
    pause,
    resume,
    stop,
    nextSection,
    previousSection,
    setRate,
    setVoice,
  };
}
