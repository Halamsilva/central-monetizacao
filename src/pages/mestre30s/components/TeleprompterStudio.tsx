import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Camera,
  Music,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Trash2,
  RefreshCw,
  Layers,
  MonitorPlay,
  AlertTriangle,
  Lock,
  Utensils,
  Leaf,
  Scale,
  CheckCircle2,
  Thermometer,
  Clock,
  Flame,
} from 'lucide-react';
import { MasterRecipe, VideoPromptTake } from '../data/recipes';
import { soundFx } from '../utils/audio';

interface TeleprompterStudioProps {
  recipe: MasterRecipe;
  onSelectAnotherRecipe?: () => void;
  onOpenGenerator?: () => void;
}

export const TeleprompterStudio: React.FC<TeleprompterStudioProps> = ({
  recipe,
  onSelectAnotherRecipe,
  onOpenGenerator,
}) => {
  // Local mutable prompts list for current recipe
  const [prompts, setPrompts] = useState<VideoPromptTake[]>(recipe.prompts);
  const [activeTakeIndex, setActiveTakeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [continuousMode, setContinuousMode] = useState<boolean>(false);
  const [isSpeakingTts, setIsSpeakingTts] = useState<boolean>(false);
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'teleprompter' | 'all-blocks' | 'recipe-guide'>('teleprompter');
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Sync prompts when recipe changes
  useEffect(() => {
    setPrompts(recipe.prompts);
    setActiveTakeIndex(0);
    resetTimer();
    setShowDeleteConfirm(false);
    setCheckedIngredients({});
  }, [recipe.id]);

  // Adjust active take index if bounds changed
  useEffect(() => {
    if (prompts.length === 0) {
      setActiveTakeIndex(0);
    } else if (activeTakeIndex >= prompts.length) {
      setActiveTakeIndex(prompts.length - 1);
    }
  }, [prompts.length, activeTakeIndex]);

  const currentTake: VideoPromptTake | undefined = prompts[activeTakeIndex];

  // Words in the current spoken line
  const words = currentTake?.spokenLine ? currentTake.spokenLine.split(' ') : [];
  const wordCount = words.length;

  // Active word index calculation based on 9 seconds duration
  const activeWordIndex = Math.min(
    words.length > 0 ? words.length - 1 : 0,
    Math.floor((secondsElapsed / 9.0) * (words.length || 1))
  );

  // Stop TTS speech when component unmounts or take changes
  const stopTts = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingTts(false);
  };

  const handleTakeChange = (index: number) => {
    stopTts();
    pauseTimer();
    setSecondsElapsed(0);
    setActiveTakeIndex(index);
    soundFx.playTransition();
  };

  const startTimer = () => {
    if (!currentTake) return;
    stopTts();
    soundFx.playTick();
    setIsPlaying(true);
    startTimeRef.current = Date.now() - secondsElapsed * 1000;

    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      if (elapsed >= 9.0) {
        soundFx.playChime();
        if (continuousMode && activeTakeIndex < prompts.length - 1) {
          // Advance to next take
          setActiveTakeIndex((prev) => prev + 1);
          setSecondsElapsed(0);
          startTimeRef.current = Date.now();
        } else {
          setSecondsElapsed(9.0);
          setIsPlaying(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } else {
        setSecondsElapsed(elapsed);
      }
    }, 50);
  };

  const pauseTimer = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    pauseTimer();
    stopTts();
    setSecondsElapsed(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopTts();
    };
  }, []);

  // Text to Speech playback in Brazilian Portuguese
  const playTts = () => {
    if (!currentTake) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Síntese de voz não suportada neste navegador.');
      return;
    }

    stopTts();

    const utterance = new SpeechSynthesisUtterance(currentTake.spokenLine);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05; // Slightly brisk for crisp 9s delivery
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(
      (v) => v.lang.startsWith('pt-BR') || v.lang.startsWith('pt')
    );
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      setIsSpeakingTts(true);
      resetTimer();
      startTimer();
    };

    utterance.onend = () => {
      setIsSpeakingTts(false);
    };

    utterance.onerror = () => {
      setIsSpeakingTts(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(type);
    setTimeout(() => setCopiedState(null), 2200);
  };

  const toggleIngredientCheck = (name: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Format a single prompt block with all its details, spoken lines and fixed scene/objects
  const formatPromptBlock = (p: VideoPromptTake): string => {
    const wCount = p.spokenLine.split(' ').length;
    return `🎬 BLOCO DE PROMPT ${p.takeNumber} (${p.timeRange}) - ${p.actName}
Receita: ${recipe.title} (${recipe.country})
Rendimento: ${recipe.servings} | Tempo Total de Preparo: ${recipe.totalTimeDisplay}

🏛️ CENÁRIO & ILUMINAÇÃO (CONSTANTE - NÃO MUDA):
${p.fixedSceneContext}

🍳 OBJETOS, UTENSÍLIOS & PANELAS (CONSTANTES - NÃO MUDAM):
${p.fixedObjectsProps}

🎙️ FALA CRONOMETRADA (9 SEGUNDOS):
"${p.spokenLine}"

🎥 DIREÇÃO VISUAL & AÇÃO DO TAKE:
${p.videoShotPrompt}

🔊 EFEITO SONORO (FOLEY):
${p.soundFxCue}

⏱️ RITMO & CALIBRAÇÃO:
Duração: 9.0 segundos | Total: ${wCount} palavras (~${(wCount / 9).toFixed(1)} palavras/seg)`;
  };

  // Copy individual prompt block with all lines included
  const copySinglePromptBlock = (p: VideoPromptTake) => {
    const blockText = formatPromptBlock(p);
    handleCopy(blockText, `block-${p.takeNumber}`);
  };

  // Copy all prompt blocks together with ingredients and prep info
  const copyFullSequence = () => {
    if (prompts.length === 0) return;

    const ingredientsList = recipe.freshIngredients
      .map((ing) => `• ${ing.name}: ${ing.quantity} (Preparo: ${ing.prepTime}) - ${ing.techniqueTip}`)
      .join('\n');

    const stepsList = recipe.steps
      .map((st) => `${st.stepNumber}. [${st.phase} - ${st.timeEstimate}] ${st.action}: ${st.description} (${st.temperatureOrFire})`)
      .join('\n');

    const fullText = `🎬 ROTEIRO COMPLETO (4x9s) - MESTRE DOS 100 ANOS
Receita: ${recipe.title} (${recipe.country})
Rendimento: ${recipe.servings} | Tempo de Preparo: ${recipe.totalTimeDisplay}
Tempo Total de Vídeo: ${prompts.length * 9} segundos (${prompts.length} takes de 9s)

📋 INGREDIENTES, QUANTIDADES & TEMPOS DE PREPARO:
${ingredientsList}

🔥 PASSO A PASSO TÉCNICO DO PREPARO:
${stepsList}

🔒 CONSISTÊNCIA VISUAL OBRIGATÓRIA (CENÁRIO & OBJETOS IMUTÁVEIS):
🏛️ CENÁRIO FIXO: ${recipe.fixedSceneGlobal || prompts[0]?.fixedSceneContext}
🍳 OBJETOS E UTENSÍLIOS FIXOS: ${recipe.fixedObjectsGlobal || prompts[0]?.fixedObjectsProps}

${prompts
  .map(
    (p) => `========================================
${formatPromptBlock(p)}
`
  )
  .join('\n')}
========================================
🌟 SEGREDO DO MESTRE:
${recipe.masterSecret}
`;
    handleCopy(fullText, 'full');
  };

  // Copy only technical recipe sheet
  const copyTechnicalSheet = () => {
    const ingredientsList = recipe.freshIngredients
      .map((ing) => `• ${ing.name}: ${ing.quantity} (Preparo: ${ing.prepTime}) - ${ing.techniqueTip}`)
      .join('\n');

    const pantryList = recipe.pantryItems && recipe.pantryItems.length > 0
      ? recipe.pantryItems.map((p) => `• ${p.item}: ${p.quantity}`).join('\n')
      : 'Nenhum adicional';

    const stepsList = recipe.steps
      .map((st) => `${st.stepNumber}. [${st.phase} - ${st.timeEstimate}] ${st.action}: ${st.description} (${st.temperatureOrFire})`)
      .join('\n');

    const text = `📋 FICHA TÉCNICA DO MESTRE - INGREDIENTES & PREPARO
Prato: ${recipe.title} (${recipe.flag} ${recipe.country})
Rendimento: ${recipe.servings}
Preparo dos Ingredientes: ${recipe.prepTimeMinutes} min | Cocção/Ponto: ${recipe.cookTimeMinutes > 0 ? `${recipe.cookTimeMinutes} min` : 'Frio / sem fogo'} | Tempo Total: ${recipe.totalTimeDisplay}

🥗 INGREDIENTES FRESCOS & PESOS:
${ingredientsList}

🧂 DESPENSA & TEMPEROS:
${pantryList}

🍳 ETAPAS DE PREPARO NA COZINHA:
${stepsList}

💡 SEGREDO DE 100 ANOS:
${recipe.masterSecret}
`;
    handleCopy(text, 'tech-sheet');
  };

  // Delete all prompts
  const handleDeleteAllPrompts = () => {
    stopTts();
    resetTimer();
    setPrompts([]);
    setShowDeleteConfirm(false);
    soundFx.playTransition();
  };

  // Delete a specific prompt
  const handleDeleteSinglePrompt = (index: number) => {
    stopTts();
    resetTimer();
    setPrompts((prev) => prev.filter((_, i) => i !== index));
    soundFx.playTransition();
  };

  // Restore master recipe default prompts
  const handleRestorePrompts = () => {
    stopTts();
    resetTimer();
    setPrompts(recipe.prompts);
    setActiveTakeIndex(0);
    soundFx.playChime();
  };

  return (
    <section id="studio" className="py-12 bg-stone-950 text-stone-100 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 pb-6 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wide uppercase mb-1">
              <span>Estúdio & Teleprompter</span>
              <span aria-hidden="true">·</span>
              <span>Sequência de 4 Falas de 9s</span>
              <span aria-hidden="true">·</span>
              <span>Ingredientes & Pesos Medidos</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              Roteiro & Direção: {recipe.title}
            </h2>
            <p className="text-sm text-stone-400 mt-1 max-w-2xl">
              {recipe.flag} {recipe.country} · {recipe.subtitle}
            </p>
          </div>

          {/* Action Bar with View Modes, Copy All and Delete All Prompts */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: 3 Modes */}
            <div className="flex items-center p-1 bg-stone-900 border border-stone-800 rounded-lg">
              <button
                onClick={() => setViewMode('teleprompter')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'teleprompter'
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <MonitorPlay className="w-3.5 h-3.5" />
                <span>Teleprompter</span>
              </button>
              <button
                onClick={() => setViewMode('all-blocks')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'all-blocks'
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>4 Blocos de Prompt</span>
              </button>
              <button
                onClick={() => setViewMode('recipe-guide')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'recipe-guide'
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Ingredientes & Preparo</span>
              </button>
            </div>

            {/* Copy Full Sequence Button */}
            {prompts.length > 0 && (
              <button
                onClick={copyFullSequence}
                className="px-3.5 py-2 text-xs font-medium bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                {copiedState === 'full' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Tudo Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    <span>Copiar Todos os 4 Prompts</span>
                  </>
                )}
              </button>
            )}

            {/* Delete All Prompts Button with Confirmation Modal/Popover */}
            {prompts.length > 0 ? (
              !showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 text-xs font-medium bg-stone-900/90 hover:bg-red-950/60 border border-stone-800 hover:border-red-800/80 text-stone-400 hover:text-red-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  title="Apagar todos os prompts da receita atual"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Apagar Todos os Prompts</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-red-950/40 p-1 rounded-lg border border-red-800/80 animate-in fade-in duration-150">
                  <span className="text-[11px] text-red-200 px-2 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>Confirmar exclusão?</span>
                  </span>
                  <button
                    onClick={handleDeleteAllPrompts}
                    className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                  >
                    Sim, Apagar
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 text-xs text-stone-400 hover:text-stone-200 rounded transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={handleRestorePrompts}
                className="px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar Prompts Originais</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State when all prompts have been deleted */}
        {prompts.length === 0 ? (
          <div className="bg-stone-900/60 rounded-2xl border border-stone-800/80 p-10 sm:p-14 text-center max-w-2xl mx-auto my-6">
            <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-4 text-stone-400">
              <Trash2 className="w-6 h-6 text-stone-400" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-200 mb-2">
              Todos os Prompts Foram Apagados
            </h3>
            <p className="text-sm text-stone-400 mb-6 leading-relaxed">
              Você limpou os blocos de prompts desta receita. Você pode restaurar os prompts recomendados pelo Mestre Centenário ou gerar novos com inteligência artificial.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleRestorePrompts}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-stone-900" />
                <span>Restaurar Prompts do Mestre</span>
              </button>
              {onOpenGenerator && (
                <button
                  onClick={onOpenGenerator}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Gerar Novos com IA</span>
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'recipe-guide' ? (
          /* View Mode 3: INGREDIENTES & PREPARO TÉCNICO */
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-900/80 rounded-2xl border border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 font-medium">Preparo dos Ingredientes</div>
                  <div className="text-sm sm:text-base font-bold text-stone-100 font-mono">
                    {recipe.prepTimeMinutes} min
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 font-medium">Tempo de Fogo / Ponto</div>
                  <div className="text-sm sm:text-base font-bold text-stone-100 font-mono">
                    {recipe.cookTimeMinutes > 0 ? `${recipe.cookTimeMinutes} min` : 'Frio (sem fogo)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 font-medium">Tempo Total do Prato</div>
                  <div className="text-sm sm:text-base font-bold text-amber-300 font-mono">
                    {recipe.totalTimeDisplay}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 font-medium">Rendimento</div>
                  <div className="text-sm sm:text-base font-bold text-stone-100">
                    {recipe.servings}
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Layout: Ingredients & Quantities (Left) | Step-by-Step Cooking (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Ingredients, Weights & Individual Prep Times (5 cols) */}
              <div className="lg:col-span-5 bg-stone-900/80 rounded-2xl border border-stone-800 p-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-800">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <Leaf className="w-4 h-4" />
                    <span>Ingredientes Frescos & Pesos</span>
                  </div>
                  <button
                    onClick={copyTechnicalSheet}
                    className="text-xs text-stone-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    {copiedState === 'tech-sheet' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Ficha</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                  O mestre exige precisão na balança: cada grama e espessura de corte afetam o tempo exato de cocção.
                </p>

                <div className="space-y-3">
                  {recipe.freshIngredients.map((item, idx) => {
                    const isChecked = !!checkedIngredients[item.name];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleIngredientCheck(item.name)}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                          isChecked
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-stone-400'
                            : 'bg-stone-950/70 border-stone-800/90 text-stone-200 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-start gap-2.5">
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
                                isChecked ? 'text-emerald-500' : 'text-stone-500'
                              }`}
                            />
                            <div>
                              <div className={`text-xs sm:text-sm font-semibold ${isChecked ? 'line-through text-stone-400' : 'text-stone-100'}`}>
                                {item.name}
                              </div>
                              <div className="text-xs font-mono text-amber-300 font-medium mt-0.5">
                                {item.quantity}
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800 shrink-0">
                            ⏱️ {item.prepTime}
                          </span>
                        </div>

                        {item.techniqueTip && (
                          <div className="text-[11px] text-stone-400 mt-2 pt-2 border-t border-stone-800/60 leading-normal italic">
                            💡 {item.techniqueTip}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pantry Items */}
                {recipe.pantryItems && recipe.pantryItems.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-stone-800">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2.5">
                      Despensa & Condimentos Medidos:
                    </div>
                    <div className="space-y-1.5">
                      {recipe.pantryItems.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs p-2 bg-stone-950/60 rounded-lg border border-stone-800/80"
                        >
                          <span className="text-stone-300">{p.item}</span>
                          <span className="font-mono text-amber-300 font-medium">{p.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Step-by-Step Cooking & Fire Points (7 cols) */}
              <div className="lg:col-span-7 bg-stone-900/80 rounded-2xl border border-stone-800 p-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-800">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                    <Utensils className="w-4 h-4" />
                    <span>Passo a Passo Técnico na Cozinha</span>
                  </div>
                  <span className="text-xs font-mono text-stone-400">
                    {recipe.steps.length} etapas detalhadas
                  </span>
                </div>

                <div className="space-y-4">
                  {recipe.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-stone-950/70 rounded-xl border border-stone-800/90 relative"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                        <span className="text-amber-400 font-semibold">{step.phase}</span>
                        <span className="text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                          ⏱️ {step.timeEstimate}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-stone-100 mb-1 flex items-center gap-1.5">
                        <span className="text-amber-400">0{step.stepNumber}.</span>
                        <span>{step.action}</span>
                      </h4>

                      <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-2.5">
                        {step.description}
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-mono bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                        <Thermometer className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{step.temperatureOrFire}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Master Tip Box */}
                <div className="mt-5 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>O Segredo dos 100 Anos:</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed italic">
                    "{recipe.masterSecret}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'all-blocks' ? (
          /* View Mode 2: ALL PROMPTS TOGETHER IN A GRID WITH INDIVIDUAL COPY BUTTONS */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-100">
                  Visão Completa dos 4 Blocos de Prompt
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Cada bloco possui botão próprio para cópia integral com falas, direção e consistência de cenário/objetos.
                </p>
              </div>

              <div className="text-xs text-amber-400 font-mono">
                {prompts.length} takes calibrados (9s cada)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prompts.map((prompt, idx) => {
                const isBlockCopied = copiedState === `block-${prompt.takeNumber}`;
                return (
                  <div
                    key={prompt.takeNumber}
                    className="bg-stone-900/80 rounded-2xl border border-stone-800 p-6 flex flex-col justify-between hover:border-stone-700 transition-colors shadow-sm"
                  >
                    <div>
                      {/* Block Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center font-mono">
                            {prompt.takeNumber}
                          </span>
                          <span className="text-xs text-stone-400 font-mono">
                            ({prompt.timeRange})
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-stone-300">
                          {prompt.actName}
                        </span>
                      </div>

                      {/* Spoken 9s Script Block */}
                      <div className="mb-4">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300/90 font-semibold block mb-1">
                          🎙️ Fala Cronometrada (9 segundos):
                        </span>
                        <div className="p-3.5 bg-stone-950/80 rounded-xl border border-stone-800/90">
                          <p className="text-sm font-serif text-stone-100 leading-relaxed italic">
                            "{prompt.spokenLine}"
                          </p>
                        </div>
                      </div>

                      {/* Video Direction & Camera Framing */}
                      <div className="mb-4">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                          🎥 Direção Visual / Prompt IA:
                        </span>
                        <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/40 p-3 rounded-lg border border-stone-800/60 font-sans">
                          {prompt.videoShotPrompt}
                        </p>
                      </div>

                      {/* Fixed Scene and Fixed Objects Consistency Box */}
                      <div className="mb-4 p-3 bg-stone-950/70 rounded-xl border border-stone-800/80 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-amber-400">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Consistência Visual Fixa (Não Muda Entre os Takes):</span>
                        </div>
                        <div className="text-xs text-stone-300 leading-relaxed">
                          <span className="text-stone-400 font-medium">🏛️ Cenário & Luz: </span>
                          <span>{prompt.fixedSceneContext}</span>
                        </div>
                        <div className="text-xs text-stone-300 leading-relaxed">
                          <span className="text-stone-400 font-medium">🍳 Panelas & Utensílios: </span>
                          <span>{prompt.fixedObjectsProps}</span>
                        </div>
                      </div>

                      {/* Audio Foley Cue */}
                      <div className="flex items-start gap-2 text-xs text-stone-400 mb-4 bg-stone-950/30 p-2.5 rounded-lg border border-stone-800/50">
                        <Music className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-amber-300">Áudio: </span>
                          <span>{prompt.soundFxCue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Block Action Buttons: Dedicated Copy Button per block & Delete Prompt button */}
                    <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-stone-400 font-mono">
                        {prompt.spokenLine.split(' ').length} palavras · 9.0s
                      </div>

                      <div className="flex items-center gap-2">
                        {/* THE DEDICATED BUTTON TO COPY THIS ENTIRE PROMPT BLOCK WITH SPOKEN LINES */}
                        <button
                          onClick={() => copySinglePromptBlock(prompt)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm ${
                            isBlockCopied
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                              : 'bg-amber-400 hover:bg-amber-300 border-amber-400 text-stone-950 active:scale-95'
                          }`}
                          title="Copiar todo este bloco de prompt incluindo falas, vídeo e som"
                        >
                          {isBlockCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Bloco Completo Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Bloco com Falas</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteSinglePrompt(idx)}
                          className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Apagar este prompt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* View Mode 1: TELEPROMPTER & INTERACTIVE REEL MONITOR */
          <div>
            {/* Take Navigation Bar with Per-Take Copy Indicator */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
              {prompts.map((prompt, idx) => {
                const isActive = activeTakeIndex === idx;
                const isBlockCopied = copiedState === `block-${prompt.takeNumber}`;
                return (
                  <button
                    key={prompt.takeNumber}
                    onClick={() => handleTakeChange(idx)}
                    className={`p-3 sm:p-4 rounded-xl text-left border transition-all relative ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/70 text-amber-100 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-900 hover:text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1 font-mono">
                      <span className="font-bold text-amber-400">Take {prompt.takeNumber}</span>
                      <span>{prompt.timeRange}</span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold truncate text-stone-200">
                      {prompt.actName}
                    </div>

                    {isBlockCopied && (
                      <span className="absolute top-2 right-2 text-[10px] text-emerald-400 font-mono flex items-center gap-0.5 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                        <Check className="w-2.5 h-2.5" /> Copiado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Take Studio Experience */}
            {currentTake && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: 9-Second Live Teleprompter (7 cols) */}
                <div className="lg:col-span-7 bg-stone-900/90 rounded-2xl border border-stone-800 p-6 sm:p-8 flex flex-col justify-between min-h-[460px] relative overflow-hidden shadow-xl">
                  {/* Progress bar across top of teleprompter */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-stone-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-75"
                      style={{ width: `${(secondsElapsed / 9.0) * 100}%` }}
                    />
                  </div>

                  <div>
                    {/* Header line of Teleprompter with Take info & Copy Block button */}
                    <div className="flex items-center justify-between gap-2 pb-4 mb-6 border-b border-stone-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-400 text-stone-950">
                          Take {currentTake.takeNumber}/4
                        </span>
                        <span className="text-stone-300 font-semibold">{currentTake.actName}</span>
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        {/* THE DEDICATED BUTTON TO COPY THIS PROMPT BLOCK IN TELEPROMPTER VIEW */}
                        <button
                          onClick={() => copySinglePromptBlock(currentTake)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1 ${
                            copiedState === `block-${currentTake.takeNumber}`
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                              : 'bg-amber-400 hover:bg-amber-300 border-amber-400 text-stone-950 active:scale-95'
                          }`}
                          title="Copiar todo este bloco com falas inclusas"
                        >
                          {copiedState === `block-${currentTake.takeNumber}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Bloco com Falas</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Word-by-word Highlighted Speech Display */}
                    <div className="my-6">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-serif font-medium leading-relaxed tracking-wide text-stone-300">
                        {words.map((word, idx) => {
                          const isCurrent = isPlaying && idx === activeWordIndex;
                          const isSpoken = isPlaying && idx < activeWordIndex;
                          return (
                            <span
                              key={idx}
                              className={`transition-colors duration-150 inline-block mr-2 mb-1 ${
                                isCurrent
                                  ? 'text-amber-300 font-bold underline decoration-amber-400 underline-offset-8 scale-105 transition-transform'
                                  : isSpoken
                                  ? 'text-stone-500'
                                  : 'text-stone-100'
                              }`}
                            >
                              {word}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Teleprompter Controls Bar */}
                  <div className="pt-6 border-t border-stone-800">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Timer Display */}
                      <div className="flex items-center gap-3">
                        <div className="text-3xl sm:text-4xl font-mono font-bold text-amber-400 tabular-nums">
                          {secondsElapsed.toFixed(1)}s
                        </div>
                        <div className="text-xs text-stone-400 font-mono">
                          / 9.0s ({wordCount} palavras)
                        </div>
                      </div>

                      {/* Primary Play/Pause/Reset Controls */}
                      <div className="flex items-center gap-2">
                        {isPlaying ? (
                          <button
                            onClick={pauseTimer}
                            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-md"
                          >
                            <Pause className="w-4 h-4 fill-current" />
                            <span>Pausar</span>
                          </button>
                        ) : (
                          <button
                            onClick={startTimer}
                            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-md"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Treinar Fala (9s)</span>
                          </button>
                        )}

                        <button
                          onClick={resetTimer}
                          className="p-2.5 text-stone-400 hover:text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors"
                          title="Reiniciar cronômetro do take"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={playTts}
                          className={`p-2.5 rounded-xl border transition-colors ${
                            isSpeakingTts
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                              : 'text-stone-400 hover:text-stone-200 bg-stone-800 border-stone-700 hover:bg-stone-700'
                          }`}
                          title="Ouvir fala simulada em português (pt-BR)"
                        >
                          {isSpeakingTts ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Take Steppers */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTakeChange(Math.max(0, activeTakeIndex - 1))}
                          disabled={activeTakeIndex === 0}
                          className="p-2 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:hover:text-stone-400 bg-stone-850 rounded-lg transition-colors"
                          title="Take anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTakeChange(Math.min(prompts.length - 1, activeTakeIndex + 1))}
                          disabled={activeTakeIndex >= prompts.length - 1}
                          className="p-2 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:hover:text-stone-400 bg-stone-850 rounded-lg transition-colors"
                          title="Próximo take"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Video Shot Direction & Audio Cue Guide (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Visual Direction Card */}
                  <div className="bg-stone-900/80 rounded-2xl border border-stone-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wide">
                        <Camera className="w-4 h-4" />
                        <span>Direção Visual do Take ({currentTake.timeRange})</span>
                      </div>

                      {/* COPY THIS BLOCK BUTTON */}
                      <button
                        onClick={() => copySinglePromptBlock(currentTake)}
                        className="text-xs text-stone-300 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                      >
                        {copiedState === `block-${currentTake.takeNumber}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Bloco Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Bloco Todo</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-sm text-stone-200 leading-relaxed font-sans bg-stone-950/60 p-4 rounded-xl border border-stone-800/80 mb-4">
                      {currentTake.videoShotPrompt}
                    </p>

                    {/* Sound Effect Cue */}
                    <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs mb-4">
                      <Music className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-300 block mb-0.5">
                          Áudio & Efeito Sonoro (Foley):
                        </span>
                        <span className="text-stone-300">{currentTake.soundFxCue}</span>
                      </div>
                    </div>

                    {/* Fixed Scene and Objects Continuity Anchor (Consistent across all takes) */}
                    <div className="p-3.5 bg-stone-950/70 rounded-xl border border-stone-800/80 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-amber-400">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Âncoras Imutáveis (Não Mudam Entre os Takes):</span>
                      </div>
                      <div className="text-stone-300 leading-relaxed">
                        <span className="text-stone-400 font-medium block">🏛️ Cenário Fixo & Iluminação:</span>
                        <span>{currentTake.fixedSceneContext}</span>
                      </div>
                      <div className="text-stone-300 leading-relaxed">
                        <span className="text-stone-400 font-medium block">🍳 Panelas, Utensílios & Objetos Fixos:</span>
                        <span>{currentTake.fixedObjectsProps}</span>
                      </div>
                    </div>

                    {/* Individual Prompt Delete Button */}
                    <div className="mt-4 pt-4 border-t border-stone-850 flex items-center justify-between text-xs">
                      <span className="text-stone-400">Gerenciar este take:</span>
                      <button
                        onClick={() => handleDeleteSinglePrompt(activeTakeIndex)}
                        className="text-stone-400 hover:text-red-400 transition-colors flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Apagar apenas este prompt</span>
                      </button>
                    </div>
                  </div>

                  {/* Fresh Ingredients Quick Card with Weights & Prep Time */}
                  <div className="bg-stone-900/60 rounded-2xl border border-stone-800/80 p-5">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-800">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                        <Leaf className="w-3.5 h-3.5" />
                        <span>Ingredientes & Pesos na Bancada</span>
                      </div>
                      <button
                        onClick={() => setViewMode('recipe-guide')}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        Ver Ficha Completa →
                      </button>
                    </div>

                    <ul className="space-y-2 text-xs text-stone-300">
                      {recipe.freshIngredients.map((item, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 p-2 bg-stone-950/60 rounded-lg border border-stone-800/70">
                          <div>
                            <span className="font-semibold text-stone-200 block">{item.name}</span>
                            <span className="text-[11px] text-amber-300 font-mono">{item.quantity}</span>
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800 shrink-0">
                            ⏱️ {item.prepTime}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Master Tip Box */}
                  <div className="bg-stone-900/60 rounded-2xl border border-stone-800/80 p-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
                      <Sparkles className="w-4 h-4" />
                      <span>O Segredo de 100 Anos do Mestre</span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed italic">
                      "{recipe.masterSecret}"
                    </p>
                    <div className="text-xs text-stone-400 mt-3 pt-3 border-t border-stone-800 flex items-center justify-between">
                      <span>Perfil de sabor: {recipe.flavorProfile}</span>
                      <span className="font-mono text-amber-400">{recipe.totalTimeDisplay || 'Preparo Ágil'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
