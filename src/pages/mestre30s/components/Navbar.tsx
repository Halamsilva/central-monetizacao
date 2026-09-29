import React from 'react';
import { ChefHat, Sparkles } from 'lucide-react';

interface NavbarProps {
  onNavClick: (sectionId: string) => void;
  onOpenGenerator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavClick, onOpenGenerator }) => {
  return (
    <header className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark in display serif */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-amber-100 hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <ChefHat className="w-5 h-5 text-amber-500 inline-block" />
          <span>Mestre 30s</span>
        </a>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-300">
          <button
            onClick={() => onNavClick('studio')}
            className="hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            Estúdio 4x9s
          </button>
          <button
            onClick={() => onNavClick('catalogue')}
            className="hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            Receitas do Mestre
          </button>
          <button
            onClick={() => onNavClick('generator')}
            className="hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            Criador com IA
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenGenerator}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerar Nova Receita</span>
          </button>
        </div>
      </div>
    </header>
  );
};
