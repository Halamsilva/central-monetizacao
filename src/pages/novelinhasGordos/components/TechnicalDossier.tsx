import React, { useState } from "react";
import { TECHNICAL_ANALYSIS } from "../data/videoAnalysis";
import { Copy, Check, Users, Flame, Home, CloudRain, Clock, ShieldCheck, ChevronRight, Camera, GitCommit } from "lucide-react";

export const TechnicalDossier: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("personagens");
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  const activeAnalysis = TECHNICAL_ANALYSIS.find((a) => a.category === selectedCategory) || TECHNICAL_ANALYSIS[0];

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedKeyword(tag);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    personagens: <Users className="w-4 h-4" />,
    pele_suor: <Flame className="w-4 h-4" />,
    cenario_interior: <Home className="w-4 h-4" />,
    cenario_exterior: <CloudRain className="w-4 h-4" />,
    falas_9s: <Clock className="w-4 h-4" />,
    direcao_fotografia: <Camera className="w-4 h-4" />,
    continuidade_narrativa: <GitCommit className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Engenharia Reversa dos 4 Vídeos Anexados
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Dossiê Técnico Especializado: Como Recriar Vídeos Idênticos
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Análise aprofundada de cada fotograma dos vídeos fornecidos: desconstrução da anatomia hiper-obesa de 300kg, física de pele molhada de suor sob calor tropical, direção de fotografia com 50+ anos de experiência, calibração rítmica para falas de 9 segundos e a costura ininterrupta de continuidade entre os frames de cada cena.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {TECHNICAL_ANALYSIS.map((item) => {
          const isSelected = selectedCategory === item.category;
          return (
            <button
              key={item.category}
              onClick={() => setSelectedCategory(item.category)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isSelected
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              {categoryIcons[item.category as keyof typeof categoryIcons]}
              <span>
                {item.category === "personagens"
                  ? "1. Estrutura dos Personagens"
                  : item.category === "pele_suor"
                  ? "2. Textura de Pele & Suor"
                  : item.category === "cenario_interior"
                  ? "3. Cenário Interior (Sala)"
                  : item.category === "cenario_exterior"
                  ? "4. Cenário Exterior (Lama)"
                  : item.category === "falas_9s"
                  ? "5. A Regra dos 9 Segundos"
                  : item.category === "direcao_fotografia"
                  ? "6. Direção de Fotografia"
                  : "7. Continuidade Narrativa"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Dossier Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            {categoryIcons[activeAnalysis.category as keyof typeof categoryIcons]}
            {activeAnalysis.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">{activeAnalysis.description}</p>
        </div>

        {/* Detailed Findings Checklist */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Pontos Críticos Observados nos Vídeos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAnalysis.keyDetails.map((detail, idx) => (
              <div
                key={idx}
                className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-amber-500/20">
                  {idx + 1}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Essential Keywords for Prompts */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Palavras-Chave de Prompt Recomendadas (Clique para Copiar)
            </h4>
            <span className="text-[11px] text-slate-500">Incorpore no seu gerador</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeAnalysis.visualPromptKeywords.map((tag, tIdx) => (
              <button
                key={tIdx}
                onClick={() => handleCopyTag(tag)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs transition-all"
                title="Clique para copiar"
              >
                {copiedKeyword === tag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60" />}
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Negative Prompt Terms */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Termos Obrigatórios para o Negative Prompt
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {activeAnalysis.negativeKeywords.map((neg, nIdx) => (
              <span
                key={nIdx}
                className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[11px]"
              >
                {neg}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
