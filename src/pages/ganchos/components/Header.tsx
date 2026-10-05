import React from 'react';
import { Film, ShieldAlert, Sparkles, Copy, Check, Sliders } from 'lucide-react';

interface HeaderProps {
  onOpenTemplates: () => void;
  skinRealismActive: boolean;
  onToggleSkinRealism: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTemplates,
  skinRealismActive,
  onToggleSkinRealism,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-600 to-red-600 flex items-center justify-center shadow-lg shadow-rose-950/50 border border-amber-400/30">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Cinematic Prompt Studio
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Bloco Extra
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Estruturador de prompts virais de alta retenção • Formato técnico obrigatório
            </p>
          </div>
        </div>

        {/* Global Controls & Rule Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Rule banner: Never image, always text prompt */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>NUNCA GERA IMAGEM • 100% PROMPT EM TEXTO</span>
          </div>

          {/* Skin Realism Command Toggle */}
          <button
            onClick={onToggleSkinRealism}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              skinRealismActive
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-900/30'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Adiciona comando técnico obrigatório de textura de pele humana real com poros visíveis"
          >
            <Sparkles className={`w-3.5 h-3.5 ${skinRealismActive ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Pele Humana Real 8K</span>
            <span
              className={`w-2 h-2 rounded-full ${
                skinRealismActive ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Preset Templates */}
          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Modelos Prontos</span>
          </button>
        </div>
      </div>
    </header>
  );
};
