import React, { useState } from 'react';
import { ChefHat, Clock, Film, Sparkles, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { MasterRecipe } from '../data/recipes';

interface RecipeCatalogueProps {
  recipes: MasterRecipe[];
  selectedRecipeId: string;
  onSelectRecipe: (recipe: MasterRecipe) => void;
  onOpenGenerator: () => void;
}

export const RecipeCatalogue: React.FC<RecipeCatalogueProps> = ({
  recipes,
  selectedRecipeId,
  onSelectRecipe,
  onOpenGenerator,
}) => {
  const [filter, setFilter] = useState<'all' | 'brasileira' | 'internacional'>('all');

  const filteredRecipes = recipes.filter((r) => {
    if (filter === 'all') return true;
    return r.cuisineType === filter;
  });

  return (
    <section id="catalogue" className="py-12 bg-stone-950 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wide uppercase mb-1">
              <span>Cardápio Mestre</span>
              <span aria-hidden="true">·</span>
              <span>Ingredientes, Quantidades & Ponto</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              Receitas Recomendadas do Mestre
            </h2>
            <p className="text-sm text-stone-400 mt-1 max-w-xl">
              Pratos testados com medidas exatas na balança e tempos de fogo precisos, cada um com sua sequência de 4 prompts de 9 segundos.
            </p>
          </div>

          {/* Interactive Filter Tabs (functional segmented controls per Section 1.A) */}
          <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Todas ({recipes.length})
            </button>
            <button
              onClick={() => setFilter('brasileira')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'brasileira'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🇧🇷 Brasileiras
            </button>
            <button
              onClick={() => setFilter('internacional')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'internacional'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🌍 Internacionais
            </button>
          </div>
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => {
            const isSelected = selectedRecipeId === recipe.id;
            return (
              <div
                key={recipe.id}
                className={`flex flex-col justify-between rounded-2xl border transition-all duration-200 p-6 ${
                  isSelected
                    ? 'bg-stone-900 border-amber-500/80 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/30'
                    : 'bg-stone-900/60 border-stone-800 hover:bg-stone-900/90 hover:border-stone-700'
                }`}
              >
                <div>
                  {/* Clean unboxed metadata with typographic separators (Section 1.A) */}
                  <div className="flex items-center gap-2 text-xs text-stone-400 mb-3">
                    <span className="text-base">{recipe.flag}</span>
                    <span className="font-medium text-amber-300">{recipe.country}</span>
                    <span aria-hidden="true">·</span>
                    <span>{recipe.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-stone-300">{recipe.totalTimeDisplay || 'Rápido'}</span>
                  </div>

                  <h3 className="text-lg font-serif font-bold text-stone-100 mb-2 leading-snug">
                    {recipe.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 leading-relaxed mb-4">
                    {recipe.subtitle}
                  </p>

                  {/* Fresh Ingredients Highlights with Quantities */}
                  <div className="mb-4 pt-3 border-t border-stone-800/80">
                    <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                      <span>Ingredientes & Quantidades:</span>
                      <span className="text-[10px] font-mono text-amber-400">{recipe.servings}</span>
                    </div>
                    <ul className="text-xs text-stone-300 space-y-1.5">
                      {recipe.freshIngredients.slice(0, 3).map((ing, i) => (
                        <li key={i} className="flex items-baseline justify-between gap-1.5 text-[11px]">
                          <span className="truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="truncate text-stone-200">{ing.name}</span>
                          </span>
                          <span className="font-mono text-amber-300/90 shrink-0 text-[10px]">{ing.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 4-Prompts Preview Line */}
                  <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800/80 mb-5">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold mb-1">
                      Roteiro 4x9s:
                    </div>
                    <p className="text-xs text-stone-400 line-clamp-2 italic">
                      "{recipe.prompts[0].spokenLine}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-stone-800">
                  <button
                    onClick={() => onSelectRecipe(recipe)}
                    className="w-full py-2.5 px-4 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Film className="w-4 h-4" />
                    <span>Carregar no Estúdio 4x9s</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggestion Banner */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-stone-900 to-amber-950/30 border border-stone-800 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-100 mb-1">
              Quer uma receita exclusiva com o que você tem na geladeira?
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 max-w-xl">
              Diga qualquer ingrediente e o Mestre dos 100 Anos vai gerar uma receita com ingredientes frescos, quantidades medidas, tempos de preparo e 4 falas de 9 segundos calibradas.
            </p>
          </div>
          <button
            onClick={onOpenGenerator}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shrink-0 flex items-center gap-2 shadow-md"
          >
            <Sparkles className="w-4 h-4 text-stone-900" />
            <span>Criar Receita Sob Demanda</span>
          </button>
        </div>
      </div>
    </section>
  );
};
