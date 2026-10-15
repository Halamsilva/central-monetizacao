import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { callCriadorNoticias } from '../api';

interface AudioPlayerSectionProps {
  script: string;
}

export const AudioPlayerSection: React.FC<AudioPlayerSectionProps> = ({ script }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isWebSpeechPlaying, setIsWebSpeechPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop web speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle Gemini TTS generation
  const handleGenerateAiAudio = async () => {
    if (!script) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const data = await callCriadorNoticias('generate-tts', {
        text: script,
        voice: selectedVoice,
      });

      if (!data.success) {
        throw new Error(data.error || 'Falha ao sintetizar áudio com a IA.');
      }

      // Convert base64 wav to Blob URL
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      setAudioUrl(url);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao gerar áudio com IA. Você também pode usar a voz do navegador.');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  // Browser speech synthesis fallback
  const toggleWebSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isWebSpeechPlaying) {
      window.speechSynthesis.cancel();
      setIsWebSpeechPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05; // natural TV speed

      utterance.onend = () => setIsWebSpeechPlaying(false);
      utterance.onerror = () => setIsWebSpeechPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsWebSpeechPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Estúdio de Áudio & Narração Express
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-medium">
                Gemini 3.8 TTS
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Ouça o ritmo da reportagem ou baixe o arquivo de áudio narrado em Português Brasileiro
            </p>
          </div>
        </div>

        {/* Voice Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Voz:</span>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="Kore">Kore (Feminina Firme / Âncora)</option>
            <option value="Puck">Puck (Masculina Dinâmica)</option>
            <option value="Fenrir">Fenrir (Grave / Investigativo)</option>
            <option value="Zephyr">Zephyr (Jovem / Redes Sociais)</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleGenerateAiAudio}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-semibold text-xs tracking-wide shadow-lg shadow-rose-950/40 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sintetizando Narração com IA...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {audioUrl ? 'Gerar Novamente com IA' : 'Gerar Áudio da Reportagem (IA)'}
            </>
          )}
        </button>

        {/* Browser Speech quick test */}
        <button
          onClick={toggleWebSpeech}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
            isWebSpeechPlaying
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
          title="Leitura imediata sem custo via sintetizador do navegador"
        >
          <Volume2 className="w-3.5 h-3.5" />
          {isWebSpeechPlaying ? 'Pausar Leitura do Navegador' : 'Prévia Rápida no Navegador'}
        </button>
      </div>

      {/* Audio Player Card (When AI audio is generated) */}
      {audioUrl && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
          <audio
            ref={audioRef}
            src={audioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
            }}
            onLoadedMetadata={() => {
              if (audioRef.current) setDuration(audioRef.current.duration);
            }}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayAudio}
                className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <div>
                <span className="text-xs font-semibold text-white block">
                  Narração Gerada ({selectedVoice})
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Visualizer bars */}
            <div className="hidden sm:flex items-center gap-1">
              {[40, 70, 30, 90, 60, 100, 50, 80, 45, 65, 85, 35].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-rose-500 transition-all duration-300 ${
                    isPlaying ? 'opacity-100 animate-pulse' : 'opacity-30'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(8, (h * Math.sin(currentTime + i) + h) / 3)}px` : '8px',
                  }}
                />
              ))}
            </div>

            {/* Download WAV button */}
            <a
              href={audioUrl}
              download="noticia-narrada-viral.wav"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar .WAV
            </a>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden cursor-pointer"
            onClick={(e) => {
              if (!audioRef.current || duration === 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = percent * duration;
            }}
          >
            <div
              className="bg-rose-500 h-full rounded-full transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
