"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// Keep a global reference to prevent active utterances from being garbage collected in Chrome
const activeUtterances = new Set<SpeechSynthesisUtterance>();

interface PronunciationEngineProps {
  word: string;
  showAccentSelector?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function PronunciationEngine({
  word,
  showAccentSelector = true,
  size = "md",
}: PronunciationEngineProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [accent, setAccent] = useState<"us" | "uk" | "au">("us");
  const [isMounted, setIsMounted] = useState(false);
  // Store loaded voices so we don't call getVoices() before they're available
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Avoid hydration mismatch for client-only API (localStorage)
  useEffect(() => {
    setIsMounted(true);
    const savedAccent = localStorage.getItem("lexiconic-accent") as "us" | "uk" | "au";
    if (savedAccent && ["us", "uk", "au"].includes(savedAccent)) {
      setAccent(savedAccent);
    }
  }, []);

  // Load voices asynchronously — Chrome fires voiceschanged when ready
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        voicesRef.current = available;
      }
    };

    // Try loading immediately (works in Firefox, Safari)
    loadVoices();
    // Subscribe to voiceschanged for Chrome/Edge
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getVoiceForAccent = useCallback((langCode: string) => {
    const voices = voicesRef.current;
    const langPrefix = langCode.split("-")[0].toLowerCase(); // e.g. "en"
    const langRegion = langCode.toLowerCase(); // e.g. "en-gb"

    // 1. Exact local match (ideal)
    let v = voices.find((x) => x.lang.toLowerCase() === langRegion && x.localService);
    // 2. Exact match (any — including cloud voices)
    if (!v) v = voices.find((x) => x.lang.toLowerCase() === langRegion);
    // 3. Same language prefix, local only (e.g. en-US for en-GB if no en-GB exists)
    //    BUT: only do this if there truly is no regional match at all
    const hasRegionalVoice = voices.some((x) => x.lang.toLowerCase() === langRegion);
    if (!v && !hasRegionalVoice) {
      v = voices.find((x) => x.lang.toLowerCase().startsWith(langPrefix + "-") && x.localService);
      if (!v) v = voices.find((x) => x.lang.toLowerCase().startsWith(langPrefix + "-"));
    }

    // Return null if we only found a cross-region fallback — caller will let browser choose
    return v ?? null;
  }, []);

  const handleAccentChange = (newAccent: "us" | "uk" | "au") => {
    setAccent(newAccent);
    localStorage.setItem("lexiconic-accent", newAccent);

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setTimeout(() => speak(newAccent), 80);
    }
  };

  const speak = useCallback((currentAccent = accent) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    setSpeechError(null);

    let langCode = "en-US";
    if (currentAccent === "uk") langCode = "en-GB";
    if (currentAccent === "au") langCode = "en-AU";

    // Stop any playing audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If no voices have loaded yet, wait for voiceschanged then retry once
    if (voicesRef.current.length === 0) {
      const retry = () => {
        window.speechSynthesis.onvoiceschanged = null;
        voicesRef.current = window.speechSynthesis.getVoices();
        if (voicesRef.current.length > 0) {
          doSpeak(langCode);
        } else {
          // Voices truly unavailable — go straight to browser default
          doSpeak(langCode);
        }
      };
      window.speechSynthesis.onvoiceschanged = retry;
      // Safety timeout: if event never fires, try anyway after 1 s
      setTimeout(() => {
        if (voicesRef.current.length === 0) {
          window.speechSynthesis.onvoiceschanged = null;
          doSpeak(langCode);
        }
      }, 1000);
      return;
    }

    doSpeak(langCode);
  }, [accent, word]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSpeak = (langCode: string) => {
    // Workaround: Chrome queue can get stuck in a paused state
    try { window.speechSynthesis.resume(); } catch (_) {}
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utteranceRef.current = utterance;
    utterance.lang = langCode;
    utterance.rate = 0.9;

    const voice = getVoiceForAccent(langCode);
    if (voice) utterance.voice = voice;

    activeUtterances.add(utterance);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      activeUtterances.delete(utterance);
    };
    utterance.onerror = (e) => {
      activeUtterances.delete(utterance);
      setIsSpeaking(false);

      if (e.error === "interrupted" || e.error === "canceled") return;

      // If we had a specific voice assigned and it failed, retry without it
      // so the browser can use its own default voice for the lang tag
      if (voice) {
        console.warn(`Voice "${voice.name}" failed for ${langCode}, retrying without voice assignment...`);
        doSpeakNoVoice(langCode);
        return;
      }

      console.warn("SpeechSynthesis error code:", e.error, e);
      setSpeechError(e.error || "unknown");
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      activeUtterances.delete(utterance);
      console.warn("speechSynthesis.speak threw, retrying without voice:", err);
      doSpeakNoVoice(langCode);
    }
  };

  const doSpeakNoVoice = (langCode: string) => {
    try { window.speechSynthesis.resume(); } catch (_) {}
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utteranceRef.current = utterance;
    utterance.lang = langCode;
    utterance.rate = 0.9;
    // No voice assigned — browser picks system default for this lang

    activeUtterances.add(utterance);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      activeUtterances.delete(utterance);
    };
    utterance.onerror = (e) => {
      activeUtterances.delete(utterance);
      setIsSpeaking(false);
      if (e.error === "interrupted" || e.error === "canceled") return;
      console.warn("SpeechSynthesis (no-voice) error code:", e.error, e);
      setSpeechError(e.error || "unknown");
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      activeUtterances.delete(utterance);
      console.error("speechSynthesis.speak (no-voice) threw:", err);
      setSpeechError("unavailable");
    }
  };

  const stopAll = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  if (!isMounted) {
    return (
      <div className="inline-flex items-center gap-2">
        <div className={`rounded-xl border border-border bg-background animate-pulse ${
          size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9"
        }`} />
      </div>
    );
  }

  // Button sizes styling
  const buttonSizing =
    size === "sm"
      ? "h-7 w-7 rounded-lg text-xs"
      : size === "lg"
        ? "h-11 w-11 rounded-2xl text-base"
        : "h-9 w-9 rounded-xl text-sm";

  return (
    <div
      className="inline-flex items-center gap-3 select-none"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {/* Play/Pause Speaker Button */}
      <button
        type="button"
        onClick={() => (isSpeaking ? stopAll() : speak())}
        className={`flex items-center justify-center border transition-all cursor-pointer ${buttonSizing} ${
          speechError
            ? "border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/15"
            : isSpeaking
              ? "border-violet-500/40 bg-violet-600/15 text-violet-650 dark:text-violet-400"
              : "border-border bg-background text-slate-500 dark:text-slate-400 hover:border-violet-500/30 hover:bg-violet-600/5 hover:text-violet-650 dark:hover:text-violet-400"
        }`}
        title={
          speechError
            ? `Error: ${speechError}. Click to retry.`
            : isSpeaking
              ? "Stop Pronunciation"
              : "Listen Pronunciation"
        }
      >
        {isSpeaking ? (
          /* Animated soundwaves */
          <div className="flex items-end gap-[2px] h-3 px-0.5 justify-center">
            <span className="w-[2px] h-full bg-violet-650 dark:bg-violet-400 rounded-full origin-bottom scale-y-[0.2] animate-wave-1" />
            <span className="w-[2px] h-full bg-violet-650 dark:bg-violet-400 rounded-full origin-bottom scale-y-[0.2] animate-wave-2" />
            <span className="w-[2px] h-full bg-violet-650 dark:bg-violet-400 rounded-full origin-bottom scale-y-[0.2] animate-wave-3" />
            <span className="w-[2px] h-full bg-violet-650 dark:bg-violet-400 rounded-full origin-bottom scale-y-[0.2] animate-wave-4" />
          </div>
        ) : speechError ? (
          /* Error icon */
          <svg className={size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : (
          /* Regular speaker icon */
          <svg className={size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Accent Selector (optional, usually shown on details view) */}
      {showAccentSelector && (
        <div className="flex gap-1 p-0.5 bg-background border border-border rounded-xl shadow-sm h-8 items-center">
          <button
            type="button"
            onClick={() => handleAccentChange("us")}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              accent === "us"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="US Accent"
          >
            US
          </button>
          <button
            type="button"
            onClick={() => handleAccentChange("uk")}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              accent === "uk"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="UK Accent"
          >
            UK
          </button>
          <button
            type="button"
            onClick={() => handleAccentChange("au")}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              accent === "au"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="AU Accent"
          >
            AU
          </button>
        </div>
      )}
    </div>
  );
}
