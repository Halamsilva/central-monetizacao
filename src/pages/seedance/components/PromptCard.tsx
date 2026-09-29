import React, { useState, useEffect } from "react";
import { ScenePrompt } from "../types";
import { supabase } from '../../../lib/supabase';
import { Copy, Check, MessageSquare, Video, HelpCircle, Layers, RefreshCw, Sparkles, Sliders, Pencil, X } from "lucide-react";

interface PromptCardProps {
  key?: any;
  prompt: ScenePrompt;
  onAdjust: (adjustedPrompt: ScenePrompt) => void;
}

export default function PromptCard({ prompt, onAdjust }: PromptCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAdjusting, setIsAdjusting] = useState<string | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isEditingFala, setIsEditingFala] = useState(false);
  const [editedFala, setEditedFala] = useState(prompt.fala);

  useEffect(() => {
    setEditedFala(prompt.fala);
  }, [prompt.fala]);

  const handleSaveFala = () => {
    if (!editedFala.trim()) return;
    onAdjust({
      ...prompt,
      fala: editedFala.trim(),
    });
    setIsEditingFala(false);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getFullBlockText = () => {
    return `${prompt.title}
========================================
FALA DO PERSONAGEM (Português BR):
"${prompt.fala}"

CENÁRIO (Scenario):
${prompt.cenario}

APRESENTADOR E ROUPA:
Modelo: ${prompt.personagem}
Roupa: ${prompt.roupa}

CÂMERA E ILUMINAÇÃO:
Movimento: ${prompt.camera}
Luz: ${prompt.iluminacao}

AÇÃO & FÍSICA (Causalidade):
${prompt.acao}

FIDELIDADE DO PRODUTO:
${prompt.produto}

CONTINUIDADE (Estabilidade):
${prompt.continuidade}

PROMPT TÉCNICO CONSOLIDADO (Seedance Format):
${prompt.fullSeedancePrompt}

RESTRIÇÕES NEGATIVAS:
${prompt.restricoesNegativas}`;
  };

  const handleQuickAdjust = async (instruction: string) => {
    setIsAdjusting(instruction);
    setAdjustError(null);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || "";
      const response = await fetch("/api/agents/seedance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ action: "adjust-prompt", scene: prompt, instruction }),
      });
      if (response.ok) {
        const adjusted = await response.json();
        onAdjust(adjusted);
      } else {
        const errData = await response.json().catch(() => ({}));
        setAdjustError(errData.error || "Erro temporário ao ajustar. Tente novamente.");
        setTimeout(() => setAdjustError(null), 4000);
      }
    } catch (err: any) {
      setAdjustError("Falha de conexão. Tente novamente.");
      setTimeout(() => setAdjustError(null), 4000);
    } finally {
      setIsAdjusting(null);
    }
  };

  const isHookScene = prompt.title.toLowerCase().includes("gancho") || 
                      prompt.title.toLowerCase().includes("hook") || 
                      prompt.title.toLowerCase().includes("prompt 1");

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md mb-6" id={`prompt-card-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}>
      {/* Header */}
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-6 rounded-full ${isHookScene ? "bg-amber-500" : "bg-emerald-600"}`} />
          <h4 className="font-bold text-slate-900 tracking-tight">{prompt.title}</h4>
          {isHookScene && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1 shadow-xs">
              🎯 Protagonista • Fidelidade Exata 1:1
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Option 1: Copy Consolidated Block */}
          <button
            onClick={() => handleCopy(getFullBlockText(), "full-block")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer"
            title="Copiar bloco completo: Título, falas, todos os parâmetros e o prompt negativo"
            id={`copy-full-block-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {copiedField === "full-block" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bloco Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copiar Bloco Completo</span>
              </>
            )}
          </button>

          {/* Option 2: Copy Seedance format Prompt */}
          <button
            onClick={() => handleCopy(prompt.fullSeedancePrompt, "full")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Copiar apenas o prompt consolidado em inglês para o Seedance"
            id={`copy-full-prompt-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {copiedField === "full" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prompt Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar Prompt Seedance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Fala em Destaque */}
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 relative overflow-hidden">
          <div className="absolute right-3 top-3 text-emerald-200/50 pointer-events-none">
            <MessageSquare className="w-12 h-12 stroke-[3]" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                Fala do Personagem (Português BR)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs ${
                prompt.fala && prompt.fala.trim().split(/\s+/).filter(Boolean).length <= 22
                  ? "text-emerald-800 bg-emerald-100 border-emerald-300"
                  : "text-amber-900 bg-amber-100 border-amber-300"
              }`} title="Duração estimada: tempo máximo permitido é 9 segundos por prompt">
                ⏱️ ~{Math.max(2, Math.min(12, Math.round((prompt.fala || "").trim().split(/\s+/).filter(Boolean).length / 2.2)))}s (≤ 9s)
              </span>
            </div>
            <div className="flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={() => {
                  if (isEditingFala) {
                    setIsEditingFala(false);
                    setEditedFala(prompt.fala);
                  } else {
                    setIsEditingFala(true);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100/80 rounded-md transition-all cursor-pointer border border-emerald-200/60 bg-white shadow-2xs"
                title={isEditingFala ? "Cancelar edição" : "Editar fala desta cena"}
              >
                {isEditingFala ? (
                  <>
                    <X className="w-3 h-3 text-slate-500" />
                    <span>Cancelar</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-3 h-3 text-emerald-700" />
                    <span>Editar Fala</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleCopy(prompt.fala, "fala")}
                className="p-1 text-emerald-700 hover:bg-emerald-100/60 rounded-md transition-all cursor-pointer"
                title="Copiar apenas a fala"
                id={`copy-fala-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {copiedField === "fala" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {isEditingFala ? (
            <div className="space-y-2 mt-2">
              <textarea
                value={editedFala}
                onChange={(e) => setEditedFala(e.target.value)}
                rows={3}
                className="w-full text-sm bg-white border border-emerald-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 font-medium leading-relaxed"
                placeholder="Digite a fala falada nesta cena..."
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-semibold flex items-center gap-1 ${
                  editedFala.trim().split(/\s+/).filter(Boolean).length <= 22
                    ? "text-emerald-700"
                    : "text-amber-800 font-bold"
                }`}>
                  ⏱️ ~{Math.max(1, Math.round(editedFala.trim().split(/\s+/).filter(Boolean).length / 2.2))}s 
                  ({editedFala.trim().split(/\s+/).filter(Boolean).length} palavras • máx. 9s / ~22 palavras)
                </span>
                <button
                  type="button"
                  onClick={handleSaveFala}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  Salvar Fala
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-800 font-medium text-base leading-relaxed italic">
              "{prompt.fala}"
            </p>
          )}

          {/* Camada de Neuromarketing & Ativação do Subconsciente da Fala */}
          <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                🧠 Ativação do Subconsciente:
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full">
                {prompt.gatilhoSubconsciente?.fase || (
                  isHookScene 
                    ? "Fala 1 — Quebra de Padrão e Atenção Involuntária (0–8s)" 
                    : "Ativação de Neurônios-Espelho & Indução ao Carrinho"
                )}
              </span>
            </div>

            <div className="bg-white/80 border border-emerald-200/60 rounded-lg p-2.5 text-xs text-slate-700 space-y-1.5 shadow-2xs">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-emerald-900 shrink-0">🎯 Gatilho Primitivo:</span>
                <span className="text-slate-700">
                  {prompt.gatilhoSubconsciente?.gatilhoPrimitivo || (
                    isHookScene
                      ? "Desarma o filtro racional nos primeiros 2s com gancho sensorial ou validação social autêntica."
                      : "Neurônios-espelho estimulados por vocabulário tátil e valor percebido indiscutível."
                  )}
                </span>
              </div>

              {prompt.gatilhoSubconsciente?.analisePsicologica && (
                <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-800 shrink-0">💡 Mecanismo Límbico:</span>
                  <span>{prompt.gatilhoSubconsciente.analisePsicologica}</span>
                </div>
              )}

              {prompt.gatilhoSubconsciente?.palavrasChaveSensoriais && prompt.gatilhoSubconsciente.palavrasChaveSensoriais.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-emerald-100">
                  <span className="text-[10px] font-semibold text-slate-500">Âncoras Sensoriais:</span>
                  {prompt.gatilhoSubconsciente.palavrasChaveSensoriais.map((kw, i) => (
                    <span key={i} className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded">
                      "{kw}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Parâmetros em Grade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* Parâmetro: Cenário */}
          <div className="p-3.5 bg-slate-50/40 border border-slate-100 rounded-xl">
            <span className="font-semibold text-slate-700 block mb-1">Cenário (Scenario)</span>
            <p className="text-slate-600 text-xs leading-relaxed">{prompt.cenario}</p>
          </div>

          {/* Parâmetro: Personagem e Roupa */}
          <div className="p-3.5 bg-slate-50/40 border border-slate-100 rounded-xl">
            <span className="font-semibold text-slate-700 block mb-1">Apresentador e Roupa</span>
            <p className="text-slate-600 text-xs leading-relaxed">
              <strong className="text-slate-700">Modelo:</strong> {prompt.personagem} <br />
              <strong className="text-slate-700">Roupa:</strong> {prompt.roupa}
            </p>
          </div>

          {/* Parâmetro: Câmera e Iluminação */}
          <div className="p-3.5 bg-slate-50/40 border border-slate-100 rounded-xl">
            <span className="font-semibold text-slate-700 block mb-1">Câmera e Iluminação</span>
            <p className="text-slate-600 text-xs leading-relaxed">
              <strong className="text-slate-700">Movimento:</strong> {prompt.camera} <br />
              <strong className="text-slate-700">Luz:</strong> {prompt.iluminacao}
            </p>
          </div>

          {/* Parâmetro: Ação & Física */}
          <div className="p-3.5 bg-slate-50/40 border border-slate-100 rounded-xl">
            <span className="font-semibold text-slate-700 block mb-1">Ação & Física (Causalidade)</span>
            <p className="text-slate-600 text-xs leading-relaxed">{prompt.acao}</p>
          </div>

          {/* Parâmetro: Fidelidade Produto */}
          <div className="p-3.5 bg-slate-50/40 border border-slate-100 rounded-xl">
            <span className="font-semibold text-slate-700 block mb-1">Fidelidade do Produto</span>
            <p className="text-slate-600 text-xs leading-relaxed">{prompt.produto}</p>
          </div>

          {/* Parâmetro: Continuidade */}
          <div className="p-3.5 bg-slate-50/40 border border-slate-100 rounded-xl">
            <span className="font-semibold text-slate-700 block mb-1">Continuidade (Estabilidade)</span>
            <p className="text-slate-600 text-xs leading-relaxed">{prompt.continuidade}</p>
          </div>
        </div>

        {/* Prompt Final Completo para Seedance */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-slate-400" />
            Prompt Técnico Consolidado (Seedance Format)
          </span>
          <div className="relative group/code">
            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-[140px] border border-slate-800">
              {prompt.fullSeedancePrompt}
            </pre>
            <button
              onClick={() => handleCopy(prompt.fullSeedancePrompt, "tech")}
              className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 opacity-0 group-hover/code:opacity-100 transition-opacity"
              title="Copiar prompt técnico"
              id={`copy-tech-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {copiedField === "tech" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Restrições Negativas */}
        <div className="p-3 bg-rose-50/30 border border-rose-100/50 rounded-xl flex gap-2 items-start text-xs text-rose-800">
          <span className="font-semibold uppercase tracking-wider shrink-0 mt-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-md">
            Negatives:
          </span>
          <p className="leading-relaxed font-mono opacity-90">{prompt.restricoesNegativas}</p>
        </div>

        {/* Micro-Ajustes */}
        <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              🧠 Calibrar Alvo Psicológico & Neuromarketing:
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">Ativação do Subconsciente</span>
          </div>

          {/* Neuromarketing targets row */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickAdjust("aplicar camada de neuromarketing: Ativação 360° do Subconsciente (equilíbrio hipnótico). Calibrar a fala com quebra de padrão inicial nos primeiros 2s, vocabulário sinestésico estimulando neurônios-espelho e comando irresistível no carrinho laranja.")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 disabled:opacity-50 text-emerald-950 text-xs font-bold rounded-lg transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
              title="Ativação 360° do Subconsciente (Equilíbrio hipnótico completo)"
            >
              {isAdjusting && isAdjusting.includes("Ativação 360° do Subconsciente") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
              ) : (
                <span>🌀 360° Subconsciente</span>
              )}
            </button>

            <button
              onClick={() => handleQuickAdjust("aplicar camada de neuromarketing: Status & Superioridade Invisível (desejo de alto padrão). Usar vocabulário tátil e sinestésico de alto valor percebido ('peso firme na mão', 'toque aveludado', 'acabamento de hotel de luxo') que faz o cérebro sentir o produto e desejar o status antes mesmo de comprar.")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-950 text-xs font-bold rounded-lg transition-colors border border-amber-300 shadow-2xs cursor-pointer"
              title="Status & Superioridade Invisível (Desejo de alto padrão e distinção)"
            >
              {isAdjusting && isAdjusting.includes("Status & Superioridade Invisível") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-amber-700" />
              ) : (
                <span>👑 Status & Superioridade</span>
              )}
            </button>

            <button
              onClick={() => handleQuickAdjust("aplicar camada de neuromarketing: Magnetismo Pessoal & Atração. Ativar desejos primitivos (atração do sexo oposto, elogios espontâneos, segurança e orgulho) e finalizar com a indução irresistível de clicar no carrinho laranja.")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-950 text-xs font-bold rounded-lg transition-colors border border-rose-300 shadow-2xs cursor-pointer"
              title="Magnetismo Pessoal & Atração (Desejos primitivos, sexo oposto e elogios)"
            >
              {isAdjusting && isAdjusting.includes("Magnetismo Pessoal & Atração") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-rose-700" />
              ) : (
                <span>🔥 Magnetismo & Atração</span>
              )}
            </button>

            <button
              onClick={() => handleQuickAdjust("aplicar camada de neuromarketing: Alívio da Frustração Oculta. Economia de energia mental, sensação imediata de alívio e conforto prático, extinguindo o estresse da rotina brasileira.")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 disabled:opacity-50 text-cyan-950 text-xs font-bold rounded-lg transition-colors border border-cyan-300 shadow-2xs cursor-pointer"
              title="Alívio da Frustração Oculta (Economia de energia mental e conforto prático)"
            >
              {isAdjusting && isAdjusting.includes("Alívio da Frustração Oculta") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-700" />
              ) : (
                <span>🧘 Alívio da Frustração</span>
              )}
            </button>

            <button
              onClick={() => handleQuickAdjust("aplicar camada de neuromarketing: Neurônios-Espelho e Sinestesia Tátil. Usar vocabulário sensorial vívido que faz o cérebro sentir o produto fisicamente ('peso firme', 'toque aveludado', 'absorve na hora').")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-950 text-xs font-bold rounded-lg transition-colors border border-indigo-300 shadow-2xs cursor-pointer"
              title="Neurônios-Espelho e Sinestesia Tátil"
            >
              {isAdjusting && isAdjusting.includes("Neurônios-Espelho") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-700" />
              ) : (
                <span>⚡ Neurônios-Espelho (Tátil)</span>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              Refinamentos de Vídeo e Cinemática:
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickAdjust("não gire o produto de uma vez so mudando de posição brusca , sempre que precisar girar o produto girar ele de vagar mostrando os detalhes sem deformar: executar rotação ultra-lenta, suave e deliberada das mãos em velocidade angular calma e contínua, permitindo visualizar com clareza cada detalhe, textura, relevo e acabamento sem deformação e com física de corpo sólido rígido 100% indeformável")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-950 text-xs font-bold rounded-lg transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
              id={`adjust-slow-spin-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Girar sempre devagar mostrando os detalhes sem deformar, sem giros bruscos"
            >
              {isAdjusting && isAdjusting.includes("não gire o produto de uma vez") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
              ) : (
                <span>🔄 Girar Devagar (Sem Deformar)</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("evitar cortes de cenas sem sentido: garantir continuidade fluida e lógica com a cena anterior/seguinte (match-action cut), mantendo a mesma postura corporal, mesma posição do produto, mesmo eixo cinematográfico de 180° de câmera, sem saltos bruscos, sem teletransporte e filmagem em take único contínuo")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 text-violet-950 text-xs font-bold rounded-lg transition-colors border border-violet-300 shadow-2xs cursor-pointer"
              id={`adjust-match-cut-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Eliminar cortes sem sentido e garantir transição fluida contínua de match-action"
            >
              {isAdjusting && isAdjusting.includes("evitar cortes de cenas sem sentido") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-violet-700" />
              ) : (
                <span>🎬 Sem Cortes Bruscos (Match-Cut)</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("posicionar o produto como protagonista absoluto em close-up em primeiro plano nítido, com ação física imediata das mãos demonstrando o produto logo no primeiro segundo")}
              disabled={isAdjusting !== null}
              className={`flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors border shadow-2xs cursor-pointer ${
                isHookScene 
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300" 
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200"
              }`}
              id={`adjust-hero-product-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Colocar o produto como estrela principal em close-up com ação imediata"
            >
              {isAdjusting === "posicionar o produto como protagonista absoluto em close-up em primeiro plano nítido, com ação física imediata das mãos demonstrando o produto logo no primeiro segundo" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-amber-700" />
              ) : (
                <span>🎯 Produto Protagonista (Hero)</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("melhorar o gancho com foco em mostrar o produto com fidelidade física exata 1:1 à foto de referência (geometria exata, acabamento real, cores e close-up macro de inspeção)")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-900 text-xs font-bold rounded-lg transition-colors border border-blue-200 shadow-2xs cursor-pointer"
              id={`adjust-fidelity-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Reforçar inspeção macro com fidelidade geométrica e de materiais exata ao produto real"
            >
              {isAdjusting === "melhorar o gancho com foco em mostrar o produto com fidelidade física exata 1:1 à foto de referência (geometria exata, acabamento real, cores e close-up macro de inspeção)" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-blue-700" />
              ) : (
                <span>🔬 Fidelidade Exata</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("corrigir para manter rigorosamente a escala física 1:1, o formato geométrico 3D (silhueta, tampa, corpo, bicos/solado) e a estrutura física rígida do produto, idênticos à referência e às demais tomadas, sem produto gigante, sem deformação e sem morphing dimensional")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-900 text-xs font-bold rounded-lg transition-colors border border-indigo-200 shadow-2xs cursor-pointer"
              id={`adjust-scale-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Manter escala 1:1, formato geométrico e estrutura física do produto sem deformações ou morphing"
            >
              {isAdjusting === "corrigir para manter rigorosamente a escala física 1:1, o formato geométrico 3D (silhueta, tampa, corpo, bicos/solado) e a estrutura física rígida do produto, idênticos à referência e às demais tomadas, sem produto gigante, sem deformação e sem morphing dimensional" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-700" />
              ) : (
                <span>📐 Escala, Formato & Estrutura 1:1</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("melhorar a movimentação do produto para ser ultra-fluida, natural e realista: cinemática de mão autêntica com inércia física real e peso tátil (natural handheld kinematics, realistic mass and tactile inertia, subtle organic breathing sway), micro-tilt controlado de 5° a 10° que faz a luz natural deslizar suavemente pelas arestas e texturas (specular sheen pass rolling across surfaces) revelando acabamento real sem deformar a peça, toques dos dedos com colisão de superfície 100% sólida (zero fingers clipping into mesh), acionamento mecânico linear suave, tracking sincronizado de câmera steadycam com parallax tridimensional e física de corpo sólido 100% indeformável (zero jelly effect, zero warping)")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 disabled:opacity-50 text-cyan-950 text-xs font-bold rounded-lg transition-colors border border-cyan-300 shadow-2xs cursor-pointer"
              id={`adjust-motion-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Melhorar a movimentação do produto (cinemática realista, inércia física, micro-tilt de luz especular, colisão sólida e corpo rígido indeformável)"
            >
              {isAdjusting && isAdjusting.includes("melhorar a movimentação do produto para ser ultra-fluida") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-700" />
              ) : (
                <span>🎬 Movimentação Fluida & Realista</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("adaptar a cena para produto de beleza: não falar do pote ou embalagem, mostrar a pessoa usando a fórmula de forma natural no dia a dia em frente ao espelho com iluminação suave, com foco em dor e solução prática brasileira (oleosidade/calor, pele repuxando, cansaço, viço imediato e alívio com cupom no carrinho)")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 disabled:opacity-50 text-pink-950 text-xs font-bold rounded-lg transition-colors border border-pink-200 shadow-2xs cursor-pointer"
              id={`adjust-beleza-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Ajustar para produto de beleza com uso natural da fórmula e dor/solução, sem falar do pote"
            >
              {isAdjusting === "adaptar a cena para produto de beleza: não falar do pote ou embalagem, mostrar a pessoa usando a fórmula de forma natural no dia a dia em frente ao espelho com iluminação suave, com foco em dor e solução prática brasileira (oleosidade/calor, pele repuxando, cansaço, viço imediato e alívio com cupom no carrinho)" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-pink-700" />
              ) : (
                <span>🧴 Uso Natural (Sem Pote)</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("adaptar o cenário desta cena para ser 100% coerente e natural com este tipo de produto: posicionar a ação no cômodo doméstico ou profissional mais verossímil onde ele é realmente usado (ex: cozinha/bancada para culinária/panelas/garrafas, banheiro com espelho para skincare/higiene, quarto/closet para roupas/vaporizadores, mesa para itens tech/escritório, hall de entrada/chão para calçados), com iluminação natural adequada e suave")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-950 text-xs font-bold rounded-lg transition-colors border border-amber-300 shadow-2xs cursor-pointer"
              id={`adjust-cenario-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Adaptar o cenário para ser 100% coerente e natural com este tipo de produto"
            >
              {isAdjusting === "adaptar o cenário desta cena para ser 100% coerente e natural com este tipo de produto: posicionar a ação no cômodo doméstico ou profissional mais verossímil onde ele é realmente usado (ex: cozinha/bancada para culinária/panelas/garrafas, banheiro com espelho para skincare/higiene, quarto/closet para roupas/vaporizadores, mesa para itens tech/escritório, hall de entrada/chão para calçados), com iluminação natural adequada e suave" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-amber-700" />
              ) : (
                <span>🏠 Cenário Coerente</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("melhorar a fala para falar sobre o produto e deixar 100% claro o que está sendo vendido: identificar a categoria do produto, explicar como funciona na prática, seus atributos físicos reais e o problema que resolve, eliminando termos vagos e mantendo tom natural brasileiro, sem marcas e sem preços")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-950 text-xs font-bold rounded-lg transition-colors border border-blue-300 shadow-2xs cursor-pointer"
              id={`adjust-clareza-produto-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Deixar claro nas falas o que está sendo vendido e falar sobre as características do produto"
            >
              {isAdjusting === "melhorar a fala para falar sobre o produto e deixar 100% claro o que está sendo vendido: identificar a categoria do produto, explicar como funciona na prática, seus atributos físicos reais e o problema que resolve, eliminando termos vagos e mantendo tom natural brasileiro, sem marcas e sem preços" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-blue-700" />
              ) : (
                <span>🔍 Clareza do Produto</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("corrigir a fala e a atitude da cena para NUNCA falar mal segurando o produto: o público não pode achar que é o produto que está à venda que está sendo criticado. Apresente o produto em mãos com entusiasmo como a solução salvadora que resolveu a dor anterior da rotina")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 text-teal-950 text-xs font-bold rounded-lg transition-colors border border-teal-200 shadow-2xs cursor-pointer"
              id={`adjust-solution-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Garantir que o produto em mãos seja apresentado como solução salvadora, sem nunca criticar segurando a peça"
            >
              {isAdjusting === "corrigir a fala e a atitude da cena para NUNCA falar mal segurando o produto: o público não pode achar que é o produto que está à venda que está sendo criticado. Apresente o produto em mãos com entusiasmo como a solução salvadora que resolveu a dor anterior da rotina" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-teal-700" />
              ) : (
                <span>👍 Produto é a Solução (Não Falar Mal)</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("remover qualquer texto ou legenda do vídeo: filmagem 100% limpa (clean footage), sem títulos, sem legendas na tela, sem caixas de texto ou overlays gráficos, com restrições negativas completas contra on-screen text")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-950 text-xs font-bold rounded-lg transition-colors border border-rose-300 shadow-2xs cursor-pointer"
              id={`adjust-sem-texto-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Garantir filmagem 100% limpa sem textos na tela ou legendas"
            >
              {isAdjusting === "remover qualquer texto ou legenda do vídeo: filmagem 100% limpa (clean footage), sem títulos, sem legendas na tela, sem caixas de texto ou overlays gráficos, com restrições negativas completas contra on-screen text" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-rose-700" />
              ) : (
                <span>🚫 Sem Texto no Vídeo</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("não adicione trilha sonora nos prompts: remover qualquer menção a música de fundo ou trilha sonora, focar exclusivamente na voz falada direta e acústica orgânica ambiente, com restrições negativas completas contra soundtrack, background music e musical score")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-lg transition-colors border border-slate-300 shadow-2xs cursor-pointer"
              id={`adjust-sem-trilha-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Garantir zero trilha sonora nos prompts (apenas fala e áudio ambiente real)"
            >
              {isAdjusting && isAdjusting.includes("não adicione trilha sonora") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-slate-700" />
              ) : (
                <span>🔇 Sem Trilha Sonora</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("não adicionar banner de carrinho laranja , não adicionar texto na tela do vídeo, não adicionar emoje não adicionar imagem na tela: filmagem 100% limpa (clean footage), sem carrinho desenhado, sem legendas, sem textos, sem emojis e sem fotos sobrepostas")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-950 text-xs font-bold rounded-lg transition-colors border border-rose-300 shadow-2xs cursor-pointer"
              id={`adjust-sem-banner-texto-emoji-imagem-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Garantir zero banner de carrinho laranja, zero texto na tela, zero emojis e zero imagens/fotos sobrepostas"
            >
              {isAdjusting && isAdjusting.includes("não adicionar banner de carrinho laranja") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-rose-700" />
              ) : (
                <span>🚫 Sem Banner, Texto, Emoji ou Imagem</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("gere falas condizentes com o produto e com o uso dele para o publico do brasil: identificar explicitamente a categoria funcional do item, explicar como funciona na prática (textura, vedação, lâminas, amortecimento, absorção), conectar ao uso real e dores da rotina brasileira (mormaço/calor, correria da manhã, transporte, trabalho, praticidade) com vocabulário oral autêntico e contrações naturais (pra, pro, tô, tava, na boa, gente) sem marcas e sem preços")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-950 text-xs font-bold rounded-lg transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
              id={`adjust-falas-condizentes-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Gerar falas 100% condizentes com o produto e com o uso dele para o público do Brasil"
            >
              {isAdjusting && isAdjusting.includes("gere falas condizentes com o produto e com o uso dele para o publico do brasil") ? (
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
              ) : (
                <span>🇧🇷 Falas do Uso Real (Brasil)</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("deixar com o tom 100% natural para o público do Brasil: fala coloquial, espontânea e autêntica como áudio de WhatsApp de um amigo, com contrações orais pra/pro/tô/tava/né/gente, sem jargão de comercial ou dublagem, conectada ao dia a dia real brasileiro")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-950 text-xs font-bold rounded-lg transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
              id={`adjust-tom-natural-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Deixar com tom 100% natural, coloquial e autêntico para o público do Brasil"
            >
              {isAdjusting === "deixar com o tom 100% natural para o público do Brasil: fala coloquial, espontânea e autêntica como áudio de WhatsApp de um amigo, com contrações orais pra/pro/tô/tava/né/gente, sem jargão de comercial ou dublagem, conectada ao dia a dia real brasileiro" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
              ) : (
                <span>🇧🇷 Tom Natural BR</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("adaptar a cena para ser 100% coerente com as demais tomadas e contextualizada no uso prático do dia a dia real no Brasil (rotina matinal/trabalho, calor, praticidade sem complicação e linguagem espontânea brasileira)")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-900 text-xs font-bold rounded-lg transition-colors border border-emerald-200 shadow-2xs cursor-pointer"
              id={`adjust-brasil-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Ajustar para coerência de cena e uso prático no cotidiano brasileiro"
            >
              {isAdjusting === "adaptar a cena para ser 100% coerente com as demais tomadas e contextualizada no uso prático do dia a dia real no Brasil (rotina matinal/trabalho, calor, praticidade sem complicação e linguagem espontânea brasileira)" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
              ) : (
                <span>🇧🇷 Dia a Dia Brasil</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("criar uma fala alternativa diferente")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 disabled:opacity-50 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200/40"
              id={`adjust-fala-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {isAdjusting === "criar uma fala alternativa diferente" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
              ) : (
                <MessageSquare className="w-3 h-3 text-slate-500" />
              )}
              Outra Fala
            </button>
            <button
              onClick={() => handleQuickAdjust("melhorar os detalhes de câmera para parecer mais UGC orgânico")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 disabled:opacity-50 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200/40"
              id={`adjust-camera-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {isAdjusting === "melhorar os detalhes de câmera para parecer mais UGC orgânico" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
              ) : (
                <Video className="w-3 h-3 text-slate-500" />
              )}
              Melhorar Câmera
            </button>
            <button
              onClick={() => handleQuickAdjust("aumentar detalhes de física e causalidade na demonstração física do produto")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 disabled:opacity-50 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200/40"
              id={`adjust-physics-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {isAdjusting === "aumentar detalhes de física e causalidade na demonstração física do produto" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
              ) : (
                <Sparkles className="w-3 h-3 text-slate-500" />
              )}
              Refinar Física
            </button>
            <button
              onClick={() => handleQuickAdjust("mudar para voz masculina e apresentador homem com concordância gramatical masculina")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/70 disabled:opacity-50 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200/40"
              id={`adjust-male-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Mudar cena para voz masculina e concordância gramatical masculina"
            >
              {isAdjusting === "mudar para voz masculina e apresentador homem com concordância gramatical masculina" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
              ) : (
                <span>👨 Voz Masculina</span>
              )}
            </button>
            <button
              onClick={() => handleQuickAdjust("mudar para voz feminina e apresentadora mulher com concordância gramatical feminina")}
              disabled={isAdjusting !== null}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/70 disabled:opacity-50 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200/40"
              id={`adjust-female-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`}
              title="Mudar cena para voz feminina e concordância gramatical feminina"
            >
              {isAdjusting === "mudar para voz feminina e apresentadora mulher com concordância gramatical feminina" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
              ) : (
                <span>👩 Voz Feminina</span>
              )}
            </button>
          </div>
        </div>
        {adjustError && (
          <div className="mt-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center justify-between">
            <span>{adjustError}</span>
            <button onClick={() => setAdjustError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">×</button>
          </div>
        )}
      </div>
    </div>
  );
}
