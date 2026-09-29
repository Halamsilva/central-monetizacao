import React from 'react';
import { Video, HelpCircle, History, Sparkles, Layers } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGuide,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 text-neutral-950 font-black">
            <Video className="w-5 h-5 text-neutral-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                POV Produto
              </h1>
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                3 Cenas de 9s
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Gerador de Prompts Ultra-Realistas em 1ª Pessoa para Vídeos de Vendas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sequência Viral 27s (0-9s • 9-18s • 18-27s)</span>
          </div>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition text-xs font-medium"
            title="Histórico de Gerações"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Histórico</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 transition text-xs font-semibold"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Guia & IAs de Vídeo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
