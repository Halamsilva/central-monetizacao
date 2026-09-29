import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { GeneratorForm } from "./components/GeneratorForm";
import { SceneCard } from "./components/SceneCard";
import { PromptZeroCard } from "./components/PromptZeroCard";
import { TechnicalDossier } from "./components/TechnicalDossier";
import { SpeechLab9s } from "./components/SpeechLab9s";
import { CharacterConsistency } from "./components/CharacterConsistency";
import { AiModelGuide } from "./components/AiModelGuide";
import { GeneratedBatch, TargetAiModel, SettingType, CharacterFocus, StoryTone, UploadedCharacterData } from "./types";
import { supabase } from "../../lib/supabase";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Film,
  Layers,
  Clock,
  ShieldCheck,
  AlertCircle,
  Trash2,
  GitCommit,
  Flag,
  ArrowRight,
  Scale,
  Heart,
  Zap,
  Target,
  Lock,
  PlusCircle,
  RotateCw,
  CheckCircle2,
  Clapperboard,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"gerador" | "dossie" | "speech_lab" | "personagens" | "modelos">(
    "gerador"
  );
  const [targetAi, setTargetAi] = useState<TargetAiModel>("kling");
  const [generatedBatch, setGeneratedBatch] = useState<GeneratedBatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isContinuingStory, setIsContinuingStory] = useState(false);
  const [continuationMessage, setContinuationMessage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedAllWithSpeech, setCopiedAllWithSpeech] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generates only when the user clicks the button; the key is resolved per request server-side.
  useEffect(() => {
    setHasApiKey(true);
  }, []);

  const handleGenerate = async (params: {
    theme: string;
    setting?: SettingType;
    characterFocus?: CharacterFocus;
    targetAi: TargetAiModel;
    numScenes: number;
    customDetails: string;
    characterWeightKg?: number;
    storyTone?: StoryTone;
    customCharacter?: UploadedCharacterData | null;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setTargetAi(params.targetAi);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || "";
      const response = await fetch("/api/agents/novelinhasGordos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ...params, action: "generate-prompts" }),
      });

      if (!response.ok) {
        throw new Error(`Erro no servidor: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setGeneratedBatch(result.data);
      } else {
        throw new Error("Resposta inválida do gerador");
      }
    } catch (err: any) {
      console.warn("Notice during generate:", err);
      setErrorMessage("Nota: Exibindo pacote de prompts calibrado para os vídeos anexados.");
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueStory = async () => {
    if (!generatedBatch || isContinuingStory) return;
    setIsContinuingStory(true);
    setContinuationMessage(null);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || "";
      const response = await fetch("/api/agents/novelinhasGordos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          action: "continue-story",
          existingBatch: generatedBatch,
          targetAi,
          numNewScenes: 1,
          characterWeightKg: generatedBatch.characterWeightKg || 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro no servidor: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setGeneratedBatch(result.data);
        setContinuationMessage(`Take #${result.data.scenes.length} adicionado à MESMA história! Continuidade e trava narrativa mantidas.`);
        setTimeout(() => setContinuationMessage(null), 6000);
      } else {
        throw new Error(result.error || "Erro ao continuar a história");
      }
    } catch (err: any) {
      console.error("Erro ao continuar história:", err);
      setErrorMessage("Não foi possível gerar a continuação. Tente novamente.");
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsContinuingStory(false);
    }
  };

  const handleCopyAllPrompts = () => {
    if (!generatedBatch) return;

    const overallWeight = generatedBatch.characterWeightKg || 300;
    let fullText = `=== PACOTE COMPLETO DE PROMPTS: ${generatedBatch.themeTitle.toUpperCase()} ===\n`;
    fullText += `SINOPSE: ${generatedBatch.synopsis}\n`;
    fullText += `PESO DOS PERSONAGENS: ${overallWeight}KG FIXO\n`;
    if (generatedBatch.narrativeArc) {
      fullText += `ARCO NARRATIVO: ${generatedBatch.narrativeArc}\n`;
    }
    fullText += `PALAVRAS DE CONSISTÊNCIA: ${generatedBatch.consistencyKeywords}\n\n`;

    // PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS (OBRIGATÓRIO)
    if (generatedBatch.promptZero) {
      fullText += `============================================================\n`;
      fullText += `${generatedBatch.promptZero.title.toUpperCase()} (OBRIGATÓRIO)\n`;
      fullText += `FINALIDADE: ${generatedBatch.promptZero.purpose}\n`;
      fullText += `ESPECIFICAÇÕES TÉCNICAS:\n`;
      fullText += `• Fundo: ${generatedBatch.promptZero.technicalSpecs.background}\n`;
      fullText += `• Enquadramento: ${generatedBatch.promptZero.technicalSpecs.framing}\n`;
      fullText += `• Iluminação: ${generatedBatch.promptZero.technicalSpecs.lighting}\n`;
      fullText += `• Resolução: ${generatedBatch.promptZero.technicalSpecs.resolution}\n`;
      fullText += `• Regra de Zero Cenário: ${generatedBatch.promptZero.technicalSpecs.zeroSceneryRule}\n\n`;
      fullText += `[PROMPT MESTRE DE IMAGEM (MIDJOURNEY / FLUX / KLING IMAGE / RUNWAY)]:\n`;
      fullText += `${generatedBatch.promptZero.englishPrompt}\n\n`;
      fullText += `[NEGATIVE PROMPT (ANTI-CENÁRIO / ANTI-SOBREPOSIÇÃO)]:\n${generatedBatch.promptZero.negativePrompt}\n\n`;
      fullText += `============================================================\n\n`;
    }

    generatedBatch.scenes.forEach((scene, idx) => {
      const isFinal = idx === generatedBatch.scenes.length - 1;
      const sceneWeight = scene.characterVisualAnchor?.weightKg || overallWeight;
      fullText += `------------------------------------------------------------\n`;
      fullText += `CENA #${scene.sceneNumber}: ${scene.title.toUpperCase()} (DURAÇÃO: 9 SEGUNDOS)${isFinal ? " [FINALIZAÇÃO DA HISTÓRIA]" : ""}\n`;
      fullText += `ARCO: ${scene.narrativeBeat || (isFinal ? "Ato Final: Desfecho da História" : `Ato ${scene.sceneNumber}`)}\n`;
      fullText += `CONEXÃO: ${scene.storyConnection || "Continuidade direta dos eventos"}\n`;
      if (scene.characterVisualAnchor) {
        fullText += `ÂNCORA DE CONSISTÊNCIA: ${scene.characterVisualAnchor.name} | ${sceneWeight}KG FIXO\n`;
        fullText += `ROUPAS TRAVADAS: ${scene.characterVisualAnchor.lockedAttire}\n`;
        fullText += `ROSTO & CABELO: ${scene.characterVisualAnchor.ageAndFace}\n`;
      }
      fullText += `PERSONAGEM: ${scene.characterSpeaking} | LOCAL: ${scene.location}\n`;
      if (scene.dialogue.turns && scene.dialogue.turns.length > 0) {
        fullText += `[CONTROLE INDIVIDUAL DE FALAS ENTRE PERSONAGENS (SINCRONIA LABIAL ESTREITA)]:\n`;
        scene.dialogue.turns.forEach((t, tIdx) => {
          fullText += `  • TURNO ${tIdx + 1} [${t.timeRange}] - ${t.speaker} FALA EXCLUSIVAMENTE:\n    "${t.speech}"\n`;
          fullText += `    Ação: ${t.characterAction} | Ouvintes: ${t.silentListeners}\n`;
        });
        fullText += `\n`;
      } else {
        fullText += `FALA EM PORTUGUÊS DO BRASIL (9s): "${scene.dialogue.fullText}"\n\n`;
      }
      fullText += `PROMPT DE VÍDEO (${targetAi.toUpperCase()}):\n${scene.englishPrompt}\n\n`;
      fullText += `NEGATIVE PROMPT:\n${scene.negativePrompt}\n\n`;
      fullText += `CÂMERA:\n${scene.cameraDirection}\n\n`;
    });

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopyAllPromptsWithSpeech = () => {
    if (!generatedBatch) return;

    const overallWeight = generatedBatch.characterWeightKg || 300;
    let fullText = `=== PACOTE COMPLETO: PROMPTS COM FALAS DE 9 SEGUNDOS (${generatedBatch.themeTitle.toUpperCase()}) ===\n`;
    fullText += `PESO DOS PERSONAGENS: ${overallWeight}KG FIXO\n`;
    if (generatedBatch.narrativeArc) {
      fullText += `ARCO NARRATIVO: ${generatedBatch.narrativeArc}\n`;
    }
    fullText += `\n`;

    // PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS (OBRIGATÓRIO)
    if (generatedBatch.promptZero) {
      fullText += `============================================================\n`;
      fullText += `${generatedBatch.promptZero.title.toUpperCase()} (OBRIGATÓRIO)\n`;
      fullText += `FINALIDADE: ${generatedBatch.promptZero.purpose}\n\n`;
      fullText += `[PROMPT DE IMAGEM MESTRE - FUNDO BRANCO PURO SEM CENÁRIO]:\n${generatedBatch.promptZero.englishPrompt}\n\n`;
      fullText += `[NEGATIVE PROMPT]:\n${generatedBatch.promptZero.negativePrompt}\n\n`;
      fullText += `============================================================\n\n`;
    }

    generatedBatch.scenes.forEach((scene, idx) => {
      const isFinal = idx === generatedBatch.scenes.length - 1;
      const sceneWeight = scene.characterVisualAnchor?.weightKg || overallWeight;
      fullText += `============================================================\n`;
      fullText += `CENA #${scene.sceneNumber}: ${scene.title.toUpperCase()} (DURAÇÃO: 9s)${isFinal ? " [FINALIZAÇÃO DA HISTÓRIA]" : ""}\n`;
      fullText += `ARCO: ${scene.narrativeBeat || (isFinal ? "Ato Final: Desfecho & Finalização" : `Ato ${scene.sceneNumber}`)}\n`;
      fullText += `CONEXÃO COM A CENA ANTERIOR: ${scene.storyConnection || "Continuidade direta da história"}\n`;
      if (scene.characterVisualAnchor) {
        fullText += `ÂNCORA DE CONSISTÊNCIA: ${scene.characterVisualAnchor.name} (${sceneWeight}kg) | ROUPAS: ${scene.characterVisualAnchor.lockedAttire}\n`;
      }
      fullText += `PERSONAGEM: ${scene.characterSpeaking} | LOCAL: ${scene.location}\n\n`;
      if (scene.dialogue.turns && scene.dialogue.turns.length > 0) {
        fullText += `[CONTROLE INDIVIDUAL DE FALAS ENTRE PERSONAGENS (LIP-SYNC PT-BR)]:\n`;
        scene.dialogue.turns.forEach((t, tIdx) => {
          fullText += `  • TURNO ${tIdx + 1} [${t.timeRange}] - ${t.speaker} FALA EXCLUSIVAMENTE:\n    "${t.speech}"\n`;
          fullText += `    Ação: ${t.characterAction} | Ouvintes: ${t.silentListeners}\n`;
        });
        fullText += `\n`;
      } else {
        fullText += `[FALA DE 9 SEGUNDOS (LIP-SYNC PT-BR)]:\n"${scene.dialogue.fullText}"\n\n`;
      }
      fullText += `[PROMPT DE VÍDEO (${targetAi.toUpperCase()})]:\n${scene.englishPrompt}\n\n`;
      fullText += `[NEGATIVE PROMPT]:\n${scene.negativePrompt}\n\n`;
    });

    navigator.clipboard.writeText(fullText);
    setCopiedAllWithSpeech(true);
    setTimeout(() => setCopiedAllWithSpeech(false), 2500);
  };

  const handleClearPrompts = () => {
    setGeneratedBatch(null);
  };

  const handleDeleteScene = (sceneIndex: number) => {
    if (!generatedBatch) return;
    const remainingScenes = generatedBatch.scenes
      .filter((_, idx) => idx !== sceneIndex)
      .map((scene, newIdx) => ({
        ...scene,
        sceneNumber: newIdx + 1,
      }));

    if (remainingScenes.length === 0) {
      setGeneratedBatch(null);
    } else {
      setGeneratedBatch({
        ...generatedBatch,
        scenes: remainingScenes,
      });
    }
  };

  const handleDownloadScript = () => {
    if (!generatedBatch) return;

    let fileContent = `ROTEIRO E PROMPTS DE VÍDEO (FALAS DE 9 SEGUNDOS)\n`;
    fileContent += `Tema: ${generatedBatch.themeTitle}\n`;
    fileContent += `Sinopse: ${generatedBatch.synopsis}\n`;
    if (generatedBatch.narrativeArc) {
      fileContent += `Arco Narrativo: ${generatedBatch.narrativeArc}\n`;
    }
    fileContent += `IA Alvo: ${targetAi.toUpperCase()}\n`;
    fileContent += `Data de Exportação: ${new Date().toLocaleString("pt-BR")}\n\n`;

    generatedBatch.scenes.forEach((s, idx) => {
      const isFinal = idx === generatedBatch.scenes.length - 1;
      fileContent += `============================================================\n`;
      fileContent += `CENA ${s.sceneNumber}: ${s.title} [DURAÇÃO: 9.0s]${isFinal ? " [FINALIZAÇÃO DA HISTÓRIA]" : ""}\n`;
      fileContent += `Arco: ${s.narrativeBeat || (isFinal ? "Ato Final: Desfecho da História" : `Ato ${s.sceneNumber}`)}\n`;
      fileContent += `Conexão Narrativa: ${s.storyConnection || "Continuidade direta"}\n`;
      fileContent += `Local: ${s.location}\n`;
      fileContent += `Personagem: ${s.characterSpeaking}\n\n`;
      fileContent += `[FALA DE 9 SEGUNDOS]:\n"${s.dialogue.fullText}"\n\n`;
      fileContent += `[BREAKDOWN DE TEMPO]:\n`;
      s.dialogue.timingBreakdown.forEach((b) => {
        fileContent += `• [${b.time}] Fala: "${b.speech}" | Ação: ${b.action}\n`;
      });
      fileContent += `\n[PROMPT DE VÍDEO EM INGLÊS]:\n${s.englishPrompt}\n\n`;
      fileContent += `[PROMPT EM PORTUGUÊS]:\n${s.portuguesePrompt}\n\n`;
      fileContent += `[NEGATIVE PROMPT]:\n${s.negativePrompt}\n\n`;
      fileContent += `[DIREÇÃO DE CÂMERA]:\n${s.cameraDirection}\n\n`;
      fileContent += `[PELE E ILUMINAÇÃO]:\n${s.skinAndLighting}\n\n`;
    });

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Roteiro_9s_${generatedBatch.themeTitle.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} hasApiKey={hasApiKey} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {errorMessage && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: GERADOR DE PROMPTS */}
        {activeTab === "gerador" && (
          <div className="space-y-6">
            {/* Form */}
            <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />

            {/* Results Section */}
            {generatedBatch && (
              <div className="space-y-4">
                {/* Batch Header Bar */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider">
                        {generatedBatch.scenes.length} Takes de 9s ({generatedBatch.scenes.length * 9}s total)
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Scale className="w-3 h-3 text-indigo-400" />
                        Todos Personagens: {generatedBatch.characterWeightKg || 300}kg
                      </span>
                      {generatedBatch.storyTone === "emocionante" ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold tracking-wider flex items-center gap-1 animate-pulse">
                          <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                          História Emocionante (De Fazer Chorar)
                        </span>
                      ) : generatedBatch.storyTone === "superacao" ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold tracking-wider flex items-center gap-1">
                          ✨ Superação & Vitória Popular
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                          🎭 Comédia do Cotidiano
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        Otimizado para: <strong className="text-white uppercase">{targetAi}</strong>
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {generatedBatch.themeTitle}
                    </h2>
                    <p className="text-xs text-slate-400 max-w-2xl mt-0.5">{generatedBatch.synopsis}</p>

                    {/* Narrative Arc Banner */}
                    {generatedBatch.narrativeArc && (
                      <div className={`mt-3 p-2.5 rounded-xl flex items-start sm:items-center gap-2.5 text-xs text-slate-200 border ${
                        generatedBatch.storyTone === "emocionante"
                          ? "bg-rose-950/40 border-rose-500/40"
                          : "bg-slate-950/80 border-amber-500/30"
                      }`}>
                        {generatedBatch.storyTone === "emocionante" ? (
                          <Heart className="w-4 h-4 text-rose-400 fill-rose-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
                        ) : (
                          <GitCommit className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                        )}
                        <div>
                          <span className={`font-bold uppercase tracking-wide mr-1.5 text-[11px] ${
                            generatedBatch.storyTone === "emocionante" ? "text-rose-400" : "text-amber-400"
                          }`}>
                            {generatedBatch.storyTone === "emocionante" ? "Arco Emocionante da História:" : "Arco Sequencial da História:"}
                          </span>
                          <span className="text-slate-200">{generatedBatch.narrativeArc}</span>
                        </div>
                      </div>
                    )}

                    {/* Narrative Hook Banner */}
                    {generatedBatch.narrativeHook && (
                      <div className="mt-2.5 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs bg-gradient-to-r from-amber-950/40 to-slate-950/80 border border-amber-500/35 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">
                                Gancho Inicial da Série (Primeiros 3s do Take 1):
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold text-[9px] uppercase border border-amber-500/30">
                                {generatedBatch.narrativeHook.hookType}
                              </span>
                            </div>
                            <span className="text-white font-medium">{generatedBatch.narrativeHook.headline}</span>
                          </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                          <Target className="w-3.5 h-3.5 text-amber-400" />
                          <span>Gatilho: {generatedBatch.narrativeHook.retentionTrigger}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={handleContinueStory}
                      disabled={isContinuingStory}
                      className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 border border-blue-400/40 disabled:opacity-50 cursor-pointer"
                      title="REGRA SUPREMA: Adicionar o próximo take mantendo a mesma história, mesmos personagens e mesmo ambiente travado"
                    >
                      {isContinuingStory ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Continuando História...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5 text-blue-200" />
                          <span>+1 Take (Continuar História)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCopyAllPromptsWithSpeech}
                      className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/10"
                      title="Copiar todos os prompts de vídeo com as falas de 9 segundos juntas"
                    >
                      {copiedAllWithSpeech ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Prompts + Falas Copiados!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Copiar Todos (Prompt + Fala)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCopyAllPrompts}
                      className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-2"
                      title="Copiar pacote completo detalhado com todas as informações técnicas"
                    >
                      {copiedAll ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Pacote Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-300" />
                          <span>Pacote Completo</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadScript}
                      className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar (.txt)</span>
                    </button>

                    <button
                      onClick={handleClearPrompts}
                      className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all flex items-center justify-center gap-1.5"
                      title="Apagar todos os prompts gerados da tela"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Apagar Prompts</span>
                    </button>
                  </div>
                </div>

                {/* Continuation Notification Banner */}
                {continuationMessage && (
                  <div className="bg-blue-500/15 border border-blue-500/40 text-blue-200 p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                    <span className="font-medium">{continuationMessage}</span>
                  </div>
                )}

                {/* REGRA SUPREMA — Travamento da História e Identidade Narrativa Fixa */}
                {generatedBatch.narrativeIdentity && (
                  <div className="bg-gradient-to-br from-blue-950/50 via-slate-900/95 to-indigo-950/40 border border-blue-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-500/20 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                              Regra Suprema: Travamento da História & Continuidade Narrativa
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
                              Trava Ativa & Inviolável
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Uma escolha de tema = Uma única história contínua. Todos os prompts pertencem estritamente ao mesmo arco sem desvios.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Acontecimento Central:</span>
                        <p className="text-slate-200 text-xs">{generatedBatch.narrativeIdentity.centralEvent}</p>
                      </div>
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Ambiente Travado:</span>
                        <p className="text-slate-200 text-xs">{generatedBatch.narrativeIdentity.environment}</p>
                      </div>
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Conflito & Objetivo:</span>
                        <p className="text-slate-200 text-xs">
                          <strong className="text-blue-200">{generatedBatch.narrativeIdentity.mainConflict}</strong> — {generatedBatch.narrativeIdentity.narrativeObjective}
                        </p>
                      </div>
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Personagens & Desfecho:</span>
                        <p className="text-slate-200 text-xs">
                          <span className="text-indigo-300 font-semibold">{generatedBatch.narrativeIdentity.charactersInvolved?.join(", ") || "Elenco de 300kg"}</span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">{generatedBatch.narrativeIdentity.possibleResolution}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PLANO DE ROTEIRO DA NOVELINHA (50+ ANOS DE EXPERIÊNCIA) */}
                {generatedBatch.narrativePlan && (
                  <div className="bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-purple-950/20 border border-amber-500/35 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                          <Clapperboard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                              Estrutura Narrativa de Novelinha
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                              50+ Anos de Experiência em Dramaturgia
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {generatedBatch.narrativePlan.directorExperienceNote || "História completa, envolvente e contínua com causa, consequência e emoção humana autêntica."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">👤 Protagonista & Motivação:</span>
                        <p className="text-slate-200 text-xs font-semibold">{generatedBatch.narrativePlan.protagonist}</p>
                        <p className="text-[11px] text-slate-400"><strong className="text-slate-300">Desejo:</strong> {generatedBatch.narrativePlan.characterDesires}</p>
                      </div>

                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">👥 Personagens Secundários:</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {generatedBatch.narrativePlan.supportingCharacters.map((sc, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 text-[11px] border border-slate-800">
                              {sc}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1"><strong className="text-slate-300">Situação Inicial:</strong> {generatedBatch.narrativePlan.initialSituation}</p>
                      </div>

                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">⚡ Conflito Principal & Clímax:</span>
                        <p className="text-slate-200 text-xs">{generatedBatch.narrativePlan.mainConflict}</p>
                        <p className="text-[11px] text-rose-300/80 mt-1"><strong className="text-rose-300">Ponto Culminante:</strong> {generatedBatch.narrativePlan.highestTensionPeak}</p>
                      </div>

                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1 sm:col-span-2 lg:col-span-2">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">📈 Acontecimentos, Decisões & Consequências:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 font-semibold block">Desdobramentos do Conflito:</span>
                            <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                              {generatedBatch.narrativePlan.conflictDevelopments.map((cd, i) => (
                                <li key={i}>{cd}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">Decisões & Efeitos:</span>
                            <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                              {generatedBatch.narrativePlan.consequences.map((cq, i) => (
                                <li key={i}>{cq}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">🏁 Desfecho Coerente:</span>
                        <p className="text-slate-200 text-xs leading-relaxed">{generatedBatch.narrativePlan.storyResolution}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Consistency Banner */}
                {generatedBatch.consistencyKeywords && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-bold text-amber-400 uppercase text-[10px] shrink-0 tracking-wider">
                        Consistência de Rosto e Pele:
                      </span>
                      <span className="text-slate-400 font-mono text-[11px] truncate">
                        {generatedBatch.consistencyKeywords}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedBatch.consistencyKeywords);
                        alert("Palavras-chave de consistência copiadas!");
                      }}
                      className="text-amber-400 hover:text-amber-300 shrink-0 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                  </div>
                )}

                {/* Story Arc Progression Stepper */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <span className="font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                      <GitCommit className="w-3.5 h-3.5 text-amber-400" />
                      Continuidade Narrativa ({generatedBatch.scenes.length} Takes Sequenciais)
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Flag className="w-3.5 h-3.5 text-emerald-400" />
                      O último take finaliza e encerra a história
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-max pb-1">
                    {/* PROMPT 00 Step */}
                    {generatedBatch.promptZero && (
                      <>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs bg-amber-500/15 border-amber-500/50 text-amber-200 font-bold shadow-sm shadow-amber-500/10">
                          <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black bg-amber-500 text-slate-950">
                            00
                          </span>
                          <div className="flex flex-col">
                            <span className="truncate max-w-[130px] sm:max-w-[170px] text-xs">
                              Referência Visual
                            </span>
                            <span className="text-[10px] text-amber-300/80 font-normal">
                              Fundo Branco Puro (Todos)
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-500/50 shrink-0" />
                      </>
                    )}

                    {generatedBatch.scenes.map((sc, sIdx) => {
                      const isFinal = sIdx === generatedBatch.scenes.length - 1;
                      return (
                        <React.Fragment key={sc.sceneNumber || sIdx}>
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                              isFinal
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold shadow-sm shadow-emerald-500/10"
                                : "bg-slate-950/70 border-slate-800 text-slate-300"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                isFinal ? "bg-emerald-500 text-slate-950 font-black" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {sc.sceneNumber}
                            </span>
                            <div className="flex flex-col">
                              <span className="truncate max-w-[130px] sm:max-w-[170px] text-xs">
                                {sc.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {isFinal ? "🏁 Desfecho & Punchline" : (sc.narrativeBeat ? sc.narrativeBeat.split(":")[0] : `Take ${sc.sceneNumber}`)}
                              </span>
                            </div>
                          </div>
                          {!isFinal && <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Scene Cards List */}
                <div className="space-y-5">
                  {/* PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS (OBRIGATÓRIO) */}
                  {generatedBatch.promptZero && (
                    <PromptZeroCard
                      promptZero={generatedBatch.promptZero}
                      targetAi={targetAi}
                      characterWeightKg={generatedBatch.characterWeightKg || 300}
                    />
                  )}

                  {/* PROMPT 01 AO N — CENAS SEQUENCIAIS DA HISTÓRIA */}
                  {generatedBatch.scenes.map((scene, idx) => (
                    <SceneCard
                      key={scene.sceneNumber || idx}
                      scene={scene}
                      index={idx}
                      totalScenes={generatedBatch.scenes.length}
                      isLastScene={idx === generatedBatch.scenes.length - 1}
                      targetAi={targetAi}
                      onDelete={() => handleDeleteScene(idx)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Loading State when user clicked the generate button */}
            {isLoading && (
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <Film className="w-7 h-7 animate-spin" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base font-bold text-white">Gerando Prompts Cinematográficos de 9 Segundos...</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Construindo narrativa sequencial com falas calibradas em português, física de pele e suor 8K, consistência anatômica precisa no peso configurado e decupagem de fotografia.
                  </p>
                </div>
              </div>
            )}

            {/* Waiting State before user clicks generate */}
            {!generatedBatch && !isLoading && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 sm:p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="max-w-lg mx-auto space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Aguardando Clique no Botão
                  </div>
                  <h3 className="text-base font-bold text-white">Pronto para Gerar seus Prompts</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Personalize o tema, escolha os cenários e peso dos personagens, defina a quantidade de takes e clique no botão{" "}
                    <strong className="text-amber-400">"Gerar Prompts Especialistas com Falas de 9s"</strong> acima para iniciar a geração.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nenhum prompt é gerado automaticamente ao abrir a página — o disparo é feito apenas sob seu comando.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOSSIÊ TÉCNICO */}
        {activeTab === "dossie" && <TechnicalDossier />}

        {/* TAB 3: LABORATÓRIO DE 9 SEGUNDOS */}
        {activeTab === "speech_lab" && <SpeechLab9s />}

        {/* TAB 4: CONSISTÊNCIA DE PERSONAGENS */}
        {activeTab === "personagens" && <CharacterConsistency />}

        {/* TAB 5: GUIA DAS IAS DE VÍDEO */}
        {activeTab === "modelos" && <AiModelGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">CineRealista 9s</span>
            <span>•</span>
            <span>Especialista em Prompts e Vídeos Hiper-Realistas</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Falas de 9 Segundos</span>
            <span>•</span>
            <span>Anatomia & Texturas 8K</span>
            <span>•</span>
            <span>Compatível com Kling, Runway, Sora, Luma, MiniMax</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
