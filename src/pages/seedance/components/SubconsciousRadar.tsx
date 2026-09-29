import React, { useState } from "react";
import { 
  Brain, 
  Zap, 
  Crown, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  Hand, 
  ShoppingCart, 
  Activity,
  BarChart3
} from "lucide-react";
import { NeuromarketingAudit, ScenePrompt } from "../types";

interface SubconsciousRadarProps {
  audit?: NeuromarketingAudit;
  prompts: ScenePrompt[];
  activeTarget?: string;
  onSelectTarget?: (target: string) => void;
}

export const PSYCHOLOGICAL_TARGETS = [
  {
    id: "360",
    name: "Ativação 360° do Subconsciente",
    badge: "Equilíbrio Hipnótico",
    icon: Brain,
    color: "from-emerald-500 to-teal-600",
    border: "border-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    description: "Orquestração completa dos 6 gatilhos primitivos com quebra de padrão, sinestesia dos neurônios-espelho e comando de carrinho laranja.",
  },
  {
    id: "status",
    name: "Status & Superioridade Invisível",
    badge: "Desejo de Alto Padrão",
    icon: Crown,
    color: "from-amber-500 to-yellow-600",
    border: "border-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-900",
    description: "Ativa o desejo visceral de exclusividade, acabamento impecável e respeito silencioso que faz quem vê desejar ter o mesmo padrão.",
  },
  {
    id: "magnetismo",
    name: "Magnetismo Pessoal & Atração",
    badge: "Presença Marcante & Desejos Primitivos",
    icon: Flame,
    color: "from-rose-500 to-orange-600",
    border: "border-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-900",
    description: "Conecta o produto à atração irresistível, elogios inevitáveis de terceiros, olhares de admiração e segurança pessoal inabalável.",
  },
  {
    id: "alivio",
    name: "Alívio da Frustração Oculta",
    badge: "Economia Mental & Conforto",
    icon: ShieldCheck,
    color: "from-cyan-500 to-blue-600",
    border: "border-cyan-500",
    bg: "bg-cyan-50",
    text: "text-cyan-900",
    description: "Mata a ansiedade da rotina desgastante, proporcionando sensação imediata de alívio, praticidade extrema e paz de espírito.",
  },
];

export default function SubconsciousRadar({ 
  audit, 
  prompts, 
  activeTarget = "Ativação 360° do Subconsciente",
  onSelectTarget
}: SubconsciousRadarProps) {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);

  // Fallback metrics if audit not fully populated yet
  const defaultTriggers = {
    quebraDePadrao: 95,
    neuroniosEspelho: 92,
    superioridadeStatus: 89,
    magnetismoAtracao: 91,
    alivioFrustracao: 94,
    aversaoPerda: 96,
  };

  const triggers = audit?.gatilhosDisparados || defaultTriggers;
  const overallScore = audit?.scoreGeralPenetracao || 94;
  const currentScene = prompts[selectedSceneIndex] || prompts[0];
  const triggerData = currentScene?.gatilhoSubconsciente;

  const primitiveTriggersList = [
    {
      id: "quebra",
      label: "Quebra de Padrão & Atenção Involuntária",
      time: "0–8s",
      score: triggers.quebraDePadrao,
      icon: Eye,
      color: "bg-gradient-to-r from-amber-500 to-orange-500",
      textColor: "text-amber-800",
      bgLight: "bg-amber-50",
      description: "Desarma o filtro racional nos primeiros 2s com gancho sensorial ou validação social imediata.",
      keywords: ["todo mundo perguntou", "quem bate o olho percebe de cara", "inacreditável", "repare nisso"]
    },
    {
      id: "espelho",
      label: "Neurônios-Espelho & Sinestesia Tátil",
      time: "8–16s",
      score: triggers.neuroniosEspelho,
      icon: Hand,
      color: "bg-gradient-to-r from-emerald-500 to-teal-500",
      textColor: "text-emerald-800",
      bgLight: "bg-emerald-50",
      description: "Vocabulário tátil que faz o cérebro do público sentir a textura física antes mesmo de comprar.",
      keywords: ["peso firme na mão", "toque aveludado", "acabamento de hotel de luxo", "frescor instantâneo"]
    },
    {
      id: "status",
      label: "Superioridade Invisível & Alto Padrão",
      time: "Geral",
      score: triggers.superioridadeStatus,
      icon: Crown,
      color: "bg-gradient-to-r from-yellow-500 to-amber-600",
      textColor: "text-amber-900",
      bgLight: "bg-amber-50/70",
      description: "Ativa o desejo primal de distinção social, refinamento e bom gosto incontestável.",
      keywords: ["nível premium", "outro patamar", "acabamento fino", "chama atenção"]
    },
    {
      id: "magnetismo",
      label: "Magnetismo Pessoal & Desejos Primitivos",
      time: "16–24s",
      score: triggers.magnetismoAtracao,
      icon: Flame,
      color: "bg-gradient-to-r from-rose-500 to-pink-500",
      textColor: "text-rose-900",
      bgLight: "bg-rose-50",
      description: "Dispara atração do sexo oposto, elogios inevitáveis, orgulho e presença marcante.",
      keywords: ["elogios o dia todo", "impossível passar despercebido", "olham de volta", "presença"]
    },
    {
      id: "alivio",
      label: "Alívio da Frustração Oculta",
      time: "Geral",
      score: triggers.alivioFrustracao,
      icon: ShieldCheck,
      color: "bg-gradient-to-r from-cyan-500 to-blue-500",
      textColor: "text-cyan-900",
      bgLight: "bg-cyan-50",
      description: "Economia imediata de energia mental e conforto prático, extinguindo o sofrimento da rotina.",
      keywords: ["salvou meu dia", "zero estresse", "alívio na hora", "sem complicação"]
    },
    {
      id: "carrinho",
      label: "Aversão à Perda & Comando Carrinho Laranja",
      time: "Final",
      score: triggers.aversaoPerda,
      icon: ShoppingCart,
      color: "bg-gradient-to-r from-orange-500 to-red-500",
      textColor: "text-orange-900",
      bgLight: "bg-orange-50",
      description: "FOMO e urgência visceral que culminam na indução irresistível de clicar no carrinho laranja.",
      keywords: ["carrinho laranja", "cupom liberado", "antes que acabe o lote", "estoque no fim"]
    }
  ];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden" id="subconscious-radar-panel">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-lg tracking-tight flex items-center gap-2">
                Radar de Penetração Subconsciente
              </h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold tracking-wider rounded-md flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                Auditoria em Tempo Real
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Camada de Neuromarketing: monitorando gatilhos primitivos disparados pelas falas no cérebro do público
            </p>
          </div>
        </div>

        {/* Global Subconscious Score Gauge */}
        <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/80 px-4 py-2 rounded-xl">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Penetração Límbica
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              Alta Eficácia Persuasiva
            </span>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-lg shadow-md shadow-emerald-900/50">
            {overallScore}%
          </div>
        </div>
      </div>

      {/* Target Status Banner */}
      <div className="mt-4 p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-slate-300">
            <strong className="text-white">Alvo Psicológico Ativo:</strong> {audit?.alvoPrincipal || activeTarget}
          </span>
        </div>
        <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
          Gatilhos calibrados para conversão máxima no TikTok Shop
        </span>
      </div>

      {/* Strategic Summary if present */}
      {audit?.resumoEstrategico && (
        <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-200/90 leading-relaxed">
          <strong className="text-emerald-300 block mb-0.5">Diagnóstico Neurológico:</strong>
          {audit.resumoEstrategico}
        </div>
      )}

      {/* Primitive Triggers Real-Time Audit Meters Grid */}
      <div className="mt-6 space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            Níveis de Ativação dos Gatilhos Primitivos
          </span>
          <span className="text-[11px] text-slate-400">
            Filtro Racional → Desejo Sensorial → Ação no Carrinho Laranja
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {primitiveTriggersList.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id} 
                className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-700/60 text-slate-200">
                      <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-200 leading-tight">
                        {item.label}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.time}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    {item.score}%
                  </span>
                </div>

                {/* Progress Meter Bar */}
                <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {item.keywords.slice(0, 2).map((kw, i) => (
                    <span key={i} className="text-[9px] bg-slate-900/90 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                      "{kw}"
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scene-by-Scene Subconscious Dissection */}
      {prompts.length > 0 && (
        <div className="mt-6 border-t border-slate-800 pt-5 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Auditoria por Cena: Como a fala opera no subconsciente
            </span>

            {/* Scene Selector Buttons */}
            <div className="flex items-center gap-1.5">
              {prompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSceneIndex(idx)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedSceneIndex === idx
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  Cena {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Current Scene Dissection Card */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <h5 className="font-bold text-white text-xs">
                  {currentScene.title}
                </h5>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {triggerData?.fase || (
                    selectedSceneIndex === 0
                      ? "Fala 1 — Quebra de Padrão e Atenção Involuntária (0–8s)"
                      : selectedSceneIndex === 1
                      ? "Fala 2 — Neurônios-Espelho e Superioridade Invisível (8–16s)"
                      : "Fala 3 — Magnetismo, Aversão à Perda e Comando de Ação (16–24s)"
                  )}
                </span>
              </div>
              <span className="text-xs font-bold text-amber-400 font-mono">
                Disparo: {triggerData?.impactoSubconscienteScore || 95}%
              </span>
            </div>

            {/* The spoken line in spotlight */}
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 mb-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Fala em Execução (Português BR):
              </span>
              <p className="text-slate-200 text-sm font-medium italic leading-relaxed">
                "{currentScene.fala}"
              </p>
            </div>

            {/* Neurological Mechanics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                  🎯 Gatilho Primitivo Ativado:
                </span>
                <p className="text-slate-300 leading-snug">
                  {triggerData?.gatilhoPrimitivo || (
                    selectedSceneIndex === 0 
                      ? "Desarmação do filtro racional nos primeiros 2s com validação social e espanto natural."
                      : selectedSceneIndex === 1
                      ? "Neurônios-espelho ativados por vocabulário tátil/sinestésico e valor percebido."
                      : "Desejos primitivos de status e atração + comando irresistível no carrinho laranja."
                  )}
                </p>
              </div>

              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                  🧠 Operação no Cérebro Límbico:
                </span>
                <p className="text-slate-300 leading-snug">
                  {triggerData?.analisePsicologica || (
                    selectedSceneIndex === 0
                      ? "Impede o scroll nos 2s iniciais simulando uma conversa de amigo com surpresa sensorial autêntica."
                      : selectedSceneIndex === 1
                      ? "Faz o córtex sensorial experimentar mentalmente o produto (toque, peso, suavidade), gerando sensação prévia de posse."
                      : "Cria urgência de perda imediata e direciona o polegar involuntariamente ao carrinho laranja."
                  )}
                </p>
              </div>
            </div>

            {/* Sensory keywords */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400">Âncoras Sensoriais Detectadas:</span>
              {(triggerData?.palavrasChaveSensoriais && triggerData.palavrasChaveSensoriais.length > 0 
                ? triggerData.palavrasChaveSensoriais 
                : ["todo mundo perguntou", "peso firme", "toque aveludado", "carrinho laranja", "acabamento fino"]
              ).map((word, i) => (
                <span key={i} className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
                  ✨ {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
