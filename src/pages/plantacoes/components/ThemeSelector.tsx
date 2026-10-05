import React, { useState } from "react";
import { CultivationTheme } from "../types";
import { CULTIVATION_THEMES } from "../data";
import { Leaf, Search, PlusCircle, ArrowRight } from "lucide-react";

interface ThemeSelectorProps {
  onSelect: (themeTitle: string, suggestedChar?: string, suggestedSetting?: string) => void;
  selectedTheme: string;
}

export default function ThemeSelector({ onSelect, selectedTheme }: ThemeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [customTheme, setCustomTheme] = useState("");

  const categories = ["Todos", "Frutos", "Folhas/Ervas", "Métodos"];

  const filteredThemes = CULTIVATION_THEMES.filter((theme) => {
    const matchesSearch = theme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          theme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || theme.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (theme: CultivationTheme) => {
    onSelect(theme.title, theme.characterType, theme.settingType);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTheme.trim()) {
      onSelect(customTheme.trim(), "homem-rural", "quintal-simples");
    }
  };

  return (
    <div id="theme-selector-container" className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center p-3.5 bg-emerald-50 rounded-full text-emerald-600 mb-2">
          <Leaf className="w-8 h-8" />
        </div>
        <h2 id="agent-question-header" className="text-2xl md:text-3xl font-sans font-bold tracking-tight text-gray-900">
          Qual tema deseja criar?
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Escolha um dos temas rústicos consolidados abaixo ou descreva o seu próprio cultivo caseiro para gerar o roteiro documental ultrarrealista de 4 cenas.
        </p>
      </div>

      {/* Custom Theme Input */}
      <form onSubmit={handleCustomSubmit} className="max-w-xl mx-auto flex gap-2 p-1.5 bg-white rounded-xl shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
        <div className="flex-1 flex items-center pl-3">
          <PlusCircle className="w-5 h-5 text-gray-400 mr-2" />
          <input
            id="custom-theme-input"
            type="text"
            value={customTheme}
            onChange={(e) => setCustomTheme(e.target.value)}
            placeholder="Exemplo: Horta em pneus velhos de jiló..."
            className="w-full text-sm text-gray-700 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-400"
          />
        </div>
        <button
          id="custom-theme-submit"
          type="submit"
          disabled={!customTheme.trim()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center transition-colors cursor-pointer"
        >
          Usar Personalizado
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </button>
      </form>

      {/* Filter Options */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between max-w-4xl mx-auto pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              id={`cat-btn-${cat}`}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            id="search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar cultivo..."
            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Grid of suggestions */}
      <div id="themes-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {filteredThemes.map((theme) => {
          const isSelected = selectedTheme === theme.title;
          return (
            <button
              id={`theme-btn-${theme.id}`}
              key={theme.id}
              onClick={() => handleSelect(theme)}
              className={`text-left p-4 rounded-xl border transition-all text-sm cursor-pointer group ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10"
                  : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/10 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl p-2 bg-gray-100 rounded-lg group-hover:bg-emerald-50 transition-colors">
                  {theme.emoji}
                </span>
                <div className="space-y-1">
                  <h3 className="font-sans font-semibold text-gray-900 line-clamp-1">
                    {theme.title}
                  </h3>
                  <span className="inline-block px-2 py-0.5 bg-gray-100 text-[10px] text-gray-500 rounded font-medium">
                    {theme.category}
                  </span>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {theme.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredThemes.length === 0 && (
        <div className="text-center p-12 bg-gray-50 rounded-xl max-w-xl mx-auto border border-dashed border-gray-200">
          <p className="text-xs text-gray-500 font-mono">Nenhum cultivo pré-configurado encontrado.</p>
          <p className="text-xs text-gray-400 mt-1">Insira seu tema no campo acima e gere um script do zero.</p>
        </div>
      )}
    </div>
  );
}
