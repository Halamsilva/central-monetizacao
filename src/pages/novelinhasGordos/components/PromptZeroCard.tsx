import React, { useState } from "react";
import {
  Users,
  Copy,
  Check,
  Sparkles,
  Camera,
  Layers,
  ShieldCheck,
  Lock,
  Eye,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PromptZeroReference } from "../types";

interface PromptZeroCardProps {
  promptZero: PromptZeroReference;
  targetAi: string;
  characterWeightKg?: number;
}

export const PromptZeroCard: React.FC<PromptZeroCardProps> = ({
  promptZero,
  targetAi,
  characterWeightKg = 300,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);
  const [showSpecs, setShowSpecs] = useState(true);
  const [activeTab, setActiveTab] = useState<"en" | "characters">("en");

  const handleCopyEnglish = () => {
    navigator.clipboard.writeText(promptZero.englishPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2200);
  };

  const handleCopyNegative = () => {
    navigator.clipboard.writeText(promptZero.negativePrompt);
    setCopiedNeg(true);
    setTimeout(() => setCopiedNeg(false), 2200);
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/70 border-2 border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 overflow-hidden">
      {/* Visual Accent Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-500/30 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase">
                Obrigatório
              </span>
              <span className="text-xs font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
                Âncora Visual Mestra
              </span>
              <span className="text-xs font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Fundo Branco Puro
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{promptZero.title}</span>
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-300 max-w-3xl leading-relaxed">
              {promptZero.purpose}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleCopyEnglish}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            title="Copiar prompt em inglês para Midjourney, Flux, Kling ou Runway"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-4 h-4" />
                <span>Prompt Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Prompt 00 (Inglês)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mandatory Requirements Checklist Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium">Fundo Branco Puro</span>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium">Corpo Inteiro (Head-to-Toe)</span>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium">Lado a Lado Sem Sobreposição</span>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium">Zero Cenário / Zero Objetos</span>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium">4K Fotografia de Estúdio</span>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-amber-300 font-bold">{characterWeightKg}kg Fixo</span>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
          <span className="text-xs">👕</span>
          <span className="text-amber-200 font-medium truncate">Roupas Curtas & Não Cabem</span>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
          <span className="text-xs">💧</span>
          <span className="text-sky-300 font-medium truncate">Sempre Suados</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("en")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "en"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Prompt Mestre em Inglês (Midjourney / Flux / Kling)
        </button>
        <button
          onClick={() => setActiveTab("characters")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "characters"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Elenco & Posições ({promptZero.characters?.length || 0})</span>
        </button>
      </div>

      {/* Tab Content: English Master Prompt */}
      {activeTab === "en" && (
        <div className="space-y-3">
          <div className="relative group">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs sm:text-[13px] text-slate-200 font-mono leading-relaxed whitespace-pre-wrap selection:bg-amber-500 selection:text-slate-950 max-h-72 overflow-y-auto">
              {promptZero.englishPrompt}
            </div>
            <button
              onClick={handleCopyEnglish}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? "Copiado" : "Copiar"}</span>
            </button>
          </div>

          {/* Negative Prompt */}
          <div className="bg-slate-950/70 border border-red-500/20 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                Negative Prompt Obrigatório (Anti-Cenário & Anti-Sobreposição):
              </span>
              <button
                onClick={handleCopyNegative}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedNeg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copiar Negative</span>
              </button>
            </div>
            <p className="text-[11px] font-mono text-slate-400 leading-normal">
              {promptZero.negativePrompt}
            </p>
          </div>
        </div>
      )}

      {/* Tab Content: Characters Grid */}
      {activeTab === "characters" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {promptZero.characters?.map((char, cIdx) => (
            <div
              key={char.name || cIdx}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                    {cIdx + 1}
                  </span>
                  <span className="text-sm font-bold text-white">{char.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  {char.role}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Posicionamento no Fundo Branco:
                  </span>
                  <p className="text-slate-300 text-[11px]">{char.spatialArrangement}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Roupas & Calçados Travados:
                  </span>
                  <p className="text-slate-200 text-[11px] bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    {char.clothingAndFootwear}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Rosto, Cabelo & Expressão:
                  </span>
                  <p className="text-slate-300 text-[11px]">{char.hairAndFacialFeatures}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Anatomia & Corpo Inteiro ({char.weight}):
                  </span>
                  <p className="text-slate-400 text-[11px]">{char.fullBodyDescription}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workflow Instructions Collapsible */}
      <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3.5 space-y-2">
        <button
          onClick={() => setShowSpecs(!showSpecs)}
          className="w-full flex items-center justify-between text-xs font-bold text-blue-300 hover:text-blue-200 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-400" />
            Como usar o PROMPT 00 como Referência Mestra no fluxo de trabalho
          </span>
          {showSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSpecs && (
          <div className="text-xs text-slate-300 space-y-2 pt-2 border-t border-blue-500/20 leading-relaxed">
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>
                <strong className="text-white">Etapa 1:</strong> Copie o prompt acima e gere no seu gerador de imagem preferido (Midjourney v6, Flux.1 Pro, Kling Image ou DALL-E).
              </li>
              <li>
                <strong className="text-white">Etapa 2:</strong> A imagem resultante terá todos os personagens lado a lado sobre fundo branco puro com roupas, calçados e rostos travados.
              </li>
              <li>
                <strong className="text-white">Etapa 3:</strong> Nos prompts seguintes (Takes 01 ao N), envie esta imagem como âncora de referência visual (Character Reference / Image-to-Video no Kling, Runway Gen-3 ou Sora).
              </li>
              <li>
                <strong className="text-white">Preservação Inviolável:</strong> A identidade, rosto, cabelo, roupas e traços físicos estabelecidos no PROMPT 00 são mantidos rigorosamente durante toda a narrativa.
              </li>
            </ol>
            {promptZero.modelTips && (
              <p className="text-[11px] text-blue-300/90 font-mono bg-blue-950/60 p-2 rounded-lg border border-blue-500/20">
                💡 Dica do Diretor: {promptZero.modelTips}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
