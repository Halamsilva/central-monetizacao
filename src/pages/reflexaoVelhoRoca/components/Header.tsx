import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, BookOpen, Sparkles, Feather } from 'lucide-react';
import { ruralAudio } from '../utils/audio';

interface HeaderProps {
  onOpenRules: () => void;
  onSelectPreloaded: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRules, onSelectPreloaded }) => {
  const [ambientActive, setAmbientActive] = useState(false);

  useEffect(() => {
    // Keep in sync
    setAmbientActive(ruralAudio.getIsAmbientPlaying());
  }, []);

  const toggleAmbient = () => {
    if (ambientActive) {
      ruralAudio.stopAmbient();
      setAmbientActive(false);
    } else {
      ruralAudio.startAmbient();
      setAmbientActive(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#14100c]/90 backdrop-blur-md border-b border-[#2d2015] px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c26a2c] to-[#7c3f15] p-0.5 shadow-lg shadow-[#c26a2c]/10 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#1e150f] rounded-[14px] flex items-center justify-center text-[#f0a266]">
              <Feather className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-serif-roca font-bold text-[#faf3e8] tracking-tight">
                Reflexões do Velho da Roça
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-[#382618] text-[#e09159] border border-[#523722]">
                Agente IA Especialista
              </span>
            </div>
            <p className="text-xs text-[#a39281] mt-0.5 hidden sm:block">
              Gerador de roteiros virais e prompts 9:16 para TikTok, Instagram Reels e YouTube Shorts
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          {/* Ambient Sound Button */}
          <button
            onClick={toggleAmbient}
            id="btn-toggle-ambient"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              ambientActive
                ? 'bg-[#3b2a1a] text-[#f7c28c] border-[#c26a2c] shadow-sm'
                : 'bg-[#1e1711] text-[#9f8e7d] border-[#38281b] hover:text-[#e4d6c6] hover:bg-[#281e16]'
            }`}
            title="Som ambiente sutil da roça (vento suave e grilos)"
          >
            {ambientActive ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#e08244] animate-pulse" />
                <span>Ambiente: Ligado</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Ambiente da Roça</span>
              </>
            )}
          </button>

          {/* Preloaded Example Button */}
          <button
            onClick={onSelectPreloaded}
            id="btn-load-preset"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#1e1711] text-[#c9b8a5] border border-[#38281b] hover:bg-[#281e16] hover:text-[#f5ebd9] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#e08244]" />
            <span>Exemplo Pronto</span>
          </button>

          {/* Rules / Specs button */}
          <button
            onClick={onOpenRules}
            id="btn-agent-rules"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#2a1d13] text-[#f0ae71] border border-[#4a3422] hover:bg-[#382619] transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Regras do Agente</span>
          </button>
        </div>
      </div>
    </header>
  );
};
