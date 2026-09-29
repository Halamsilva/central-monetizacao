import React, { useState } from "react";
import { CHARACTERS_PROFILES } from "../data/videoAnalysis";
import { Users, Copy, Check, Sparkles, Shirt, Shield, HelpCircle } from "lucide-react";

export const CharacterConsistency: React.FC = () => {
  const [selectedChar, setSelectedChar] = useState<string>("raimundo");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const character = CHARACTERS_PROFILES.find((c) => c.id === selectedChar) || CHARACTERS_PROFILES[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
          <Users className="w-4 h-4" />
          Fichas de Consistência de Elenco
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Prompts Mestres para Manter os Personagens Idênticos em Todos os Vídeos
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          Um dos maiores desafios das IAs de vídeo (Kling, Runway, Luma) é fazer o mesmo personagem aparecer em vários takes sem mudar de rosto, peso ou roupa. Use estes prompts descritivos padronizados em cada cena para manter a continuidade perfeita.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Configuração Ativa: Peso dos personagens 100% personalizável no gerador (40kg a 600kg, com calibragem padrão de 300kg / ~660 lbs). A consistência anatômica e física se ajusta perfeitamente.</span>
        </div>
      </div>

      {/* Character Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {CHARACTERS_PROFILES.map((c) => {
          const isSelected = selectedChar === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedChar(c.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                isSelected
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              <span>{c.name}</span>
              <span className="text-[10px] opacity-75 font-normal">({c.weight})</span>
            </button>
          );
        })}
      </div>

      {/* Active Character Profile */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{character.name}</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                {character.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{character.actorArchetype}</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Peso / Biotipo Referência</span>
            <span className="text-sm font-bold text-amber-400 font-mono">{character.weight}</span>
          </div>
        </div>

        {/* Master Prompt Snippet to Copy */}
        <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Prompt Mestre de Continuidade (Copie e cole na descrição do sujeito)
            </span>
            <button
              onClick={() => handleCopy(character.promptSnippet, "master_snippet")}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
            >
              {copiedId === "master_snippet" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar Prompt Mestre</span>
                </>
              )}
            </button>
          </div>
          <p className="font-mono text-xs text-slate-300 leading-relaxed select-all">
            {character.promptSnippet}
          </p>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Anatomy */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Estrutura Anatômica & Traços Físicos
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {character.anatomyTraits.map((t, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Clothing */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5 text-emerald-400" />
              Figurino Padronizado nos Vídeos
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {character.clothing.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Skin Formula */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Fórmula de Textura de Pele & Suor
            </h4>
            <p className="font-mono text-xs text-slate-400 leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              {character.skinTextureFormula}
            </p>
          </div>

          {/* Props */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
              Adereços de Cena Assinatura
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {character.signatureProps.map((p, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
