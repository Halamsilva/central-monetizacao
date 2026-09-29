import React from 'react';
import { Video, ShieldCheck, Sparkles, HelpCircle, RefreshCw, MessageSquare, Trash2 } from 'lucide-react';

interface NavbarProps {
  onNewVideo: () => void;
  onClearPrompts?: () => void;
  onOpenRules: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  hasScript: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewVideo,
  onClearPrompts,
  onOpenRules,
  onToggleChat,
  isChatOpen,
  hasScript,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 w-full border-b border-emerald-900/40 bg-[#0c1410]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 border border-emerald-600/30 shadow-inner">
            <Video className="h-5 w-5 text-emerald-400" />
            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#0c1410] bg-amber-500" title="4K 30fps Ultra-Realista" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-white text-base sm:text-lg uppercase">
                Receitas Anti-Pragas
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                Exterminador Caseiro
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/60 leading-none mt-0.5">
              Prompts Virais de 8s • 9:16 Vertical • 4K 30fps
            </p>
          </div>
        </div>

        {/* Center Badge - Fixed Structure */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg bg-[#14221a] px-3 py-1.5 border border-emerald-800/30 text-xs text-emerald-200/80">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Estrutura: Gancho (8s) → Foco do Problema (8s) → Ingredientes (8s) → Preparo (8s) → Aplicação (8s) → Resultado (8s) → Livro CTA (8s)</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-rules-modal"
            onClick={onOpenRules}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-900/60 bg-[#121c16] px-3 py-2 text-xs font-medium text-emerald-200/90 hover:bg-emerald-900/30 hover:text-emerald-100 transition-colors"
            title="Ver Regras Oficiais e Manual do Universo Visual"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Manual Visual</span>
          </button>

          <button
            id="btn-toggle-chat"
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              isChatOpen
                ? 'border-emerald-500 bg-emerald-600/20 text-emerald-200 shadow-sm shadow-emerald-950'
                : 'border-emerald-900/60 bg-[#121c16] text-emerald-200/90 hover:bg-emerald-900/30'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
            <span>Chat do Agente</span>
          </button>

          {hasScript && onClearPrompts && (
            <button
              id="btn-navbar-clear"
              onClick={onClearPrompts}
              className="flex items-center gap-1.5 rounded-lg border border-red-900/60 bg-red-950/20 hover:bg-red-950/40 px-3 py-2 text-xs font-medium text-red-300 hover:text-red-200 transition-colors"
              title="Limpar prompts gerados anteriormente"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}

          <button
            id="btn-new-video"
            onClick={onNewVideo}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-950 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Novo Vídeo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
