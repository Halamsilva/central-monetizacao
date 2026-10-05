import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Clock, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { PromptItem } from '../types';

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: PromptItem[];
  characterPreview?: string | null;
  supplementPreview?: string | null;
  productName?: string;
}

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  isOpen,
  onClose,
  prompts,
  characterPreview = null,
  supplementPreview = null,
  productName,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(9);
  const [totalElapsed, setTotalElapsed] = useState(0);

  const currentPrompt = prompts[currentStepIndex];

  // Stop audio on close
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlaying(false);
      setSecondsRemaining(9);
      setTotalElapsed(0);
    }
  }, [isOpen]);

  // Teleprompter runner
  useEffect(() => {
    let interval: any = null;

    if (isPlaying) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Move to next prompt or finish
            if (currentStepIndex < prompts.length - 1) {
              setCurrentStepIndex((curr) => curr + 1);
              playPromptSpeech(prompts[currentStepIndex + 1]);
              return 9;
            } else {
              setIsPlaying(false);
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              return 0;
            }
          }
          return prev - 1;
        });

        setTotalElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStepIndex, prompts]);

  const playPromptSpeech = (p: PromptItem) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const clean = p.spokenScript.replace(/<pausa[^>]*>/gi, '...');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } else {
      if (secondsRemaining <= 0) {
        setSecondsRemaining(9);
      }
      setIsPlaying(true);
      if (currentPrompt) {
        playPromptSpeech(currentPrompt);
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setCurrentStepIndex(0);
    setSecondsRemaining(9);
    setTotalElapsed(0);
  };

  const handleNext = () => {
    if (currentStepIndex < prompts.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setSecondsRemaining(9);
      if (isPlaying) {
        playPromptSpeech(prompts[currentStepIndex + 1]);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setSecondsRemaining(9);
      if (isPlaying) {
        playPromptSpeech(prompts[currentStepIndex - 1]);
      }
    }
  };

  if (!isOpen || !currentPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Teleprompter & Ensaio de Locução 9s
                <span className="text-xs font-mono bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
                  Cena {currentStepIndex + 1} de {prompts.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cronômetro calibrado para 9 segundos por cena • {prompts.length * 9} segundos de VSL total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storyboard Step Indicators */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-center text-xs overflow-x-auto divide-x divide-slate-800/60 scrollbar-none">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStepIndex(idx);
                setSecondsRemaining(9);
                if (isPlaying) playPromptSpeech(p);
              }}
              className={`flex-1 min-w-[110px] p-2.5 transition-all border-b-2 flex flex-col items-center justify-center gap-1 ${
                idx === currentStepIndex
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[10px] font-mono">0{p.step} ({p.duration.split(' ')[0]})</span>
              <span className="text-[11px] truncate w-full px-1">
                {p.title.split(':')[1]?.trim() || `Cena ${p.step}`}
              </span>
            </button>
          ))}
        </div>

        {/* Active Stage & Props Notice */}
        <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 truncate mr-3">
            <span className="font-semibold text-amber-400 shrink-0">Elemento em Cena:</span>
            {currentPrompt.title.toUpperCase().includes('FRASCO') ||
            currentPrompt.title.toUpperCase().includes('CTA') ||
            currentPrompt.title.toUpperCase().includes('BENEFÍCIO') ||
            currentStepIndex >= prompts.length - 2 ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Especialista segurando o produto de limpeza voltado para a câmera!
              </span>
            ) : currentStepIndex === 0 ? (
              <span className="text-teal-400 font-medium truncate">
                Maquete Gigante de 1,20m ao lado da especialista (sujeira e choque visual)
              </span>
            ) : (
              <span className="text-amber-400 font-medium truncate">
                {currentPrompt.goal}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {(currentPrompt.title.toUpperCase().includes('FRASCO') ||
              currentPrompt.title.toUpperCase().includes('CTA') ||
              currentPrompt.title.toUpperCase().includes('BENEFÍCIO') ||
              currentStepIndex >= prompts.length - 2) &&
              supplementPreview && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <img src={supplementPreview} alt="Produto" className="w-4 h-4 object-contain" />
                  <span>Produto em Mãos</span>
                </div>
              )}
            <div className="font-mono text-slate-400 text-xs">
              Tempo Total: <span className="text-white font-bold">{totalElapsed}s / {prompts.length * 9}s</span>
            </div>
          </div>
        </div>

        {/* Teleprompter Big Text Area */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center items-center text-center overflow-y-auto min-h-[220px]">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">
            {currentPrompt.title}
          </span>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white max-w-2xl leading-relaxed tracking-wide selection:bg-amber-500/30">
            "{currentPrompt.spokenScript}"
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              Tom: {currentPrompt.voiceDirection}
            </span>
          </div>
        </div>

        {/* Giant Countdown Bar (9s) */}
        <div className="px-6 py-2 bg-slate-950">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1.5">
            <span>Contagem Regressiva da Cena:</span>
            <span className={`text-base font-bold ${secondsRemaining <= 2 ? 'text-rose-400 animate-ping' : 'text-amber-400'}`}>
              00:0{secondsRemaining}s
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                secondsRemaining <= 2 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${(secondsRemaining / 9) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Cena Anterior
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              title="Reiniciar do início (Cena 1)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pausar Ensaio
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Iniciar Ensaio 9s
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleNext}
            disabled={currentStepIndex === prompts.length - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 disabled:opacity-40 transition-colors"
          >
            Próxima Cena
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
