import React from 'react';
import { Clock, Film, Flame, Sparkles, UtensilsCrossed } from 'lucide-react';
import { MasterRecipe } from '../data/recipes';

interface HeroProps {
  onStartStudio: () => void;
  onExploreRecipes: () => void;
  recipes: MasterRecipe[];
  selectedRecipe: MasterRecipe;
  onSelectRecipe: (recipe: MasterRecipe) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onStartStudio,
  onExploreRecipes,
  recipes,
  selectedRecipe,
  onSelectRecipe,
}) => {
  return (
    <section className="relative overflow-hidden border-b border-stone-800 bg-gradient-to-b from-stone-900/60 via-stone-950 to-stone-950 py-12 md:py-20">
      {/* Subtle warm atmospheric glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          {/* Metadata line without pills */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-amber-400 mb-4 tracking-wide">
            <span>Mestre Centenário da Gastronomia Express</span>
            <span aria-hidden="true">·</span>
            <span>100 Anos de Experiência</span>
            <span aria-hidden="true">·</span>
            <span>Brasil & Culinária Mundial</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-100 tracking-tight leading-[1.15] text-balance mb-6">
            Receitas com pesos exatos, preparo detalhado e 4 falas de 9s.
          </h1>

          <p className="text-base sm:text-lg text-stone-300 leading-relaxed max-w-2xl mb-8">
            A alta gastronomia começa na precisão dos ingredientes e nos tempos de fogo: aprenda pratos do cotidiano com quantidades na balança, dicas de corte e grave vídeos virais perfeitamente ritmados.
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10">
            <button
              onClick={onStartStudio}
              className="px-6 py-3 text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg transition-all shadow-md flex items-center gap-2"
            >
              <Film className="w-4 h-4 text-stone-900" />
              <span>Abrir Estúdio Teleprompter 4x9s</span>
            </button>
            <button
              onClick={onExploreRecipes}
              className="px-6 py-3 text-sm font-semibold text-stone-200 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg transition-all flex items-center gap-2"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>Ver Receitas Recomendadas</span>
            </button>
          </div>

          {/* Quick Recipe Switcher Bar */}
          <div className="pt-6 border-t border-stone-800/80">
            <div className="text-xs uppercase tracking-wider text-stone-400 font-medium mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Receitas em Destaque para Gravar Agora:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipes.slice(0, 5).map((recipe) => {
                const isActive = selectedRecipe.id === recipe.id;
                return (
                  <button
                    key={recipe.id}
                    onClick={() => onSelectRecipe(recipe)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-sm'
                        : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    <span>{recipe.flag}</span>
                    <span className="truncate max-w-[170px] sm:max-w-none">{recipe.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rigorous quantitative metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-stone-800/60 text-stone-300">
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 tabular-nums">
              4 a 5 min
            </div>
            <div className="text-xs text-stone-400 mt-1">Tempo Total Médio</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 tabular-nums">
              4 × 9s
            </div>
            <div className="text-xs text-stone-400 mt-1">Takes Cronometrados</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 tabular-nums">
              100%
            </div>
            <div className="text-xs text-stone-400 mt-1">Quantidades Medidas</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 tabular-nums">
              100 Anos
            </div>
            <div className="text-xs text-stone-400 mt-1">Tradição & Técnica</div>
          </div>
        </div>
      </div>
    </section>
  );
};
