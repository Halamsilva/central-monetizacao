import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Video, 
  MessageSquare, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  Check, 
  Copy, 
  HelpCircle,
  Undo2,
  Trash2,
  ChevronRight,
  UserCheck,
  Zap,
  Globe,
  SlidersHorizontal,
  CornerDownLeft,
  BookOpen,
  Mic,
  Camera,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import UploadZone from "./components/UploadZone";
import ProductAnalysis from "./components/ProductAnalysis";
import PromptCard from "./components/PromptCard";
import SubconsciousRadar, { PSYCHOLOGICAL_TARGETS } from "./components/SubconsciousRadar";
import { PromptGenerationResponse, ScenePrompt } from "./types";
import { supabase } from '../../lib/supabase';

const VIDEO_TYPES = [
  { value: "", label: "✨ Automático (Melhor Adequação)" },
  { value: "DEMONSTRAÇÃO DIRETA", label: "📱 Demonstração Direta (Uso e Resultado)" },
  { value: "ANTES E DEPOIS", label: "🔄 Antes e Depois (Transformação física)" },
  { value: "POV", label: "👋 POV (Apenas as mãos em ação)" },
  { value: "UGC DEPOIMENTO", label: "🗣️ UGC Depoimento (Olhando pra câmera)" },
  { value: "PROBLEMA E SOLUÇÃO", label: "💡 Problema e Solução (Inconveniência resolvida)" },
  { value: "UNBOXING", label: "📦 Unboxing (Abrir, retirar e usar)" },
  { value: "MODA", label: "👗 Moda (Modelo vestindo e caimento)" },
  { value: "CALÇADOS", label: "👟 Calçados (Modelo no pé, caminhando)" },
  { value: "CASA E COZINHA", label: "🍳 Casa e Cozinha (Uso real em bancada)" },
  { value: "AUTOMOTIVO", label: "🚗 Automotivo (Aplicação e restauração)" }
];

const LOADING_STEPS = [
  "Iniciando análise inteligente do produto...",
  "Inspecionando fidelidade visual (cores, formato e materiais)...",
  "Analisando público-alvo e utilidade do produto...",
  "Estruturando sequência de conversão (Gancho, Problema, Demonstração)...",
  "Definindo relações de física e causalidade para o Seedance...",
  "Garantindo continuidade (mesmo apresentador, roupa e cenário)...",
  "Escrevendo falas em Português do Brasil de forma espontânea...",
  "Refinando restrições de realismo e gerando prompts finais..."
];

export default function App() {
  // Inputs State - Product Multi-Angle Support (Up to 3 Photos)
  const [image, setImage] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [image3, setImage3] = useState<string | null>(null);
  const [presenterImage, setPresenterImage] = useState<string | null>(null);
  const [scenarioImage, setScenarioImage] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [benefits, setBenefits] = useState("");
  const [videoType, setVideoType] = useState("");
  const [voiceGender, setVoiceGender] = useState<"feminino" | "masculino" | "">("");
  const [extraContext, setExtraContext] = useState("");
  const [spokenLines, setSpokenLines] = useState("");
  const [singlePrompt, setSinglePrompt] = useState(false);
  const [isPov, setIsPov] = useState(false);
  const [psychologicalTarget, setPsychologicalTarget] = useState("Ativação 360° do Subconsciente (Equilíbrio hipnótico)");

  // Output/Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromptGenerationResponse | null>(null);

  // Chat Command State
  const [chatCommand, setChatCommand] = useState("");
  const [isCommandLoading, setIsCommandLoading] = useState(false);

  // Toast / Copy Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle loading steps animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: authData0 } = await supabase.auth.getSession();
      const authToken0 = authData0?.session?.access_token || "";
      const response = await fetch("/api/agents/seedance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken0}` },
        body: JSON.stringify({
          action: "generate-prompts",
          image,
          image2,
          image3,
          presenterImage,
          scenarioImage,
          productName,
          benefits,
          videoType,
          voiceGender,
          extraContext,
          spokenLines,
          singlePrompt,
          isPov,
          psychologicalTarget,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao conectar com o gerador.");
      }

      const data = await response.json();
      if (!data || !data.prompts) {
        throw new Error("Resposta inválida recebida do especialista.");
      }
      setResult(data);
      showToast("Prompts gerados com sucesso!");
    } catch (err: any) {
      setError(err.message || "Erro desconhecido ao gerar prompts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustScene = (index: number, adjustedScene: ScenePrompt) => {
    if (!result) return;
    const updatedPrompts = [...result.prompts];
    updatedPrompts[index] = adjustedScene;
    setResult({
      ...result,
      prompts: updatedPrompts,
    });
    showToast("Cena refinada com sucesso!");
  };

  const executeChatCommand = async (commandToRun: string) => {
    if (!commandToRun.trim() || !result || isCommandLoading) return;

    setIsCommandLoading(true);
    setError(null);

    const userCmd = commandToRun.trim();
    setChatCommand("");

    try {
      const { data: authData1 } = await supabase.auth.getSession();
      const authToken1 = authData1?.session?.access_token || "";
      const response = await fetch("/api/agents/seedance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken1}` },
        body: JSON.stringify({
          action: "chat-command",
          currentProject: result,
          command: userCmd,
        }),
      });

      if (!response.ok) {
        let errMessage = "Falha ao executar o comando de edição.";
        try {
          const errData = await response.json();
          if (errData?.error) errMessage = errData.error;
        } catch {
          // fallback
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      if (data && data.prompts) {
        setResult(data);
        showToast(`Comando "${userCmd.length > 30 ? userCmd.slice(0, 30) + '...' : userCmd}" aplicado!`);
      } else {
        throw new Error("Formato de resposta inválido.");
      }
    } catch (err: any) {
      setError(`Erro ao executar comando: ${err.message}`);
    } finally {
      setIsCommandLoading(false);
    }
  };

  const handleChatCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeChatCommand(chatCommand);
  };

  const resetAll = () => {
    setImage(null);
    setImage2(null);
    setImage3(null);
    setPresenterImage(null);
    setScenarioImage(null);
    setProductName("");
    setBenefits("");
    setVideoType("");
    setVoiceGender("");
    setExtraContext("");
    setSpokenLines("");
    setSinglePrompt(false);
    setIsPov(false);
    setPsychologicalTarget("Ativação 360° do Subconsciente (Equilíbrio hipnótico)");
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app-root">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-xl text-sm font-medium flex items-center gap-2 border border-slate-800"
            id="toast-notification"
          >
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-6 py-4 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/10 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 tracking-tight text-lg md:text-xl">
                  Seedance UGC Expert
                </h1>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] uppercase font-bold tracking-wider rounded-md">
                  TikTok Shop
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Especialista em criar prompts de vídeo realistas e falas persuasivas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetAll}
              className="px-3.5 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-semibold rounded-lg flex items-center gap-1.5"
              title="Resetar formulário e iniciar novo produto"
              id="reset-app-button"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Novo Produto
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8" id="app-main-content">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - Product Specifications (lg:col-span-5) */}
          <section className="lg:col-span-5 space-y-6" id="specifications-panel">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h2 className="text-slate-900 font-extrabold text-base md:text-lg tracking-tight mb-5 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
                Especificações do Produto
              </h2>

              <div className="space-y-5">
                {/* Product Images Upload (Multi-Angle Fidelity - Up to 3 Photos) */}
                <div className="space-y-2.5" id="product-images-container">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      Fotos do Produto (Multi-Ângulo)
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                      {(() => {
                        const count = [image, image2, image3].filter(Boolean).length;
                        if (count === 3) return "3 fotos ativas (Fidelidade 3D Completa)";
                        if (count === 2) return "2 fotos ativas (Fidelidade 3D)";
                        if (count === 1) return "1 foto ativa";
                        return "Envie até 3 fotos";
                      })()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    Suba até <strong>3 fotos do produto</strong> (ex: frente, lateral/verso e detalhes/zoom/embalagem) para o Seedance compreender a geometria 3D completa e manter o produto 100% fiel em todos os movimentos.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" id="product-angles-grid">
                    {/* Ângulo 1 - Principal / Frente */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                          Principal
                        </span>
                        {image ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Frente</span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Principal</span>
                        )}
                      </div>
                      <UploadZone 
                        onImageSelected={setImage} 
                        selectedImage={image} 
                        compact={true}
                        aspectRatio="4/3"
                        badgeText="Foto 1 (Frente)"
                        placeholderText="Foto Frontal"
                        description="Frente / principal"
                      />
                    </div>

                    {/* Ângulo 2 - Secundário / Lateral / Verso */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center justify-center">2</span>
                          Lateral/Verso
                        </span>
                        {image2 ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Ângulo 2</span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Recomendado</span>
                        )}
                      </div>
                      <UploadZone 
                        onImageSelected={setImage2} 
                        selectedImage={image2} 
                        compact={true}
                        aspectRatio="4/3"
                        badgeText="Foto 2 (Lateral)"
                        placeholderText="Lateral / Verso"
                        description="Fidelidade 3D extra"
                      />
                    </div>

                    {/* Ângulo 3 - Detalhes / Zoom / Outro Ângulo */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center justify-center">3</span>
                          Detalhe/3º
                        </span>
                        {image3 ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Ângulo 3</span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Opcional</span>
                        )}
                      </div>
                      <UploadZone 
                        onImageSelected={setImage3} 
                        selectedImage={image3} 
                        compact={true}
                        aspectRatio="4/3"
                        badgeText="Foto 3 (Detalhes)"
                        placeholderText="Zoom ou Detalhe"
                        description="Máxima precisão 3D"
                      />
                    </div>
                  </div>
                </div>

                {/* Referências Extras (Apresentador & Cenário) */}
                <div className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/50" id="extra-references-container">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                    Apresentador & Cenário (Opcional)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Apresentador / Ator
                      </label>
                      <UploadZone 
                        onImageSelected={setPresenterImage} 
                        selectedImage={presenterImage} 
                        compact={true}
                        placeholderText="Ator/Modelo"
                        description="Até 30MB"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Cenário / Fundo
                      </label>
                      <UploadZone 
                        onImageSelected={setScenarioImage} 
                        selectedImage={scenarioImage} 
                        compact={true}
                        placeholderText="Ambiente/Fundo"
                        description="Até 30MB"
                      />
                    </div>
                  </div>
                </div>

                {/* Nome do Produto */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Nome do Produto (Opcional)
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Garrafa Térmica Inteligente, Tênis Ultra Confort, Base Líquida Matte..."
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-11 transition-all"
                    id="product-name-input"
                  />
                </div>

                {/* Benefits Textarea */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Benefícios ou Recursos Extras (Opcional)
                  </label>
                  <textarea
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    placeholder="Ex: Remove manchas em 10 segundos, cabo ergonômico, feito de inox premium, acompanha 3 refis de microfibra..."
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[90px] transition-all"
                    id="benefits-input"
                  />
                </div>

                {/* Video Style Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Estilo de Vídeo UGC
                  </label>
                  <select
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                    id="video-type-selector"
                  >
                    {VIDEO_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gênero da Voz e Apresentador */}
                <div id="voice-gender-selection-container">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-emerald-600" />
                      Gênero da Voz / Apresentador
                    </label>
                    {voiceGender && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50 uppercase">
                        {voiceGender === "feminino" ? "Voz Feminina" : "Voz Masculina"}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2" id="voice-gender-buttons">
                    <button
                      type="button"
                      onClick={() => setVoiceGender(voiceGender === "feminino" ? "" : "feminino")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        voiceGender === "feminino"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                      id="voice-feminino-button"
                    >
                      <span className="text-lg leading-none">👩</span>
                      <span className="font-bold">Feminino</span>
                      <span className="text-[10px] text-slate-500 font-normal">Voz Feminina</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVoiceGender(voiceGender === "masculino" ? "" : "masculino")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        voiceGender === "masculino"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                      id="voice-masculino-button"
                    >
                      <span className="text-lg leading-none">👨</span>
                      <span className="font-bold">Masculino</span>
                      <span className="text-[10px] text-slate-500 font-normal">Voz Masculina</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVoiceGender("")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        voiceGender === ""
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                      id="voice-auto-button"
                    >
                      <span className="text-lg leading-none">✨</span>
                      <span className="font-bold">Automático</span>
                      <span className="text-[10px] text-slate-500 font-normal">Adequação IA</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {voiceGender === "feminino" && (
                      <span>
                        Apresentadora mulher com falas em português adaptadas para concordância feminina (ex: <em>"fiquei chocada"</em>, <em>"cansada"</em>, <em>"obrigada"</em>).
                      </span>
                    )}
                    {voiceGender === "masculino" && (
                      <span>
                        Apresentador homem com falas em português adaptadas para concordância masculina (ex: <em>"fiquei chocado"</em>, <em>"cansado"</em>, <em>"obrigado"</em>).
                      </span>
                    )}
                    {voiceGender === "" && (
                      <span>
                        A IA escolherá automaticamente o perfil de voz e gênero mais persuasivo para esta categoria de produto.
                      </span>
                    )}
                  </p>
                </div>

                {/* Painel de Alvos Psicológicos (Neuromarketing e Subconsciente) */}
                <div className="border border-purple-200/80 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/40 rounded-xl p-4 transition-all" id="psychological-targets-panel">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
                      Painel de Alvos Psicológicos
                    </label>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 border border-purple-200 px-2 py-0.5 rounded-full uppercase">
                      Subconsciente
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                    Escolha qual gatilho límbico primitivo o gerador deve direcionar nas falas do apresentador:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="psychological-targets-grid">
                    {PSYCHOLOGICAL_TARGETS.map((target) => {
                      const Icon = target.icon;
                      const isSelected = psychologicalTarget.includes(target.name) || (target.id === "360" && psychologicalTarget.includes("360°"));
                      return (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => setPsychologicalTarget(`${target.name} (${target.badge})`)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? `${target.bg} ${target.border} ring-2 ring-purple-500/20 shadow-xs`
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`p-1.5 rounded-lg text-white bg-gradient-to-br ${target.color} shrink-0`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 leading-tight">
                                {target.name}
                              </h5>
                              <span className="text-[10px] font-semibold text-purple-700 block">
                                {target.badge}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                            {target.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-purple-100 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-1.5">
                    <span>⚡ Gatilhos ativos: Quebra de padrão • Neurônios-espelho • Carrinho laranja</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">🔇 Zero Trilha</span>
                      <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">🚫 Sem Banner Carrinho, Texto, Emoji ou Imagem</span>
                    </div>
                  </div>
                </div>

                {/* Falas que vão ser ditas no vídeo (Roteiro Personalizado) */}
                <div className="border border-emerald-200/80 bg-emerald-50/40 rounded-xl p-4 transition-all" id="spoken-lines-container">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Falas que vão ser ditas no vídeo
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      spokenLines.trim()
                        ? "text-emerald-800 bg-emerald-100 border-emerald-300"
                        : "text-slate-500 bg-slate-100 border-slate-200"
                    }`}>
                      {spokenLines.trim() ? "Roteiro Ativo" : "Opcional"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                    Adicione as falas ou o roteiro que você deseja que o apresentador diga no vídeo (separado por cenas ou texto corrido). Se deixar em branco, a IA criará falas altamente persuasivas e naturais automaticamente.
                  </p>

                  <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-2.5 mb-2.5 flex items-start gap-2 text-[11px] text-amber-950 font-medium">
                    <span className="text-sm shrink-0">⏱️</span>
                    <div>
                      <strong className="block text-amber-900 font-bold mb-0.5">
                        Regra Obrigatória: Falas de até 9 segundos por prompt (nunca passa desse tempo)
                      </strong>
                      <span>
                        Se a fala for maior ou o roteiro for longo, o gerador criará automaticamente mais prompts (podendo gerar <strong>até 5 ou 6 prompts</strong>) para acomodar o texto completo sem cortes e sem atropelar o ritmo!
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      value={spokenLines}
                      onChange={(e) => setSpokenLines(e.target.value)}
                      placeholder={`Exemplo de falas por cena (até 9 segundos cada):\nCena 1 (Gancho): "Gente, com esse calor que faz aqui minha pele vivia um desastre até eu achar isso aqui..."\nCena 2 (Problema): "Eu perdia um tempão de manhã tentando disfarçar as marcas e a oleosidade..."\nCena 3 (Mecanismo): "Olha como é prático: fórmula leve toque seco com ativos que agem na hora!"\nCena 4 (Demonstração): "É só passar duas gotinhas, olha como a textura absorve sem pesar nada!"\nCena 5 (Resultado): "Ficou perfeito demais! Olha o viço natural que deu em questão de segundos!"\nCena 6 (CTA): "Aproveita que o cupom com frete grátis tá liberado no carrinho aqui embaixo antes que acabe!"\n\n(Ou cole qualquer roteiro longo que a IA dividirá em tomadas de até 9s gerando até 5 ou 6 prompts)`}
                      className="w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[135px] transition-all font-mono leading-relaxed"
                      id="spoken-lines-input"
                    />

                    {spokenLines.trim() && (
                      <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            📊 {spokenLines.trim().split(/\s+/).filter(Boolean).length} palavras
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-medium text-slate-600">
                            ⏱️ ~{Math.round(spokenLines.trim().split(/\s+/).filter(Boolean).length / 2.2)}s total
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border shadow-2xs ${
                            spokenLines.trim().split(/\s+/).filter(Boolean).length > 22
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border-emerald-300"
                          }`}>
                            {spokenLines.trim().split(/\s+/).filter(Boolean).length <= 22
                              ? "✓ Cabe em 1 a 3 prompts (≤ 9s)"
                              : `⚡ Expansão: Gerará ~${Math.min(6, Math.max(3, Math.ceil(spokenLines.trim().split(/\s+/).filter(Boolean).length / 18)))} prompts (≤ 9s/cena)`
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modelos rápidos e botão de limpar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-emerald-100/60">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400">Modelos:</span>
                      <button
                        type="button"
                        onClick={() => setSpokenLines(`Cena 1 (Gancho): "Gente, na boa, olha o que finalmente acabou de chegar pra salvar minha rotina..."\nCena 2 (Demonstração): "Olha a facilidade com que isso funciona na prática, resolve em segundos sem complicação!"\nCena 3 (Resultado & CTA): "Ficou perfeito demais! Já deixei o cupom exclusivo liberado no carrinho aqui embaixo antes que esgote!"`)}
                        className="text-[10px] font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md transition-colors shadow-2xs cursor-pointer"
                        title="Inserir modelo padrão de 3 cenas"
                      >
                        📝 3 Cenas
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpokenLines(`Cena 1 (Gancho): "Gente, na correria de manhã antes de sair pro trabalho eu perdia muito tempo..."\nCena 2 (Problema & Mecanismo): "Quem vive na correria sabe o estresse que dá, até que resolvi testar esse item aqui..."\nCena 3 (Demonstração Prática): "Olha a facilidade em tempo real: acionou e resolveu em segundos com zero complicação!"\nCena 4 (Resultado Final & CTA): "Ficou impecável demais! Corre no link do carrinho aqui embaixo que o cupom com frete grátis tá liberado!"`)}
                        className="text-[10px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-md transition-colors shadow-2xs cursor-pointer"
                        title="Inserir modelo extenso com 4 cenas"
                      >
                        ⚡ 4 Cenas
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpokenLines(`Cena 1 (Gancho): "Gente, olha o que acabou de chegar aqui em casa pra salvar meu dia a dia..."\nCena 2 (Contexto): "Eu não aguentava mais sofrer com isso toda semana na correria..."\nCena 3 (Mecanismo): "Dá uma olhada no acabamento e nas lâminas de inox, a construção é muito sólida!"\nCena 4 (Demonstração): "É só travar e apertar o botão, olha como tritura tudo na hora sem esforço nenhum!"\nCena 5 (Resultado & CTA): "Ficou sensacional! Clica no link do carrinho no cantinho que o cupom de desconto tá ativo!"`)}
                        className="text-[10px] font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-1 rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                        title="Inserir modelo longo com 5 cenas (até 9s cada)"
                      >
                        🚀 5 Cenas
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpokenLines(`Cena 1 (Gancho): "Gente, com esse calor que faz aqui minha rotina de manhã era um sufoco completo..."\nCena 2 (Problema): "Antes de sair pro trabalho eu perdia um tempão tentando resolver isso..."\nCena 3 (Mecanismo): "Até que achei esse item aqui: mecanismo inteligente e feito com material de primeira!"\nCena 4 (Demonstração): "Olha a facilidade na prática: acionou uma vez e resolve na hora sem sujeira nenhuma!"\nCena 5 (Resultado): "Olha a perfeição disso aqui! Salvou minha rotina e não fico mais sem de jeito nenhum!"\nCena 6 (CTA): "Corre e garante o seu no carrinho aqui embaixo antes que o lote com frete grátis esgote!"`)}
                        className="text-[10px] font-bold text-violet-950 bg-violet-100 hover:bg-violet-200 border border-violet-300 px-2 py-1 rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                        title="Inserir modelo completo com 6 cenas (até 9s cada)"
                      >
                        🎬 6 Cenas
                      </button>
                    </div>

                    {spokenLines && (
                      <button
                        type="button"
                        onClick={() => setSpokenLines("")}
                        className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer py-1 px-2 hover:bg-rose-50 rounded-md transition-colors"
                        title="Limpar falas personalizadas"
                      >
                        <Trash2 className="w-3 h-3" />
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Preferences */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Preferências do Apresentador ou Cenário (Opcional)
                  </label>
                  <textarea
                    value={extraContext}
                    onChange={(e) => setExtraContext(e.target.value)}
                    placeholder="Ex: Apresentadora feminina jovem, cenário de cozinha moderna, tom animado e entusiasmado..."
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[70px] transition-all"
                    id="extra-context-input"
                  />
                </div>

                {/* POV Mode Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl" id="pov-mode-container">
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">
                      Estilo POV (Primeira Pessoa)
                    </span>
                    <span className="text-slate-500 text-xs block">
                      Gera o vídeo com foco nas mãos operando o produto (sem mostrar o rosto)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPov}
                      onChange={(e) => setIsPov(e.target.checked)}
                      className="sr-only peer"
                      id="pov-mode-toggle"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Sequence Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">
                      Criar apenas 1 cena curta
                    </span>
                    <span className="text-slate-500 text-xs block">
                      Gera um único prompt consolidado em vez de 3 cenas
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={singlePrompt}
                      onChange={(e) => setSinglePrompt(e.target.checked)}
                      className="sr-only peer"
                      id="single-prompt-toggle"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  id="generate-button"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Processando Produto...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform text-emerald-200" />
                      <span>Gerar Roteiro e Prompts</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Guidelines Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-xs text-slate-500 leading-relaxed space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider block">
                  Regras de Física e Conversão
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                  Zero Marcas • Zero Preços
                </span>
              </div>
              <p>
                Os prompts técnicos gerados respeitam as regras físicas do Seedance, evitando "transformações mágicas". Apenas a área de contato do produto se transforma, a velocidade do movimento é controlada e a estabilidade das roupas e do apresentador é mantida.
              </p>
              <p className="text-amber-950 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/70">
                <strong>🎯 Gancho com Fidelidade Exata 1:1:</strong> No Prompt 1 (primeiros 3s), a câmera abre em Hero Macro Shot ou Close-up de inspeção focado na geometria, acabamento real (fosco/brilhante), materiais e texturas exatas da foto de referência. As mãos seguram a peça firme e voltada para a lente enquanto a câmera faz um lento push-in ou arco orbital, comprovando a qualidade real do item sem distorções.
              </p>
              <p className="text-cyan-950 bg-cyan-50/80 p-2.5 rounded-lg border border-cyan-200/70">
                <strong>🎬 Movimentação Fluida, Cinemática Realista & Anti-Deformação (Corpo Rígido):</strong> O produto possui movimentação ultra-fluida e natural com inércia física real e peso tátil (natural handheld kinematics). As mãos executam um micro-tilt sutil de 5° a 10° que faz a luz natural deslizar pelas arestas, texturas e relevos (specular sheen pass), revelando a tridimensionalidade sem deformar a silhueta ou torcer logos. Dedos respeitam colisão de superfície 100% sólida (sem atravessar a malha), acionamentos mecânicos são lineares com memória elástica (spring-back return), e a câmera faz tracking steadycam sincronizado com parallax suave em torno de um corpo sólido 100% indeformável (zero jelly effect, zero motion warping).
              </p>
              <p className="text-indigo-950 bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-200/70">
                <strong>📐 Escala, Formato & Estrutura 1:1 em Todos os Prompts:</strong> A escala milimétrica real 1:1, o formato geométrico 3D (silhueta, tampa, corpo, bicos/solado) e a estrutura física rígida do produto são conservadas estritamente em todas as tomadas (Prompts 1, 2 e 3). O close-up é sempre proximidade ótica da lente da câmera, eliminando qualquer morphing, deformação ou ampliação artificial do objeto.
              </p>
              <p className="text-emerald-950 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200/70">
                <strong>🇧🇷 Tom 100% Natural para o Público do Brasil:</strong> As falas soam como o áudio espontâneo de WhatsApp de um amigo ou um desabafo sem script decorado. Uso obrigatório de contrações orais cotidianas ("pra", "pro", "tô", "tava", "tá", "né", "gente", "na boa", "juro pra vocês") e próclise natural ("me salvou", "te mostrar"). Banimento total de jargão de comercial de TV, frases poéticas artificiais e traduções robóticas do inglês.
              </p>
              <p className="text-emerald-950 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200/70">
                <strong>🇧🇷 Coerência Sequencial & Dia a Dia no Brasil:</strong> As 3 cenas formam uma única história contínua (mesmo personagem brasileiro, mesma roupa exata, mesmo cômodo e luz natural) com progressão lógica: gancho na rotina → uso prático imediato → resultado visual real. As falas são encadeadas e focadas na realidade brasileira (calor, umidade, correria matinal antes do trabalho e praticidade).
              </p>
              <p className="text-pink-950 bg-pink-50/80 p-2.5 rounded-lg border border-pink-200/70">
                <strong>✨ Beleza & Skincare (Sem Falar do Pote • Dor & Solução):</strong> Em cosméticos e cuidados pessoais, é proibido gastar falas falando do pote ou embalagem. A pessoa é filmada usando a fórmula naturalmente na pele/cabelo em frente ao espelho do dia a dia, com narrativa estruturada em dor real brasileira (oleosidade no calor, pele repuxando, cansaço, frizz) e a solução imediata em 3 atos (aplicação suave, rápida absorção, viço saudável e alívio com cupom).
              </p>
              <p className="text-teal-950 bg-teal-50/80 p-2.5 rounded-lg border border-teal-200/70">
                <strong>👍 Valorização do Produto (Não Falar Mal Segurando a Peça):</strong> No primeiro prompt, a dor descrita é estritamente sobre a rotina passada (calor, correria, cansaço). O produto em mãos é sempre tratado com admiração e apresentado imediatamente como a solução salvadora. É terminantemente proibido qualquer tom pejorativo ou ambíguo ("eu sofria com isso aqui") segurando o produto, para o público não achar que o item à venda é o problema ou que é defeituoso.
              </p>
              <p className="text-blue-950 bg-blue-50/80 p-2.5 rounded-lg border border-blue-200/70">
                <strong>🔍 Clareza do Produto nas Falas (Falar Sobre o Produto):</strong> O espectador que estiver assistindo ou apenas ouvindo o áudio entende com clareza cristalina o que está sendo vendido. É expressamente proibido usar termos vagos e vazios ("esse salvador aqui", "essa belezinha"). O apresentador cita a categoria funcional do item, explica seus atributos físicos e mecanismo prático (lâminas, vedação, fórmula, textura, materiais) e comprova o benefício tangível entregue na rotina brasileira.
              </p>
              <p className="text-amber-950 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/70">
                <strong>🏠 Cenário 100% Coerente com o Produto:</strong> O ambiente de todas as tomadas é o habitat natural e lógico de uso do produto (ex: cozinha/bancada para culinária e garrafas; banheiro iluminado com espelho para skincare e cosméticos; quarto/closet para roupas e vaporizadores; hall/chão para calçados; mesa para itens de escritório/tech). O mesmo cômodo idêntico é preservado nas 3 cenas com continuidade espacial.
              </p>
              <p className="text-rose-950 bg-rose-50/80 p-2.5 rounded-lg border border-rose-200/70">
                <strong>🚫 Sem Banner de Carrinho, Texto, Emoji ou Imagem na Tela:</strong> É terminantemente proibido adicionar banner de carrinho laranja desenhado na tela, botão digital de compra, ícone de compras, títulos, legendas na tela, caixas de texto, palavras, emojis, figurinhas ou fotos/imagens sobrepostas (zero picture-in-picture, zero photo overlay). O vídeo gerado deve ser filmagem 100% limpa e pura de câmera de smartphone (clean raw camera footage).
              </p>
              <p className="text-violet-950 bg-violet-50/80 p-2.5 rounded-lg border border-violet-200/70">
                <strong>🎬 Zero Cortes Sem Sentido (Match-Cut & Continuidade Lógica):</strong> É terminantemente proibido cortes abruptos ou saltos desconexos entre tomadas. O final do gesto e a postura corporal no Prompt 1 conectam-se perfeitamente ao início do Prompt 2 (match action cut), e o fim da demonstração do Prompt 2 culmina na contemplação do resultado no Prompt 3. O eixo cinematográfico de 180° é rigorosamente preservado, sem teletransporte e com filmagem em take único contínuo.
              </p>
              <p className="text-emerald-950 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-300/80">
                <strong>🔄 Rotação Ultra-Lenta & Sem Deformação (Mostrar Detalhes):</strong> É terminantemente proibido girar o produto de uma vez só ou mudar de posição bruscamente. Sempre que precisar girar o produto (mostrar verso, laterais, solado, bico ou rótulo), o giro é feito de forma extremamente lenta, suave e contínua, permitindo que a câmera capture cada detalhe sem borrão e mantendo a peça como corpo sólido 100% rígido e indeformável (zero jelly effect).
              </p>
              <p className="text-emerald-950 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200/70">
                <strong>🎙️ Falas do Vídeo Sob Medida:</strong> Você pode inserir suas próprias falas e roteiro personalizado antes de gerar os prompts, ou deixar que a IA crie diálogos autênticos e persuasivos em Português do Brasil alinhados à psicologia de vendas do TikTok Shop.
              </p>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <strong>Diretriz Orgânica TikTok Shop:</strong> Não são mencionados nomes de marcas nem valores de preço nas falas. O foco é 100% na dor, no benefício e no direcionamento orgânico para os cupons/carrinho.
              </p>
              <div className="flex items-center gap-2 text-emerald-700 font-semibold pt-1 border-t border-slate-100">
                <Globe className="w-3.5 h-3.5" />
                <span>Prompts em Inglês • Falas em Português-BR</span>
              </div>
            </div>
          </section>

          {/* Right Column - Prompts Preview & Output Console (lg:col-span-7) */}
          <section className="lg:col-span-7 min-h-[400px]" id="output-console-panel">
            <AnimatePresence mode="wait">
              {/* State 1: Loading Screen */}
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[450px]"
                  id="loading-screen"
                >
                  <div className="relative mb-8">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin" />
                    <Sparkles className="w-6 h-6 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  
                  <h3 className="text-slate-900 font-extrabold text-lg mb-2">
                    Criando prompts de conversão profissional...
                  </h3>
                  
                  <div className="h-6 overflow-hidden max-w-sm mx-auto mb-4">
                    <motion.p
                      key={loadingStepIndex}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-emerald-700 font-semibold text-sm"
                    >
                      {LOADING_STEPS[loadingStepIndex]}
                    </motion.p>
                  </div>
                  
                  <p className="text-slate-400 text-xs max-w-xs">
                    Isso leva cerca de 10 a 15 segundos. Analisando a imagem com fidelidade absoluta de design e cores.
                  </p>
                </motion.div>
              )}

              {/* State 2: Error Screen */}
              {error && !isLoading && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-rose-50/50 border border-rose-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]"
                  id="error-screen"
                >
                  <div className="p-3 bg-rose-100 text-rose-700 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-rose-900 font-bold text-lg mb-2">Ocorreu um erro</h3>
                  <p className="text-rose-700 text-sm max-w-md mb-6">{error}</p>
                  <button
                    onClick={handleGenerate}
                    className="px-5 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 transition-colors shadow-xs"
                    id="retry-button"
                  >
                    Tentar Novamente
                  </button>
                </motion.div>
              )}

              {/* State 3: Empty State (No generation yet) */}
              {!isLoading && !error && !result && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center flex flex-col items-center justify-center min-h-[450px]"
                  id="empty-state"
                >
                  <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-full mb-5 shadow-inner">
                    <Video className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-extrabold text-lg mb-2">
                    Pronto para Gerar Prompts
                  </h3>
                  <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">
                    Envie até 3 fotos do seu produto (frente, lateral/verso e detalhes/zoom/embalagem), insira os principais benefícios e veja a mágica acontecer. O especialista analisará a identidade visual 3D completa com precisão e estruturará os prompts do Seedance perfeitamente.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-xl w-full">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100/60">
                      <div className="w-5 h-5 bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center rounded-md mb-2">1</div>
                      <span className="font-bold text-slate-800 text-xs block mb-1">Multi-Ângulo (Até 3 Fotos)</span>
                      <p className="text-slate-500 text-[11px] leading-relaxed">Fidelidade 3D cruzando frente, lateral/verso, detalhes e textura.</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100/60">
                      <div className="w-5 h-5 bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center rounded-md mb-2">2</div>
                      <span className="font-bold text-slate-800 text-xs block mb-1">Física de Causabilidade</span>
                      <p className="text-slate-500 text-[11px] leading-relaxed">Seedance recebe instruções exatas de causa/efeito no toque.</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100/60">
                      <div className="w-5 h-5 bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center rounded-md mb-2">3</div>
                      <span className="font-bold text-slate-800 text-xs block mb-1">Conversão TikTok</span>
                      <p className="text-slate-500 text-[11px] leading-relaxed">Vídeo orgânico, fala natural em PT-BR e CTA com gesto de apontar.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* State 4: Prompts Result & Commands Console */}
              {!isLoading && !error && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                  id="results-view"
                >
                  {/* Product Analysis Banner */}
                  <ProductAnalysis analysis={result.analysis} />

                  {/* Radar de Penetração Subconsciente (Neuromarketing) */}
                  <SubconsciousRadar
                    audit={result.neuromarketingAudit}
                    prompts={result.prompts}
                    activeTarget={psychologicalTarget}
                    onSelectTarget={(target) => {
                      setPsychologicalTarget(target);
                      executeChatCommand(`recalibrar as falas e os prompts para o Alvo Psicológico: ${target}, reforçando a ativação do subconsciente e os gatilhos primitivos correspondentes`);
                    }}
                  />

                  {/* Header of Prompts Sequence */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-slate-900 text-lg">
                        Roteiro e Prompts Seedance
                      </h3>
                      {result.prompts.length >= 4 && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                          🚀 Sequência Expandida ({result.prompts.length} Prompts)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {result.prompts.length} {result.prompts.length === 1 ? "Cena" : "Cenas"} • Falas ≤ 9s cada
                      </span>
                      {result.prompts.length < 6 && (
                        <button
                          type="button"
                          onClick={() => {
                            setChatCommand("gerar um prompt a mais para caber as falas completas: adicionar mais uma cena com continuidade perfeita à sequência para acomodar todo o roteiro de falas sem cortar frases e sem passar de 9 segundos por cena");
                            const panel = document.getElementById("chat-commands-panel");
                            if (panel) {
                              panel.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Adicionar mais uma cena para acomodar falas adicionais"
                        >
                          ➕ +1 Prompt Extra
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scenes List */}
                  <div className="space-y-6" id="prompts-list">
                    {result.prompts.map((prompt, index) => (
                      <PromptCard
                        key={index}
                        prompt={prompt}
                        onAdjust={(adjusted) => handleAdjustScene(index, adjusted)}
                      />
                    ))}
                  </div>

                  {/* Dynamic Commands Panel */}
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-lg border border-slate-800" id="chat-commands-panel">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-bold text-white text-base">Comandos Rápidos do Especialista</h4>
                    </div>
                    
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">
                      Você pode conversar com o especialista para alterar todo o roteiro. Digite comandos como <code className="text-emerald-400 font-mono bg-slate-800 px-1 py-0.5 rounded">melhore</code> para refinar a estabilidade, <code className="text-emerald-400 font-mono bg-slate-800 px-1 py-0.5 rounded">mais uma</code> para gerar outra versão com ganchos diferentes, <code className="text-emerald-400 font-mono bg-slate-800 px-1 py-0.5 rounded">mude para POV</code> ou <code className="text-emerald-400 font-mono bg-slate-800 px-1 py-0.5 rounded">fala</code> para novas sugestões de falas.
                    </p>

                    <form onSubmit={handleChatCommandSubmit} className="relative flex items-center">
                      <input
                        type="text"
                        value={chatCommand}
                        onChange={(e) => setChatCommand(e.target.value)}
                        placeholder="Ex: Crie mais uma versão ou melhore o gancho..."
                        disabled={isCommandLoading}
                        className="w-full text-sm bg-slate-800/80 border border-slate-700/80 rounded-xl pl-4 pr-12 py-3 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        id="chat-command-input"
                      />
                      <button
                        type="submit"
                        disabled={isCommandLoading || !chatCommand.trim()}
                        className="absolute right-2.5 p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                        id="chat-command-submit-button"
                      >
                        {isCommandLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CornerDownLeft className="w-4 h-4" />
                        )}
                      </button>
                    </form>

                    {/* Predefined prompt quick tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {/* Neuromarketing Quick Commands */}
                      <button
                        type="button"
                        onClick={() => { executeChatCommand("ativar Neuromarketing e Ativação do Subconsciente 360° em todas as falas: orquestrar Quebra de Padrão (0-8s), Neurônios-Espelho (8-16s) e Magnetismo com Aversão à Perda (16-24s)"); }}
                        className="text-purple-200 bg-purple-950/90 hover:bg-purple-900 text-xs px-2.5 py-1.5 rounded-md border border-purple-400/80 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        🧠 Ativação 360° do Subconsciente
                      </button>
                      <button
                        type="button"
                        onClick={() => { executeChatCommand("recalibrar falas para o Alvo Psicológico: Status & Superioridade Invisível (Desejo de Alto Padrão). Usar vocabulário de acabamento premium, peso e toque exclusivo"); }}
                        className="text-amber-200 bg-amber-950/90 hover:bg-amber-900 text-xs px-2.5 py-1.5 rounded-md border border-amber-400/80 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        👑 Status & Superioridade Invisível
                      </button>
                      <button
                        type="button"
                        onClick={() => { executeChatCommand("recalibrar falas para o Alvo Psicológico: Magnetismo Pessoal & Atração (Desejos Primitivos). Conectar aos elogios que a pessoa vai receber e olhares de admiração"); }}
                        className="text-rose-200 bg-rose-950/90 hover:bg-rose-900 text-xs px-2.5 py-1.5 rounded-md border border-rose-400/80 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        🔥 Magnetismo Pessoal & Atração
                      </button>
                      <button
                        type="button"
                        onClick={() => { executeChatCommand("recalibrar falas para o Alvo Psicológico: Alívio da Frustração Oculta (Paz Mental e Praticidade). Destacar o fim da irritação diária e economia de esforço"); }}
                        className="text-teal-200 bg-teal-950/90 hover:bg-teal-900 text-xs px-2.5 py-1.5 rounded-md border border-teal-400/80 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        🛡️ Alívio da Frustração Oculta
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("sempre com falas de até nove segundos por ptompts nunca passe esse tempo regra obrigatorias , sé a fala que o usuario enviar for maior gere mais prompts pode gerar até 5 ou 6 prompts"); }}
                        className="text-amber-200 bg-amber-950/90 hover:bg-amber-900 text-xs px-2.5 py-1.5 rounded-md border border-amber-400/80 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        ⏱️ Falas de Até 9s por Prompt (Gerar até 5 ou 6 Prompts)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("gerar um prompt a mais para caber as falas completas: adicionar mais uma cena à sequência para acomodar todo o roteiro de falas sem cortar frases e sem atropelar o ritmo do vídeo"); }}
                        className="text-amber-200 bg-amber-950/80 hover:bg-amber-900 text-xs px-2.5 py-1.5 rounded-md border border-amber-400/60 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        ➕ Gerar 1 Prompt a Mais (Caber Falas)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand('adicionar falas ao vídeo: Cena 1: "Gente, olha o que acabou de chegar...", Cena 2: "É só usar assim...", Cena 3: "Aproveita o cupom no carrinho!"'); }}
                        className="text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 text-xs px-2.5 py-1.5 rounded-md border border-emerald-400/60 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        🎙️ Definir / Alterar Falas do Vídeo
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("não gire o produto de uma vez so mudando de posição brusca , sempre que precisar girar o produto girar ele de vagar mostrando os detalhes sem deformar"); }}
                        className="text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 text-xs px-2.5 py-1.5 rounded-md border border-emerald-400/60 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        🔄 Girar Devagar Sem Deformar (Mostrar Detalhes)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("evite cortes de cenas sem sentido: garanta continuidade fluida e lógica entre as tomadas (match-action contínuo entre Cena 1, Cena 2 e Cena 3), mesma postura corporal, mesmo eixo de câmera 180°, vetor de movimento encadeado sem saltos bruscos ou teletransporte, e filmagem em take único contínuo sem cortes internos desconexos"); }}
                        className="text-violet-200 bg-violet-950/80 hover:bg-violet-900 text-xs px-2.5 py-1.5 rounded-md border border-violet-400/60 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        🎬 Evitar Cortes Sem Sentido (Match-Cut Fluido)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("melhore o gancho com foco em mostrar o produto com fidelidade física exata 1:1 à foto de referência (geometria exata, acabamento real, cores e close-up macro de inspeção)"); }}
                        className="text-blue-200 bg-blue-950/70 hover:bg-blue-900/90 text-xs px-2.5 py-1.5 rounded-md border border-blue-500/40 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        🔬 Gancho com Fidelidade Exata
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("melhore o gancho colocando o produto como protagonista principal em close-up logo no primeiro segundo"); }}
                        className="text-amber-200 bg-amber-950/60 hover:bg-amber-900/80 text-xs px-2.5 py-1.5 rounded-md border border-amber-500/40 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        🎯 Produto como Principal no Gancho
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("mais uma"); }}
                        className="text-slate-300 bg-slate-800/60 hover:bg-slate-800 text-xs px-2.5 py-1.5 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                      >
                        🔄 Mais uma versão
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("atualize para produtos de beleza não fique falando do pote , faça para produto de beleza usando o produto de forma natural no dia a dia , adicione dor e solução"); }}
                        className="text-pink-300 bg-pink-950/50 hover:bg-pink-950/80 text-xs px-2.5 py-1.5 rounded-md border border-pink-500/40 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        ✨ Beleza: Dor & Solução (Sem Falar do Pote)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("adapte o cenário para ser coerente com o produto: posicionar a cena no habitat natural e lógico onde esse produto é realmente usado no dia a dia (ex: cozinha para culinária/garrafa/processador, banheiro para skincare/higiene, quarto/closet para roupas/vaporizador/fiapos, mesa de trabalho para eletrônicos, hall/chão para tênis), mantendo o mesmo cômodo idêntico nas 3 cenas"); }}
                        className="text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 text-xs px-2.5 py-1.5 rounded-md border border-amber-500/50 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        🏠 Adaptar Cenário ao Produto (Cenário Coerente)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("gere falas condizentes com o produto e com o uso dele para o publico do brasil: cite com clareza a categoria e atributos práticos de funcionamento do item, conecte ao uso real e dores do cotidiano brasileiro (calor/mormaço, correria matinal, trabalho, praticidade) com vocabulário oral autêntico e contrações naturais (pra, pro, tô, tava, na boa, gente) sem marcas e sem preços"); }}
                        className="text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 text-xs px-2.5 py-1.5 rounded-md border border-emerald-400/60 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        🇧🇷 Falas Condizentes com o Produto e Uso no Brasil
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("melhore as falas para ficar claro o que esta sendo vendido fale sobre o produto: nomear a categoria do produto, explicar como ele funciona na prática, seus atributos físicos reais e qual problema ele resolve com clareza para quem assiste ou ouve o áudio, mantendo tom 100% natural brasileiro, sem marcas e sem preços"); }}
                        className="text-blue-300 bg-blue-950/60 hover:bg-blue-900/80 text-xs px-2.5 py-1.5 rounded-md border border-blue-500/50 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        🔍 Clareza do Produto (Falar do Produto nas Falas)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("adicioe a regra nos prompts pra não adicionar texto no vídeo: proibir títulos, legendas na tela, caixas de texto ou qualquer overlay tipográfico, mantendo filmagem 100% limpa com restrições negativas completas contra on-screen text e subtitles"); }}
                        className="text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 text-xs px-2.5 py-1.5 rounded-md border border-rose-500/50 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        🚫 Sem Texto no Vídeo (Clean Footage)
                      </button>
                      <button
                        type="button"
                        onClick={() => { executeChatCommand("não adicionar banner de carrinho laranja , não adicionar texto na tela do vídeo, não adicionar emoje não adicionar imagem na tela: filmagem 100% limpa (clean footage), sem carrinho desenhado, sem legendas, sem textos, sem emojis e sem fotos sobrepostas"); }}
                        className="text-rose-200 bg-rose-950 hover:bg-rose-900 text-xs px-2.5 py-1.5 rounded-md border border-rose-400 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        🚫 Sem Banner Carrinho, Texto, Emoji ou Imagem
                      </button>
                      <button
                        type="button"
                        onClick={() => { executeChatCommand("não adicione trilha sonora nos prompts: remover qualquer menção a música de fundo ou trilha sonora, focar exclusivamente na voz falada direta e acústica orgânica ambiente, com restrições negativas completas contra soundtrack, background music e musical score"); }}
                        className="text-slate-200 bg-slate-800 hover:bg-slate-700 text-xs px-2.5 py-1.5 rounded-md border border-slate-600 transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                      >
                        🔇 Sem Trilha Sonora nos Prompts
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("deixe com o tom natural para o publico do brasil: falas coloquiais, orgânicas e espontâneas como áudio de WhatsApp de amigo, com contrações pra/pro/tô/tava/né, sem jargão de comercial ou dublagem, conectadas à rotina brasileira"); }}
                        className="text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 text-xs px-2.5 py-1.5 rounded-md border border-emerald-500/50 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        🇧🇷 Tom Natural para o Público do Brasil
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("melhore a movimentação do produto para ser ultra-fluida, natural e realista: cinemática de mão autêntica com inércia física real e peso tátil, micro-tilt sutil de 5° a 10° que faz a luz natural deslizar pelas arestas e texturas revelando acabamento real sem deformar a peça, toques dos dedos com colisão de superfície 100% sólida sem atravessar a malha, tracking sincronizado de steadycam com parallax tridimensional e física de corpo sólido 100% indeformável (zero jelly effect, zero warping)"); }}
                        className="text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 text-xs px-2.5 py-1.5 rounded-md border border-cyan-500/50 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        🎬 Movimentação Fluida & Realista do Produto
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("melhore os prompts pra cada prompt ser coerente um com o outro, focada no uso do produto no dia a dia dos humanos no brasil"); }}
                        className="text-emerald-300 bg-emerald-950/50 hover:bg-emerald-950/80 text-xs px-2.5 py-1.5 rounded-md border border-emerald-500/40 transition-colors cursor-pointer font-medium"
                      >
                        🇧🇷 Coerência & Dia a Dia Brasil
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("corrija para manter a escala e o formato e a estrutura do produto em todos os prompts"); }}
                        className="text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 text-xs px-2.5 py-1.5 rounded-md border border-amber-500/40 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        📐 Manter Escala, Formato & Estrutura (1:1)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("no primeiro prompt não fale mau segurando o produto o publico vai achar que é o produto que esta a venda que esta sendo criticado, apresente o produto com entusiasmo como a solução salvadora da rotina"); }}
                        className="text-teal-300 bg-teal-950/50 hover:bg-teal-950/80 text-xs px-2.5 py-1.5 rounded-md border border-teal-500/40 transition-colors cursor-pointer font-medium flex items-center gap-1 shadow-xs"
                      >
                        👍 Valorizar Produto (Não Falar Mal no Gancho)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("melhore"); }}
                        className="text-slate-300 bg-slate-800/60 hover:bg-slate-800 text-xs px-2.5 py-1.5 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                      >
                        ⭐ Melhore a física/estabilidade
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("mude o roteiro para POV de mãos"); }}
                        className="text-slate-300 bg-slate-800/60 hover:bg-slate-800 text-xs px-2.5 py-1.5 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                      >
                        👋 Mudar para POV de Mãos
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("deixe as falas mais curtas e dinâmicas"); }}
                        className="text-slate-300 bg-slate-800/60 hover:bg-slate-800 text-xs px-2.5 py-1.5 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                      >
                        ⚡ Falas ultra-rápidas
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("mude o roteiro para voz masculina"); }}
                        className="text-slate-300 bg-slate-800/60 hover:bg-slate-800 text-xs px-2.5 py-1.5 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                      >
                        👨 Mudar para Voz Masculina
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChatCommand("mude o roteiro para voz feminina"); }}
                        className="text-slate-300 bg-slate-800/60 hover:bg-slate-800 text-xs px-2.5 py-1.5 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                      >
                        👩 Mudar para Voz Feminina
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-center text-slate-400 text-xs mt-12" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Seedance UGC Expert. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <span className="text-slate-500 font-medium">Fidelidade Absoluta ao Produto</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">Física de Causalidade</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">Falas Orgânicas</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
