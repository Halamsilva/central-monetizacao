import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, FlipHorizontal, Type, Gauge, Maximize2, Minimize2 } from 'lucide-react';

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  script: string;
}

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  isOpen,
  onClose,
  title,
  script,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2); // 1 to 5
  const [fontSize, setFontSize] = useState(36); // px
  const [isMirrored, setIsMirrored] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setElapsedSeconds(0);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle auto-scrolling
  useEffect(() => {
    if (isPlaying) {
      scrollIntervalRef.current = setInterval(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop += speed * 0.7;
        }
      }, 30);

      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(scrollIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      clearInterval(scrollIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying, speed]);

  const handleReset = () => {
    setIsPlaying(false);
    setElapsedSeconds(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  // Format MM:SS
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Phase calculation based on 2-min rule (0-10s, 10-35s, 35-75s, 75-105s, 105-120s)
  let currentPhase = '0–10s: GANCHO';
  let phaseColor = 'bg-rose-500 text-rose-100';
  if (elapsedSeconds > 105) {
    currentPhase = '105–120s: ENCERRAMENTO';
    phaseColor = 'bg-purple-500 text-purple-100';
  } else if (elapsedSeconds > 75) {
    currentPhase = '75–105s: CONSEQUÊNCIAS';
    phaseColor = 'bg-amber-500 text-amber-100';
  } else if (elapsedSeconds > 35) {
    currentPhase = '35–75s: DESENVOLVIMENTO';
    phaseColor = 'bg-blue-500 text-blue-100';
  } else if (elapsedSeconds > 10) {
    currentPhase = '10–35s: CONTEXTO';
    phaseColor = 'bg-cyan-500 text-cyan-100';
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none">
      {/* Top Controller Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono font-bold text-lg text-rose-400">
              {timeFormatted} <span className="text-xs text-slate-400 font-normal">/ 02:00</span>
            </span>
          </div>

          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${phaseColor}`}>
            {currentPhase}
          </span>
        </div>

        {/* Center Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
            }`}
            title="Espaço para pausar/retomar"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlaying ? 'Pausar (Espaço)' : 'Iniciar (Espaço)'}
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reiniciar prompter"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right Settings */}
        <div className="flex items-center gap-4">
          {/* Speed */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Gauge className="w-4 h-4 text-slate-400" />
            <span>Velocidade:</span>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-20 accent-rose-500 cursor-pointer"
            />
            <span className="font-mono text-white w-6">{speed}x</span>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Type className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="24"
              max="64"
              step="4"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-20 accent-rose-500 cursor-pointer"
            />
            <span className="font-mono text-white w-8">{fontSize}px</span>
          </div>

          {/* Mirror */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-2 rounded-lg border transition-colors ${
              isMirrored
                ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Espelhar texto (para vidro de teleprompter)"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Tela cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
            title="Fechar prompter (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Eyeline Guide Indicator (Center Horizontal Marker) */}
      <div className="absolute top-1/2 left-0 right-0 pointer-events-none z-10 flex items-center justify-between px-4">
        <div className="w-8 h-1 bg-rose-500/80 rounded-r shadow-lg shadow-rose-500/50" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-rose-500/80 px-2 py-0.5 bg-slate-950/80 rounded border border-rose-500/30">
          Linha de Olhar
        </span>
        <div className="w-8 h-1 bg-rose-500/80 rounded-l shadow-lg shadow-rose-500/50" />
      </div>

      {/* Scrollable Prompter Body */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-y-auto px-12 md:px-32 py-48 text-center scroll-smooth ${
          isMirrored ? 'scale-x-[-1]' : ''
        }`}
        style={{ scrollBehavior: 'auto' }}
      >
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Headline */}
          <div className="pb-8 border-b border-slate-800">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-2 block">
              TÍTULO DO VÍDEO
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-300 leading-snug">
              {title}
            </h1>
          </div>

          {/* Script Content */}
          <div
            className="font-medium text-slate-100 leading-relaxed tracking-normal font-sans"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
          >
            {script}
          </div>

          <div className="pt-24 pb-48 text-slate-600 font-mono text-sm uppercase tracking-widest">
            — FIM DA REPORTAGEM —
          </div>
        </div>
      </div>
    </div>
  );
};
