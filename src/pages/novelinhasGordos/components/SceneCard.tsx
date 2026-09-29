import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Copy,
  Check,
  Play,
  Square,
  Volume2,
  Camera,
  Layers,
  Sparkles,
  AlertTriangle,
  Flame,
  FileText,
  User,
  MapPin,
  Trash2,
  GitCommit,
  Flag,
  ArrowRight,
  ShieldCheck,
  Shirt,
  UserCheck,
  Clapperboard,
  Film,
  Eye,
  Activity,
  Hand,
  Heart,
  Target,
  Zap,
  Lock,
  CheckCircle2,
  MessageSquare,
  Users,
  Mic,
  VolumeX,
} from "lucide-react";
import { GeneratedScene, TargetAiModel } from "../types";

interface SceneCardProps {
  scene: GeneratedScene;
  index: number;
  totalScenes?: number;
  isLastScene?: boolean;
  targetAi: TargetAiModel;
  onDelete?: () => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  index,
  totalScenes,
  isLastScene,
  targetAi,
  onDelete,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // 0 to 9 seconds
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isFinalScene = isLastScene ?? (totalScenes ? scene.sceneNumber === totalScenes : false);

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Audio Speech Preview Simulator for 9 seconds
  const handlePlaySpeech = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      stopAudioProgress();
      return;
    }

    if (!("speechSynthesis" in window)) {
      alert("Seu navegador não suporta síntese de voz nativa.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scene.dialogue.fullText);
    utterance.lang = "pt-BR";
    // Calibrate rate to match natural 9-second delivery
    utterance.rate = 0.98;
    utterance.pitch = 0.95;

    // Try finding a PT-BR voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt") || v.lang.includes("BR"));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    setIsPlayingAudio(true);
    setAudioProgress(0);

    const startTime = Date.now();
    audioIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= 9) {
        setAudioProgress(9);
        stopAudioProgress();
      } else {
        setAudioProgress(Number(elapsed.toFixed(1)));
      }
    }, 100);

    utterance.onend = () => {
      stopAudioProgress();
    };

    utterance.onerror = () => {
      stopAudioProgress();
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopAudioProgress = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    setIsPlayingAudio(false);
    setTimeout(() => setAudioProgress(0), 1000);
  };

  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Format complete prompt package for user copy
  let characterConsistencyBlock = "";
  const allCharacters = scene.charactersInScene && scene.charactersInScene.length > 0
    ? scene.charactersInScene
    : (scene.characterVisualAnchor ? [scene.characterVisualAnchor] : []);

  if (allCharacters.length > 0) {
    characterConsistencyBlock = `ÂNCORAS DE CONSISTÊNCIA VISUAL (${allCharacters.length} PERSONAGEM(NS) NA CENA - TRAVADOS CONTRA MUTAÇÃO):
${allCharacters.map((c, idx) => `[PERSONAGEM ${idx + 1}: ${c.name.toUpperCase()} (300KG) - ${c.roleInStory || 'ELENCO'}]
- Roupas Travadas (Locked Attire): ${c.lockedAttire}
- Rosto, Cabelo & Idade: ${c.ageAndFace}
- Físico 300kg: ${c.bodyAndWeight300kg}
- Textura Cutânea & Suor: ${c.perspirationAndSkin}
- Prompt de Consistência (Clause): ${c.consistencyPromptClause}`).join("\n\n")}
\n`;
  }

  const fullExportPackage = `=== CENA ${scene.sceneNumber}: ${scene.title.toUpperCase()} (DURAÇÃO: 9 SEGUNDOS) ===
ARCO NARRATIVO: ${scene.narrativeBeat || (isFinalScene ? "ETAPA 5 — DESFECHO" : `Take ${scene.sceneNumber}`)}
${scene.novelinhaProgression ? `ETAPA DA NOVELINHA: ${scene.novelinhaProgression.stageName}
CAUSA & CONSEQUÊNCIA:
- O que aconteceu antes: ${scene.novelinhaProgression.whatHappenedBefore}
- Desejo do personagem: ${scene.novelinhaProgression.characterDesireNow}
- Ação lógica: ${scene.novelinhaProgression.logicalNextAction} (Por que acontece: ${scene.novelinhaProgression.whyActionHappens})
- Consequência imediata: ${scene.novelinhaProgression.immediateConsequence}
- Prepara o próximo prompt: ${scene.novelinhaProgression.preparesNextPrompt}
- Evolução emocional gradual: ${scene.novelinhaProgression.emotionalEvolution}
- Enquadramento humano: ${scene.novelinhaProgression.humanInteractionFraming}\n` : ""}CONEXÃO COM A HISTÓRIA: ${scene.storyConnection || "Continuidade direta da narrativa"}

${characterConsistencyBlock}${scene.dialogue.turns && scene.dialogue.turns.length > 0 ? `CONTROLE INDIVIDUAL DE FALAS ENTRE PERSONAGENS (SINCRONIA LABIAL ESTREITA):
${scene.dialogue.turns.map((t, idx) => `[TURNO #${idx + 1} | INTERVALO: ${t.timeRange}]
• FALANTE EXCLUSIVO: ${t.speaker}
• FALA EM PORTUGUÊS DO BRASIL: "${t.speech}"
• AÇÃO FÍSICA MOTIVADA: ${t.characterAction}
• OUVINTES EM SILÊNCIO LABIAL: ${t.silentListeners}
• REGRA DE SINCRONIA: ${t.lipSyncExclusiveRule}`).join("\n\n")}
` : `FALA EM PORTUGUÊS DO BRASIL (LIP-SYNC 9s) [00:00 - 00:09]:
"${scene.dialogue.fullText}"
`}
PROMPT DE VÍDEO (INGLÊS PARA ${targetAi.toUpperCase()}):
${scene.englishPrompt}

NEGATIVE PROMPT:
${scene.negativePrompt}

DIREÇÃO DE CÂMERA:
${scene.cameraDirection}

PELE E ILUMINAÇÃO:
${scene.skinAndLighting}
`;

  // Format prompt with 9-second dialogue included
  const turnsFormattedForSinglePrompt = scene.dialogue.turns && scene.dialogue.turns.length > 0
    ? scene.dialogue.turns.map(t => `[${t.timeRange}] ${t.speaker.toUpperCase()} FALA EXCLUSIVAMENTE:\n"${t.speech}"\n(Ação: ${t.characterAction} | Ouvintes: ${t.silentListeners})`).join("\n\n")
    : `"${scene.dialogue.fullText}"`;

  const promptWithSpeech = `PROMPT DE VÍDEO (${targetAi.toUpperCase()}):
${scene.englishPrompt}

[LIP-SYNC MULTI-CHARACTER DIALOGUE - 9 SECONDS / FALAS EM PORTUGUÊS DO BRASIL]:
${turnsFormattedForSinglePrompt}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition-all">
      {/* Top Scene Header */}
      <div className="bg-slate-950/70 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
            #{scene.sceneNumber}
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              {scene.title}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400/80" /> {scene.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-blue-400/80" /> {scene.characterSpeaking}
              </span>
            </div>
          </div>
        </div>

        {/* 9 Seconds Duration Badge & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>9.0 Segundos</span>
          </div>

          <button
            onClick={() => handleCopy(promptWithSpeech, "prompt_with_speech_top")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/10"
            title="Copiar Prompt de Vídeo + Fala de 9 Segundos"
          >
            {copiedType === "prompt_with_speech_top" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Prompt + Fala Copiados!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Copiar Prompt + Fala (9s)</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleCopy(fullExportPackage, "full")}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
            title="Copiar Roteiro e Prompts Completos"
          >
            {copiedType === "full" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Tudo Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Pacote Completo</span>
              </>
            )}
          </button>

          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-medium border border-rose-500/25 hover:border-rose-500/40 transition-all"
              title="Apagar este take / prompt da lista"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apagar take</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Narrative Continuity & Storyline Resolution Box */}
        {(scene.narrativeBeat || scene.storyConnection || isFinalScene) && (() => {
          const isEmotionalBeat =
            scene.narrativeBeat?.toLowerCase().includes("lágrima") ||
            scene.narrativeBeat?.toLowerCase().includes("comovente") ||
            scene.narrativeBeat?.toLowerCase().includes("abraço") ||
            scene.narrativeBeat?.toLowerCase().includes("superação") ||
            scene.title?.toLowerCase().includes("lágrima") ||
            scene.title?.toLowerCase().includes("abraço");

          return (
            <div
              className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                isEmotionalBeat
                  ? "bg-rose-950/25 border-rose-500/40 text-rose-100 shadow-sm shadow-rose-500/10"
                  : isFinalScene
                  ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-100 shadow-sm shadow-emerald-500/10"
                  : "bg-slate-950/70 border-slate-800 text-slate-300"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isEmotionalBeat ? (
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/30">
                    <Heart className="w-4 h-4 fill-rose-400 text-rose-400 animate-pulse" />
                  </div>
                ) : isFinalScene ? (
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 border border-emerald-500/30">
                    <Flag className="w-4 h-4 fill-emerald-400/20" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 border border-amber-500/25">
                    <GitCommit className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      {scene.narrativeBeat || (isFinalScene ? "Ato Final: Desfecho da História" : `Ato ${scene.sceneNumber}`)}
                    </span>
                    {isEmotionalBeat && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/25 text-rose-300 font-bold text-[10px] uppercase tracking-wide border border-rose-500/40 flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                        <span>Momento Comovente</span>
                      </span>
                    )}
                    {isFinalScene && !isEmotionalBeat && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wide border border-emerald-500/30 flex items-center gap-1">
                        <span>🏁 Finalização da História</span>
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    <strong className={isEmotionalBeat ? "text-rose-300 font-medium" : "text-amber-300 font-medium"}>
                      Continuidade da Cena:{" "}
                    </strong>
                    {scene.storyConnection ||
                      (isFinalScene
                        ? "Conclusão definitiva do episódio, entregando a resolução e emoção final da trama."
                        : "Desenvolvimento contínuo da narrativa conectada ao take anterior.")}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Narrative Hook & Inciting Incident Box (Cena 1 ou cenas com gancho) */}
        {scene.narrativeHook && (
          <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 to-slate-950/70 text-xs shadow-md space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-amber-300 uppercase tracking-wide text-[11px]">
                  Gancho de Abertura (Hook Magnético - Primeiros 3 Segundos)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider">
                {scene.narrativeHook.hookType === "no_na_garganta"
                  ? "Nó na Garganta"
                  : scene.narrativeHook.hookType === "dilema_urgente"
                  ? "Dilema Urgente"
                  : scene.narrativeHook.hookType === "revelacao_chocante"
                  ? "Revelação Chocante"
                  : scene.narrativeHook.hookType === "pergunta_provocativa"
                  ? "Pergunta Provocativa"
                  : "Ação em Andamento (In Media Res)"}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-white font-bold text-xs sm:text-sm flex items-start gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{scene.narrativeHook.headline}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-amber-400 font-semibold block mb-0.5">👁️ Impacto Visual Inicial:</span>
                  <span className="text-slate-300">{scene.narrativeHook.visualElement}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-blue-400 font-semibold block mb-0.5">🎯 Promessa da História:</span>
                  <span className="text-slate-300">{scene.narrativeHook.corePromise}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-semibold block mb-0.5">🧲 Gatilho de Retenção:</span>
                  <span className="text-slate-300">{scene.narrativeHook.retentionTrigger}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hook Payoff (Resolução ou Escalação do Gancho) */}
        {!scene.narrativeHook && scene.hookPayoff && (
          <div className="p-3 rounded-xl border border-sky-500/25 bg-sky-950/15 text-xs flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-sky-300 font-bold uppercase tracking-wide text-[10px] block mb-0.5">
                Desenvolvimento do Gancho Inicial:
              </span>
              <span className="text-slate-300 text-xs leading-relaxed">{scene.hookPayoff}</span>
            </div>
          </div>
        )}

        {/* REGRA SUPREMA — ESTRUTURA NARRATIVA CINEMATOGRÁFICA E CONTINUIDADE DE NOVELINHAS (50+ ANOS DE EXPERIÊNCIA) */}
        {scene.novelinhaProgression && (() => {
          const prog = scene.novelinhaProgression;
          const stageStyles = {
            gancho_inicial: {
              badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
              border: "border-amber-500/30",
              glow: "from-amber-950/25 to-slate-950/80",
              icon: Zap,
            },
            desenvolvimento: {
              badge: "bg-sky-500/20 text-sky-300 border-sky-500/40",
              border: "border-sky-500/30",
              glow: "from-sky-950/25 to-slate-950/80",
              icon: Film,
            },
            complicacao: {
              badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
              border: "border-purple-500/30",
              glow: "from-purple-950/25 to-slate-950/80",
              icon: AlertTriangle,
            },
            climax: {
              badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
              border: "border-rose-500/30",
              glow: "from-rose-950/25 to-slate-950/80",
              icon: Flame,
            },
            desfecho: {
              badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
              border: "border-emerald-500/30",
              glow: "from-emerald-950/25 to-slate-950/80",
              icon: CheckCircle2,
            },
          }[prog.stage] || {
            badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            border: "border-amber-500/30",
            glow: "from-amber-950/25 to-slate-950/80",
            icon: Clapperboard,
          };

          const StageIcon = stageStyles.icon;

          return (
            <div className={`p-4 rounded-xl border ${stageStyles.border} bg-gradient-to-br ${stageStyles.glow} text-xs shadow-md space-y-3`}>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-400">
                    <StageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white uppercase tracking-wide text-[11px] block">
                      Diretriz de Novelinha Cinematográfica
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Roteiro e direção veterana de novelas (50+ anos) • Causa & Efeito
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-[11px] border ${stageStyles.badge}`}>
                  {prog.stageName}
                </span>
              </div>

              {/* Sequential cause-and-effect flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="text-amber-400 font-semibold block text-[10px] uppercase tracking-wider">
                    ⏮️ 1. O que aconteceu antes:
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{prog.whatHappenedBefore}</p>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="text-sky-400 font-semibold block text-[10px] uppercase tracking-wider">
                    🎯 2. O que o personagem deseja agora:
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{prog.characterDesireNow}</p>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="text-emerald-400 font-semibold block text-[10px] uppercase tracking-wider">
                    🎬 3. Ação Lógica & Causa Motivada:
                  </span>
                  <p className="text-slate-200 font-medium leading-relaxed text-[11px]">{prog.logicalNextAction}</p>
                  <p className="text-slate-400 text-[10px] italic">Motivo: {prog.whyActionHappens}</p>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="text-purple-400 font-semibold block text-[10px] uppercase tracking-wider">
                    ⚡ 4. Consequência Imediata:
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{prog.immediateConsequence}</p>
                </div>
              </div>

              {/* Prepares Next Prompt & Framing */}
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <strong className="text-amber-300 font-semibold">Gancho para o Próximo Take: </strong>
                    <span className="text-slate-300">{prog.preparesNextPrompt}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <strong className="text-rose-300 font-semibold block mb-0.5">🎭 Evolução Emocional Gradual:</strong>
                    <span className="text-slate-300">{prog.emotionalEvolution}</span>
                  </div>
                  <div>
                    <strong className="text-blue-300 font-semibold block mb-0.5">👥 Enquadramento Humano de Interação:</strong>
                    <span className="text-slate-300">{prog.humanInteractionFraming}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Character Visual Anchor (Consistência de Personagens - Sem Erros de IA) */}
        {allCharacters.length > 0 && (
          <div className="bg-indigo-950/25 border border-indigo-500/35 rounded-xl p-3.5 sm:p-4 text-xs shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-indigo-500/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-indigo-300 uppercase tracking-wide text-[11px] sm:text-xs">
                  {allCharacters.length > 1
                    ? `Âncoras de Consistência (${allCharacters.length} Personagens na Cena - Roupas e Físico Travados)`
                    : "Âncora de Consistência do Personagem (Sem Erros ou Mutações de IA)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-[10px] border border-indigo-500/30">
                  {allCharacters.length} Personagem(ns) • Todos {scene.characterVisualAnchor?.weightKg || 300}kg Fixo
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {allCharacters.map((char, charIdx) => {
                const charWeight = char.weightKg || scene.characterVisualAnchor?.weightKg || 300;
                return (
                <div key={char.name + charIdx} className="bg-slate-950/60 rounded-xl p-3 border border-indigo-500/20 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {charIdx + 1}
                      </span>
                      <span className="font-bold text-white text-xs">
                        {char.name}
                      </span>
                      {char.roleInStory && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-200 border border-indigo-700/50 font-medium">
                          {char.roleInStory}
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                        {charWeight}kg Fixo
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(char.consistencyPromptClause, `char_anchor_${charIdx}`)}
                      className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 font-medium bg-indigo-500/20 hover:bg-indigo-500/30 px-2 py-0.5 rounded border border-indigo-500/30 transition-all"
                      title={`Copiar fórmula de prompt de consistência de ${char.name}`}
                    >
                      {copiedType === `char_anchor_${charIdx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedType === `char_anchor_${charIdx}` ? "Clause Copiada!" : `Copiar Clause de ${char.name.split(" ")[0]}`}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-300 text-[11px] mb-1">
                        <Shirt className="w-3.5 h-3.5 text-amber-400" />
                        Roupas Travadas (Locked Attire):
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {char.lockedAttire}
                      </p>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-[11px] mb-1">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        Rosto, Cabelo & Idade:
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {char.ageAndFace}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] text-slate-400">
                    <div>
                      <strong className="text-indigo-300">Física {charWeight}kg:</strong> {char.bodyAndWeight300kg}
                    </div>
                    <div>
                      <strong className="text-amber-400">Pele & Suor:</strong> {char.perspirationAndSkin}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Section 1: 9-SECOND DIALOGUE & INDIVIDUAL SPEECH CONTROL (CONTROLE DE FALAS INDIVIDUAIS) */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-amber-500/20 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Controle Individual de Falas (Sincronia Labial Estrita)
                  </span>
                  {scene.dialogue.multiCharacterDialogue && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase">
                      Diálogo Entre Múltiplos Personagens
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  Somente quem fala move os lábios • Ouvintes permanecem em silêncio com lábios fechados • Sem zoom automático
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">
                {scene.dialogue.wordCount} palavras (~2.3 pal/seg)
              </span>
              <button
                onClick={() => handleCopy(scene.dialogue.fullText, "dialogue")}
                className="text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20"
              >
                {copiedType === "dialogue" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedType === "dialogue" ? "Copiado!" : "Copiar Diálogo"}
              </button>
            </div>
          </div>

          {/* Structured Dialogue Turns (Turnos de Fala Individuais por Personagem) */}
          {scene.dialogue.turns && scene.dialogue.turns.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  Turnos Sequenciais de Fala no Take (Tempo & Identidade Vocal Travados):
                </span>
                <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Proibido Troca de Vozes
                </span>
              </div>

              <div className="space-y-2.5">
                {scene.dialogue.turns.map((turn, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2 relative overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {turn.timeRange}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-sky-400" />
                          <strong className="text-white text-xs tracking-wide">
                            {turn.speaker} <span className="text-amber-400 font-normal">FALA EXCLUSIVAMENTE:</span>
                          </strong>
                        </div>
                      </div>

                      {turn.speakerVisualAnchor && (
                        <span className="text-[10px] text-slate-400 italic truncate max-w-[200px] sm:max-w-xs">
                          {turn.speakerVisualAnchor}
                        </span>
                      )}
                    </div>

                    {/* Spoken text in PT-BR */}
                    <div className="text-slate-100 text-sm font-medium italic pl-3 border-l-2 border-amber-400 leading-relaxed">
                      "{turn.speech}"
                    </div>

                    {/* Physical Action & Silent Listeners with Closed Lips */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-[11px]">
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/70 space-y-0.5">
                        <span className="text-emerald-400 font-semibold block text-[10px] uppercase tracking-wide">
                          🎬 Ação Motivada do Falante:
                        </span>
                        <p className="text-slate-300 text-xs">{turn.characterAction}</p>
                      </div>

                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/70 space-y-0.5">
                        <span className="text-purple-400 font-semibold block text-[10px] uppercase tracking-wide flex items-center gap-1">
                          <VolumeX className="w-3 h-3 text-purple-400" />
                          Ouvintes em Silêncio Labial:
                        </span>
                        <p className="text-slate-300 text-xs">{turn.silentListeners}</p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-slate-800/50">
                      <Mic className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{turn.lipSyncExclusiveRule}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Full Speech Display fallback */
            <div className="text-slate-100 text-sm sm:text-base font-medium italic leading-relaxed pl-3 border-l-2 border-amber-500">
              "{scene.dialogue.fullText}"
            </div>
          )}

          {/* Audio Simulator & 9s Timeline Bar */}
          <div className="bg-slate-950/80 rounded-xl p-3 border border-amber-500/20">
            <div className="flex items-center justify-between gap-3 mb-2">
              <button
                onClick={handlePlaySpeech}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                  isPlayingAudio
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Parar Áudio ({audioProgress}s / 9.0s)
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Ouvir Ritmo de 9s (Voz PT-BR)
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-amber-400 font-bold">{audioProgress.toFixed(1)}s</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">9.0s</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-100"
                style={{ width: `${(audioProgress / 9) * 100}%` }}
              ></div>
            </div>

            {/* Timeline Breakdown with Speaker Attribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {scene.dialogue.timingBreakdown.map((beat, bIdx) => (
                <div
                  key={bIdx}
                  className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 mb-1">
                      <span className="font-bold">[{beat.time}]</span>
                      <span className="text-slate-400 text-[9px] uppercase font-bold text-sky-300">
                        {beat.speaker || (bIdx === 0 ? "Abertura" : bIdx === 1 ? "Conflito" : "Punchline")}
                      </span>
                    </div>
                    <p className="text-slate-200 text-xs font-medium line-clamp-2 mb-1">"{beat.speech}"</p>
                  </div>
                  <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80 space-y-0.5">
                    <div><strong className="text-slate-300">Ação:</strong> {beat.action}</div>
                    {beat.silentListeners && (
                      <div className="text-[9px] text-purple-300/80 truncate">
                        🔇 {beat.silentListeners}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: ENGLISH VIDEO PROMPT (PARA COLAR NO KLING / RUNWAY / SORA) */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Prompt em Inglês (Cole no {targetAi.toUpperCase()})
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                8K • 35mm • Microtextura
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCopy(promptWithSpeech, "english_with_speech")}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-sm shadow-amber-500/10"
                title="Copiar Prompt em Inglês junto com a fala de 9 segundos embutida"
              >
                {copiedType === "english_with_speech" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Prompt + Fala Copiados!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Copiar Prompt com a Fala (9s)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleCopy(scene.englishPrompt, "english")}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                title="Copiar apenas o prompt em inglês sem a fala"
              >
                {copiedType === "english" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Apenas Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-300 leading-relaxed max-h-56 overflow-y-auto select-all">
            {scene.englishPrompt}
          </div>
        </div>

        {/* Section: CINEMATOGRAPHY & SHOT PROGRESSION (50+ YEARS EXPERIENCE) */}
        {scene.cinematography && (
          <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950 border border-cyan-500/30 rounded-xl p-4 space-y-3.5 shadow-lg">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Clapperboard className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                      Direção de Fotografia & Decupagem Cinematográfica
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      50+ Anos de Experiência
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Câmera handheld orgânica, closes estratégicos, movimentos motivados e zero deformação física ou facial
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const cineText = `[DIREÇÃO DE FOTOGRAFIA & DECUPAGEM DE TAKES (50+ ANOS DE EXPERIÊNCIA)]
Visão do Diretor: ${scene.cinematography?.directorVision}
Câmera: ${scene.cinematography?.cameraType}
Lentes: ${scene.cinematography?.lensChoice}
Iluminação & Atmosfera: ${scene.cinematography?.lightingAndAtmosphere}
Tom Emocional: ${scene.cinematography?.emotionalToneAlignment}

PROGRESSÃO DOS TAKES (9 SEGUNDOS):
${scene.cinematography?.shotProgression?.map((sp, i) => `• Take ${i + 1} [${sp.timecode}] - ${sp.shotType} | Movimento: ${sp.movement} | Foco: ${sp.focalPoint} | Lente: ${sp.lensAndAperture} | Intenção: ${sp.cinematicIntent}`).join("\n")}`;
                  handleCopy(cineText, "cinematography");
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all flex items-center gap-1.5"
              >
                {copiedType === "cinematography" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === "cinematography" ? "Copiado!" : "Copiar Decupagem de Câmera"}
              </button>
            </div>

            {/* Director's Vision Quote */}
            <div className="bg-slate-950/80 border border-cyan-900/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 mb-1">
                <Eye className="w-3.5 h-3.5" />
                Visão do Diretor de Fotografia
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "{scene.cinematography.directorVision}"
              </p>
            </div>

            {/* 3 Shot Progression Cards (0-3s, 3-6s, 6-9s) */}
            {scene.cinematography.shotProgression && scene.cinematography.shotProgression.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Film className="w-3.5 h-3.5" />
                    Decupagem de 2 a 3 Enquadramentos Complementares (Cena de 9 Segundos)
                  </span>
                  <span className="text-[10px] text-slate-400">Eixo 180° e Continuidade Rítmica</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {scene.cinematography.shotProgression.map((shot, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-lg p-2.5 space-y-1.5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {shot.timecode}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Take {sIdx + 1}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white">
                        {shot.shotType}
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-400">
                        <div>
                          <span className="text-slate-400 font-medium">Movimento: </span>
                          <span className="text-slate-300">{shot.movement}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Foco Principal: </span>
                          <span className="text-cyan-200">{shot.focalPoint}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Lente & Abertura: </span>
                          <span className="text-slate-300 font-mono text-[10px]">{shot.lensAndAperture}</span>
                        </div>
                        <div className="pt-1 border-t border-slate-800 text-[10px] text-amber-300/90 italic">
                          "{shot.cinematicIntent}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Specs Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
              <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-medium">Câmera & Rig:</span>
                <span className="text-slate-300 font-medium">{scene.cinematography.cameraType}</span>
              </div>
              <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-medium">Lentes & Profundidade:</span>
                <span className="text-slate-300 font-medium">{scene.cinematography.lensChoice}</span>
              </div>
              <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-medium">Iluminação & Atmosfera:</span>
                <span className="text-slate-300 font-medium">{scene.cinematography.lightingAndAtmosphere}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section: CONTINUIDADE NARRATIVA & CONEXÃO ENTRE TAKES (MATCH-ACTION 1:1) */}
        {scene.continuityBridge && (
          <div className="bg-gradient-to-br from-violet-950/40 via-slate-900/90 to-slate-950 border border-violet-500/35 rounded-xl p-4 space-y-3.5 shadow-lg">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  <GitCommit className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-violet-200 uppercase tracking-wide">
                      Continuidade Narrativa & Conexão de Frames (Match-Action 1:1)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                      Diretor de Continuidade
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    O Prompt {scene.sceneNumber} começa exatamente onde o anterior terminou • Sem salto temporal, sem teletransporte
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const contText = `[CONTINUIDADE NARRATIVA & CONEXÃO ENTRE PROMPTS - TAKE #${scene.sceneNumber}]
Regra Máxima: Todos os prompts formam uma única história contínua.
• Primeiro Frame [00:00]: ${scene.continuityBridge?.incomingMoment}
• Último Frame [00:09]: ${scene.continuityBridge?.outgoingMoment}
• Conexão com Próximo Take: ${scene.continuityBridge?.nextSceneHandoff}
• Tipo de Corte: ${scene.continuityBridge?.matchCutType}
• Coerência Espacial (Eixo 180°): ${scene.continuityBridge?.characterSpatialPositions}
• Continuidade Emocional: ${scene.continuityBridge?.emotionalContinuity}`;
                  handleCopy(contText, "continuity_bridge");
                }}
                className="px-2.5 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border border-violet-500/30 text-xs font-medium transition-all flex items-center gap-1.5"
              >
                {copiedType === "continuity_bridge" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === "continuity_bridge" ? "Copiado!" : "Copiar Decupagem de Continuidade"}
              </button>
            </div>

            {/* Match-Cut & Spatial Coherence Ribbon */}
            <div className="bg-slate-950/80 border border-violet-900/40 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-300">
                  <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                  <span>Tipo de Transição / Corte:</span>
                  <span className="font-mono text-white bg-violet-950 px-2 py-0.5 rounded border border-violet-800 text-[10px]">
                    {scene.continuityBridge.matchCutType}
                  </span>
                </div>
                <div className="text-[10px] text-amber-300 font-medium">
                  {isFinalScene ? "Desfecho Conclusivo" : `Sequência Contínua [Take ${scene.sceneNumber} ➔ Take ${scene.sceneNumber + 1}]`}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800">
                <div>
                  <strong className="text-violet-300 text-[11px]">Coerência Espacial & Eixo 180°: </strong>
                  <span className="text-slate-300 text-[11px] leading-relaxed">{scene.continuityBridge.characterSpatialPositions}</span>
                </div>
                <div>
                  <strong className="text-violet-300 text-[11px]">Continuidade Emocional: </strong>
                  <span className="text-slate-300 text-[11px] leading-relaxed">{scene.continuityBridge.emotionalContinuity}</span>
                </div>
              </div>
            </div>

            {/* Frame-to-Frame Handoff Cards (Incoming 00:00 vs Outgoing 00:09) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Incoming Frame */}
              <div className="bg-slate-950/85 border border-slate-800 hover:border-violet-500/40 rounded-lg p-3 space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <Play className="w-3.5 h-3.5 fill-emerald-400/20" />
                    Primeiro Frame [00:00]
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    {scene.sceneNumber === 1 ? "Abertura da História" : `Início no Final do Take #${scene.sceneNumber - 1}`}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {scene.continuityBridge.incomingMoment}
                </p>
              </div>

              {/* Outgoing Frame */}
              <div className="bg-slate-950/85 border border-slate-800 hover:border-violet-500/40 rounded-lg p-3 space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                    {isFinalScene ? <Flag className="w-3.5 h-3.5 fill-emerald-400/20 text-emerald-400" /> : <ArrowRight className="w-3.5 h-3.5 text-amber-400" />}
                    Último Frame [00:09]
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                    {isFinalScene ? "Desfecho Final" : `Prepara o Take #${scene.sceneNumber + 1}`}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {scene.continuityBridge.outgoingMoment}
                </p>
                <div className="pt-1 border-t border-slate-800 text-[10px] text-violet-300/90 italic">
                  {scene.continuityBridge.nextSceneHandoff}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: REGRA SUPREMA — MEMÓRIA NARRATIVA TRAVADA DO TAKE */}
        {scene.narrativeMemory && (
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/90 to-indigo-950/40 border border-blue-500/35 rounded-xl p-4 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-wide">
                      Regra Suprema: Memória Narrativa Contínua
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold">
                      Take #{scene.sceneNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Garantia de que este prompt não se desvia da história original, preservando fatos e estado dos personagens.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/80 space-y-1.5">
                <div className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Fatos Estabelecidos & Conhecimento:
                </div>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  {scene.narrativeMemory.establishedFacts.map((fact, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-1.5">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{fact}</span>
                    </div>
                  ))}
                  <div className="text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
                    <strong className="text-slate-300">Conhecimento atual:</strong> {scene.narrativeMemory.charactersKnowledge}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/80 space-y-1.5">
                <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  Ação Concluída & Próximo Passo Lógico:
                </div>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  {scene.narrativeMemory.completedActions.map((act, aIdx) => (
                    <div key={aIdx} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-bold">✓</span>
                      <span>{act}</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-slate-800">
                    <span className="text-amber-300 font-semibold">Próximo passo: </span>
                    <span className="text-slate-200">{scene.narrativeMemory.logicalNextStep}</span>
                  </div>
                  {scene.narrativeMemory.pendingEvents && scene.narrativeMemory.pendingEvents.length > 0 && (
                    <div className="text-[10px] text-slate-400 italic">
                      Pendente p/ desfecho: {scene.narrativeMemory.pendingEvents.join("; ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: DIREÇÃO DE ATORES & BIOMECÂNICA HUMANA ULTRARREALISTA (50+ ANOS DE EXPERIÊNCIA) */}
        {scene.actorDirection && (
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/35 rounded-xl p-4 space-y-3.5 shadow-lg">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-200 uppercase tracking-wide">
                      Direção de Atores & Biomecânica Humana Ultrarrealista
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      50+ Anos de Experiência
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Linguagem corporal naturalista, 5 dedos perfeitos articulados, inércia gravitacional e microexpressões espontâneas
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const actorText = `[DIREÇÃO DE ATORES & BIOMECÂNICA HUMANA ULTRARREALISTA (50+ ANOS DE EXPERIÊNCIA) - TAKE #${scene.sceneNumber}]
• Visão do Diretor de Atores: ${scene.actorDirection?.directorVision}
• Micro Movimentos Humanos: ${scene.actorDirection?.microMovements}
• Biomecânica das Mãos (5 Dedos Perfeitos): ${scene.actorDirection?.handsAndGrip}
• Física Corporal & Transferência de Peso: ${scene.actorDirection?.biomechanicsAndWeight}
• Cadeia Temporal de Reação (9s): ${scene.actorDirection?.reactionSequence}
• Atuação na Fala & Sincronia Labial: ${scene.actorDirection?.dialogueDeliveryAndLips}
• Interação Física com o Cenário: ${scene.actorDirection?.spatialInteraction}
• Salvaguardas Anti-Deformação de IA: ${scene.actorDirection?.antiDeformationRules}`;
                  handleCopy(actorText, "actor_direction");
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-medium transition-all flex items-center gap-1.5"
              >
                {copiedType === "actor_direction" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === "actor_direction" ? "Copiado!" : "Copiar Direção de Atores"}
              </button>
            </div>

            {/* Director's Acting Vision Quote */}
            <div className="bg-slate-950/80 border border-emerald-900/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-1">
                <UserCheck className="w-3.5 h-3.5" />
                Conceito de Atuação & Naturalismo Humano
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "{scene.actorDirection.directorVision}"
              </p>
            </div>

            {/* Reaction Sequence Timeline (9s Breakdown) */}
            {scene.actorDirection.reactionSequence && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Cadeia Temporal de Reação e Movimento (0 a 9 segundos)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-mono text-[11px]">
                  {scene.actorDirection.reactionSequence}
                </p>
              </div>
            )}

            {/* Grid with 4 Key Pillars of Biomechanics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Hands & Grip */}
              <div className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 rounded-lg p-2.5 space-y-1 transition-all">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <Hand className="w-3.5 h-3.5 text-emerald-400" />
                  Biomecânica das Mãos (5 Dedos Perfeitos)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {scene.actorDirection.handsAndGrip}
                </p>
              </div>

              {/* Micro Movements */}
              <div className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 rounded-lg p-2.5 space-y-1 transition-all">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Micro Movimentos Espontâneos
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {scene.actorDirection.microMovements}
                </p>
              </div>

              {/* Weight & Body Physics */}
              <div className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 rounded-lg p-2.5 space-y-1 transition-all">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Física Corporal, Inércia & Passos
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {scene.actorDirection.biomechanicsAndWeight}
                </p>
              </div>

              {/* Anti-Deformation Safeguards */}
              <div className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 rounded-lg p-2.5 space-y-1 transition-all">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Salvaguardas Anti-Deformação de IA
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {scene.actorDirection.antiDeformationRules}
                </p>
              </div>
            </div>

            {/* Dialogue & Spatial Interaction footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
              <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-medium">Sincronia Labial & Diálogo:</span>
                <span className="text-slate-300 font-medium">{scene.actorDirection.dialogueDeliveryAndLips}</span>
              </div>
              <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-medium">Interação com Superfícies:</span>
                <span className="text-slate-300 font-medium">{scene.actorDirection.spatialInteraction}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: TECHNICAL BREAKDOWNS (Camera, Skin/Sweat, Environment, Negative) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Camera Direction */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              Direção de Câmera & Lente
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{scene.cameraDirection}</p>
          </div>

          {/* Skin & Lighting */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Textura de Pele & Suor
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{scene.skinAndLighting}</p>
          </div>

          {/* Environment Details */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Cenário & Adereços Específicos
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{scene.environmentDetails}</p>
          </div>

          {/* Negative Prompt */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Negative Prompt (Anti-CGI)
              </div>
              <button
                onClick={() => handleCopy(scene.negativePrompt, "negative")}
                className="text-[10px] text-slate-400 hover:text-slate-300 flex items-center gap-1"
              >
                {copiedType === "negative" ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                {copiedType === "negative" ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="text-[11px] font-mono text-slate-400 leading-relaxed select-all">
              {scene.negativePrompt}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
