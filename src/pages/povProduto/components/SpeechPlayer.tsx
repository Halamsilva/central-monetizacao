import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, Clock, Sparkles } from 'lucide-react';

interface SpeechPlayerProps {
  dialogue: string;
  sceneNumber: number;
}

export const SpeechPlayer: React.FC<SpeechPlayerProps> = ({ dialogue, sceneNumber }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 9 seconds
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setVoiceAvailable(false);
    }
    return () => {
      stopPlayback();
    };
  }, []);

  const stopPlayback = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
  };

  const startPlayback = () => {
    stopPlayback();
    setIsPlaying(true);
    setProgress(0);

    const startTime = Date.now();
    const duration = 9000; // 9 seconds

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentSeconds = Math.min(elapsed / 1000, 9.0);
      setProgress(currentSeconds);

      if (elapsed >= duration) {
        stopPlayback();
      }
    }, 100);

    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(dialogue);
        utterance.lang = 'pt-BR';
        utterance.rate = playbackRate;

        // Try to pick a Portuguese voice
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.includes('BR'));
        if (ptVoice) {
          utterance.voice = ptVoice;
        }

        utterance.onend = () => {
          // let the timer finish or finish if ended early
        };

        utterance.onerror = () => {
          // keep simulated timer running
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error, using timer simulation only', e);
      }
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  return (
    <div className="bg-neutral-900/60 rounded-xl p-3 border border-neutral-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-semibold text-neutral-300">
            Simulador de Locução (Janela de 9s)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-neutral-500" />
          <span>{progress.toFixed(1)}s</span>
          <span className="text-neutral-600">/</span>
          <span className="text-orange-400">9.0s</span>
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full bg-neutral-950 rounded-full h-2 mb-3 overflow-hidden border border-neutral-800/80 relative">
        <div
          className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-100 rounded-full"
          style={{ width: `${(progress / 9.0) * 100}%` }}
        />
        {/* Subtle 3s and 6s tick marks */}
        <div className="absolute top-0 bottom-0 left-[33.33%] w-[1px] bg-neutral-800" />
        <div className="absolute top-0 bottom-0 left-[66.66%] w-[1px] bg-neutral-800" />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={togglePlay}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            isPlaying
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-orange-500 text-neutral-950 hover:bg-orange-400 shadow-md shadow-orange-500/10'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Parar</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ouvir Fala (~9s)</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-500 hidden sm:inline">Velocidade:</span>
          <div className="flex items-center bg-neutral-950 rounded-lg p-0.5 border border-neutral-800 text-[11px]">
            {[0.9, 1.0, 1.15].map((rate) => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`px-2 py-0.5 rounded ${
                  playbackRate === rate
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
