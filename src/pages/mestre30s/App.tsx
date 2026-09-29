/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TeleprompterStudio } from './components/TeleprompterStudio';
import { RecipeCatalogue } from './components/RecipeCatalogue';
import { AiRecipeGenerator } from './components/AiRecipeGenerator';
import { MASTER_RECIPES, MasterRecipe } from './data/recipes';

export default function App() {
  const [recipes, setRecipes] = useState<MasterRecipe[]>(MASTER_RECIPES);
  const [selectedRecipe, setSelectedRecipe] = useState<MasterRecipe>(MASTER_RECIPES[0]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectRecipe = (recipe: MasterRecipe) => {
    setSelectedRecipe(recipe);
    scrollToSection('studio');
  };

  const handleRecipeGenerated = (newRecipe: MasterRecipe) => {
    setRecipes((prev) => [newRecipe, ...prev]);
    setSelectedRecipe(newRecipe);
    scrollToSection('studio');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Contract (Section 2) */}
      <Navbar
        onNavClick={scrollToSection}
        onOpenGenerator={() => scrollToSection('generator')}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onStartStudio={() => scrollToSection('studio')}
          onExploreRecipes={() => scrollToSection('catalogue')}
          recipes={recipes}
          selectedRecipe={selectedRecipe}
          onSelectRecipe={(r) => handleSelectRecipe(r)}
        />

        {/* 4x9s Teleprompter & Video Direction Studio */}
        <TeleprompterStudio
          recipe={selectedRecipe}
          onSelectAnotherRecipe={() => scrollToSection('catalogue')}
          onOpenGenerator={() => scrollToSection('generator')}
        />

        {/* Recipe Recommendations Catalogue */}
        <RecipeCatalogue
          recipes={recipes}
          selectedRecipeId={selectedRecipe.id}
          onSelectRecipe={handleSelectRecipe}
          onOpenGenerator={() => scrollToSection('generator')}
        />

        {/* AI Recipe & 4-Prompt Sequence Generator */}
        <AiRecipeGenerator
          onRecipeGenerated={handleRecipeGenerated}
        />
      </main>

      {/* Quiet, clean editorial footer (Anti-Slop compliant Section 1.B) */}
      <footer className="border-t border-stone-850 bg-stone-950 py-10 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-stone-200">Mestre 30s</span>
            <span aria-hidden="true">·</span>
            <span>Gastronomia Expressa & Roteiros de 4x9s</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <span>Sabedoria Centenária</span>
            <span aria-hidden="true">·</span>
            <span>Culinárias Brasileira & Internacional</span>
            <span aria-hidden="true">·</span>
            <span>Ingredientes Frescos</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
