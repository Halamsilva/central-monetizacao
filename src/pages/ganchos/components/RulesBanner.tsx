import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Sparkles, Clock, Flame } from 'lucide-react';

export const RulesBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/10 text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-200">
            Diretrizes Técnicas Integradas (Bloco Extra Obrigatório)
          </span>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
            100% Texto • Sem Imagens
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[11px]">{isOpen ? 'Ocultar Regras' : 'Ver Regras'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-400">
              <Flame className="w-3.5 h-3.5" />
              <span>Regra da Fala (~8 Segundos)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Primeiros 4 segundos com agressão direta e insultos. Emoção de ódio, desprezo e humilhação nítida sem enrolação (20 a 28 palavras, estilo novela/reels viral).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Textura de Pele Humana Real</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Injeção do comando fotorrealista com poros visíveis, micro-relevo cutâneo, imperfeições sutis e iluminação sem aparência plástica ou 3D fake.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Preservação de Estrutura</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Mantém obrigatoriamente: TÍTULO DA CENA, CENA, PERSONAGENS, DESCRIÇÃO VISUAL, POSTURA, PERFIL PSICOLÓGICO, MOTIVAÇÃO, MEDO e FALA FINAL.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
