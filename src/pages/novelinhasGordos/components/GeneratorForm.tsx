import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Sliders, Layers, Home, CloudRain, Users, Wand2, RefreshCw, Minus, Plus, Film, Clock, Dices, Shuffle, CheckCircle2, Scale, Heart, HeartHandshake, Smile, Trophy, Bot, Check } from "lucide-react";
import { PRESET_THEMES, BRAZILIAN_EVERYDAY_SITUATIONS, EMOTIONAL_STORY_PRESETS, getFreshBrazilianSituations, getFreshSituationsByTone } from "../data/videoAnalysis";
import { TargetAiModel, SettingType, CharacterFocus, PresetSituation, StoryTone, UploadedCharacterData, StoryAnalysisResult } from "../types";
import { CharacterImageUpload } from "./CharacterImageUpload";
import { supabase } from "../../../lib/supabase";

interface GeneratorFormProps {
  onGenerate: (params: {
    theme: string;
    setting?: SettingType;
    characterFocus?: CharacterFocus;
    targetAi: TargetAiModel;
    numScenes: number;
    customDetails: string;
    characterWeightKg: number;
    storyTone?: StoryTone;
    customCharacter?: UploadedCharacterData | null;
  }) => void;
  isLoading: boolean;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ onGenerate, isLoading }) => {
  const [theme, setTheme] = useState("Contas atrasadas e desculpas cômicas no sofá rasgado");
  const [targetAi, setTargetAi] = useState<TargetAiModel>("kling");
  const [numScenes, setNumScenes] = useState<number>(3);
  const [customDetails, setCustomDetails] = useState("");
  const [characterWeightKg, setCharacterWeightKg] = useState<number>(300);
  const [storyTone, setStoryTone] = useState<StoryTone>("comedia");
  const [toneFilter, setToneFilter] = useState<"todos" | "emocionante" | "comedia">("todos");
  const [uploadedCharacter, setUploadedCharacter] = useState<UploadedCharacterData | null>(null);

  // AI Story Theme Analysis state
  const [isAnalyzingTheme, setIsAnalyzingTheme] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StoryAnalysisResult | null>(null);
  const [lastAnalyzedTheme, setLastAnalyzedTheme] = useState<string>("");
  const debounceTimerRef = useRef<any>(null);

  // Dynamic situations state
  const [situations, setSituations] = useState<PresetSituation[]>(PRESET_THEMES);
  const [isGeneratingSituations, setIsGeneratingSituations] = useState(false);
  const [generationFeedback, setGenerationFeedback] = useState<string | null>(null);

  // Function to analyze user's theme with AI and auto-fill the whole form
  const analyzeThemeWithAi = async (themeToAnalyze: string, notifyUser: boolean = true) => {
    const clean = themeToAnalyze.trim();
    if (!clean || clean.length < 5 || isAnalyzingTheme) return;

    setIsAnalyzingTheme(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || "";
      const res = await fetch("/api/agents/novelinhasGordos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          action: "analyze-story-theme",
          theme: clean,
          characterWeightKg,
          currentTone: storyTone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          const an: StoryAnalysisResult = data.analysis;
          setAnalysisResult(an);
          setLastAnalyzedTheme(clean);

          // Auto-apply detected tone
          if (an.storyTone) {
            setStoryTone(an.storyTone);
            if (an.storyTone === "emocionante" || an.storyTone === "superacao") {
              setToneFilter("emocionante");
            } else {
              setToneFilter("comedia");
            }
          }
          // Auto-apply recommended scene count
          if (an.numScenes) {
            setNumScenes(Math.max(1, Math.min(6, an.numScenes)));
          }
          // Auto-apply rich cinematic details and props
          if (an.customDetails) {
            setCustomDetails(an.customDetails);
          }

          if (notifyUser) {
            setGenerationFeedback(`✨ Enredo analisado pela IA! Todos os campos foram preenchidos.`);
            setTimeout(() => setGenerationFeedback(null), 4000);
          }
        }
      }
    } catch (err) {
      console.warn("Theme analysis error:", err);
    } finally {
      setIsAnalyzingTheme(false);
    }
  };

  // Auto-analyze user's custom theme after typing pause (debounce)
  useEffect(() => {
    const clean = theme.trim();
    if (clean.length >= 15 && clean !== lastAnalyzedTheme) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        analyzeThemeWithAi(clean, false);
      }, 1300);
    }
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [theme, lastAnalyzedTheme, characterWeightKg, storyTone]);

  const handleSelectPreset = (preset: PresetSituation) => {
    setTheme(preset.title);
    if (preset.storyTone) {
      setStoryTone(preset.storyTone);
    }
    if (preset.customDetails) {
      setCustomDetails(preset.customDetails);
    }
    setLastAnalyzedTheme(preset.title);
    setAnalysisResult({
      theme: preset.title,
      synopsis: preset.synopsis,
      storyTone: preset.storyTone || "comedia",
      numScenes,
      setting: preset.setting,
      customDetails: preset.customDetails || "",
      explanation: `Situação pronta selecionada: "${preset.title}". Roteiro configurado para a história.`,
    });
  };

  const handleToneChange = (tone: StoryTone) => {
    setStoryTone(tone);
    if (tone === "emocionante" || tone === "superacao") {
      setToneFilter("emocionante");
      setSituations(EMOTIONAL_STORY_PRESETS.slice(0, 6));
      // Auto set first emotional theme if current is comedic
      if (!theme.includes("Diploma") && !theme.includes("Marmita") && !theme.includes("Perdão") && !theme.includes("Lágrimas")) {
        const first = EMOTIONAL_STORY_PRESETS[0];
        setTheme(first.title);
        if (first.customDetails) setCustomDetails(first.customDetails);
      }
    } else {
      setToneFilter("comedia");
      setSituations(PRESET_THEMES);
    }
  };

  const handleFilterChange = (filter: "todos" | "emocionante" | "comedia") => {
    setToneFilter(filter);
    if (filter === "emocionante") {
      setSituations(EMOTIONAL_STORY_PRESETS);
      setStoryTone("emocionante");
    } else if (filter === "comedia") {
      setSituations(BRAZILIAN_EVERYDAY_SITUATIONS.filter((s) => s.storyTone === "comedia" || !s.storyTone).slice(0, 6));
      setStoryTone("comedia");
    } else {
      setSituations(BRAZILIAN_EVERYDAY_SITUATIONS.slice(0, 6));
    }
  };

  const handleGenerateMoreSituations = async () => {
    setIsGeneratingSituations(true);
    setGenerationFeedback(null);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || "";
      const res = await fetch("/api/agents/novelinhasGordos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ action: "generate-situations", tone: storyTone }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.situations) && data.situations.length > 0) {
        setSituations(data.situations);
        setGenerationFeedback(storyTone === "emocionante" ? "❤️ 6 novas histórias emocionantes geradas por IA!" : "✨ 6 novas situações geradas por IA!");
        setTimeout(() => setGenerationFeedback(null), 3000);
        setIsGeneratingSituations(false);
        return;
      }
    } catch (e) {
      console.warn("Fetch situations fallback to local catalog:", e);
    }

    // High quality local catalog rotation by tone
    setTimeout(() => {
      const currentIds = situations.map((s) => s.id);
      const fresh = getFreshSituationsByTone(6, storyTone, currentIds);
      setSituations(fresh);
      setGenerationFeedback(storyTone === "emocionante" ? "❤️ Novas histórias comoventes carregadas!" : "🎲 Novas situações cotidianas carregadas!");
      setTimeout(() => setGenerationFeedback(null), 3000);
      setIsGeneratingSituations(false);
    }, 350);
  };

  const handleLuckyRandomSituation = () => {
    const pool = storyTone === "emocionante" ? EMOTIONAL_STORY_PRESETS : BRAZILIAN_EVERYDAY_SITUATIONS;
    const randomSituation = pool[Math.floor(Math.random() * pool.length)];
    handleSelectPreset(randomSituation);
    setGenerationFeedback(`Sorteado: "${randomSituation.title}"!`);
    setTimeout(() => setGenerationFeedback(null), 3000);
  };

  const handleLuckyEmotionalStory = () => {
    setStoryTone("emocionante");
    setToneFilter("emocionante");
    const randomEmotional = EMOTIONAL_STORY_PRESETS[Math.floor(Math.random() * EMOTIONAL_STORY_PRESETS.length)];
    handleSelectPreset(randomEmotional);
    setGenerationFeedback(`❤️ História emocionante sorteada: "${randomEmotional.title}"!`);
    setTimeout(() => setGenerationFeedback(null), 3500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      theme,
      setting: "automatico",
      characterFocus: "diversificado",
      targetAi,
      numScenes,
      customDetails,
      characterWeightKg,
      storyTone,
      customCharacter: uploadedCharacter,
    });
  };

  const isEmotional = storyTone === "emocionante" || storyTone === "superacao";

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 transition-all ${
        isEmotional ? "bg-rose-500/10" : "bg-amber-500/5"
      }`}></div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-400" />
            Configurador de Cenas & Falas de 9 Segundos
          </h2>
          <p className="text-xs text-slate-400">
            Gera prompts com fidelidade de pele, suor, anatomia mórbida e cenários dos 4 vídeos originais
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Regra Estrita: 9s por fala
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-slate-800/80 px-3 py-1 rounded-full border border-amber-500/30 font-medium">
            ⚖️ Todos: {characterWeightKg}kg
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-200 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 font-medium">
            <span>👕</span>
            <span>Roupas Curtas & Que Não Cabem</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-sky-300 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/30 font-medium">
            <span>💧</span>
            <span>Sempre Suados em Todo Momento</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-200 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-600/40 font-medium">
            <span>🏚️</span>
            <span>Cenário: Favela Pobre (Casa Bem Pobre & Meio Suja)</span>
          </div>
          {isEmotional && (
            <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30 font-bold animate-pulse">
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
              Tom Emocionante Ativo
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SELETOR DE TOM DA HISTÓRIA (NOVA OPÇÃO: HISTÓRIAS EMOCIONANTES DE FAZER CHORAR) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-rose-400" />
                Tom Narrativo & Emoção da História
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Escolha se o vídeo deve ter o humor típico do cotidiano ou uma narrativa comovente feita para fazer o público se emocionar e chorar.
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleLuckyEmotionalStory}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all shadow-sm"
                title="Sortear imediatamente uma história emocionante para fazer o público chorar"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
                <span>Sortear História Emocionante</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Comédia Cotidiana */}
            <button
              type="button"
              onClick={() => handleToneChange("comedia")}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 group relative overflow-hidden ${
                storyTone === "comedia"
                  ? "bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm ring-1 ring-amber-500/40"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                storyTone === "comedia" ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-400"
              }`}>
                <Smile className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-amber-200">
                    🎭 Comédia do Cotidiano
                  </span>
                  {storyTone === "comedia" && (
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">Ativo</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mt-1">
                  Desculpas hilárias no sofá rasgado, contas atrasadas, brigas engraçadas e a malandragem carismática da periferia.
                </p>
              </div>
            </button>

            {/* Histórias Emocionantes (Destaque Principal Solicitado) */}
            <button
              type="button"
              onClick={() => handleToneChange("emocionante")}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 group relative overflow-hidden ${
                storyTone === "emocionante"
                  ? "bg-rose-500/20 border-rose-500 text-rose-200 shadow-md shadow-rose-500/10 ring-1 ring-rose-500/50"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-rose-500/40 hover:text-rose-200 hover:bg-rose-950/20"
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                storyTone === "emocionante" ? "bg-rose-500/30 text-rose-300" : "bg-slate-800 text-slate-400"
              }`}>
                <Heart className="w-5 h-5 fill-rose-400 text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-rose-200 flex items-center gap-1.5">
                    ❤️ Histórias Emocionantes
                    <span className="text-[9px] bg-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded font-bold uppercase">De Fazer Chorar</span>
                  </span>
                  {storyTone === "emocionante" && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-semibold">Ativo</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mt-1">
                  Lágrimas reais, superação comovente de mãe e filho, marmita dividida, solidariedade na chuva e arcos que tocam a alma do espectador.
                </p>
              </div>
            </button>

            {/* Superação & Vitória */}
            <button
              type="button"
              onClick={() => handleToneChange("superacao")}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 group relative overflow-hidden ${
                storyTone === "superacao"
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-sm ring-1 ring-emerald-500/40"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                storyTone === "superacao" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
              }`}>
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-200">
                    🌟 Superação & Vitória
                  </span>
                  {storyTone === "superacao" && (
                    <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">Ativo</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mt-1">
                  Conquista da casinha própria após 30 anos, formatura do filho, mutirão da comunidade salvando a idosa e vitórias da vida real.
                </p>
              </div>
            </button>
          </div>

          {/* Banner de Direção Emocional Ativa */}
          {isEmotional && (
            <div className="flex items-start gap-2.5 text-xs text-rose-200 bg-rose-950/40 border border-rose-500/30 rounded-xl p-3">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-[11px] leading-relaxed">
                <strong className="text-white font-bold">Diretriz de Alto Impacto Emocional Ativada: </strong>
                A IA vai gerar roteiros e prompts calibrados para <strong>fazer o público se emocionar e chorar</strong>.
                Foco em lágrimas nítidas escorrendo pelas bochechas roliças, nós na garganta, mãos calejadas trêmulas, olhares de perdão, abraços apertados e dignidade nobre das famílias humildes brasileiras.
              </div>
            </div>
          )}
        </div>

        {/* Presets Bar with Dynamic Generation Button and Tone Tabs */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Situações Prontas (1 Clique)
              </label>

              {/* Filtros de Tom para os Presets */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleFilterChange("todos")}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    toneFilter === "todos"
                      ? "bg-slate-800 text-white font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange("emocionante")}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                    toneFilter === "emocionante"
                      ? "bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30"
                      : "text-slate-400 hover:text-rose-300"
                  }`}
                >
                  <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
                  ❤️ Emocionantes ({EMOTIONAL_STORY_PRESETS.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange("comedia")}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    toneFilter === "comedia"
                      ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                      : "text-slate-400 hover:text-amber-300"
                  }`}
                >
                  🎭 Comédia
                </button>
              </div>

              {generationFeedback && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 animate-fade-in">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {generationFeedback}
                </span>
              )}
            </div>

            {/* Buttons to generate new situations and randomizer */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleGenerateMoreSituations}
                disabled={isGeneratingSituations}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
                title={isEmotional ? "Gera mais ideias de histórias emocionantes com IA" : "Gera 6 novas ideias do cotidiano brasileiro"}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isGeneratingSituations ? "animate-spin" : ""}`} />
                <span>{isGeneratingSituations ? "Gerando..." : isEmotional ? "Mais Histórias Emocionantes" : "Gerar Mais Situações"}</span>
              </button>

              <button
                type="button"
                onClick={handleLuckyRandomSituation}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
                title="Sorteia uma situação brasileira aleatória e preenche o formulário"
              >
                <Dices className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Sortear</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {situations.map((preset) => {
              const isSelected = theme === preset.title;
              const presetIsEmotional = preset.storyTone === "emocionante" || preset.storyTone === "superacao";
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  title={preset.synopsis || preset.title}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between group relative overflow-hidden ${
                    isSelected
                      ? presetIsEmotional
                        ? "bg-rose-500/20 border-rose-500 text-rose-200 shadow-sm shadow-rose-500/10 ring-1 ring-rose-500/40"
                        : "bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/40"
                      : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  {presetIsEmotional && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-rose-400 mb-1">
                      <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                      <span>Emocionante</span>
                    </div>
                  )}
                  <span className="font-semibold line-clamp-2 mb-1.5 leading-snug group-hover:text-white">
                    {preset.title}
                  </span>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between w-full mt-auto pt-1 border-t border-slate-800/60">
                    <span className="inline-flex items-center gap-0.5 text-amber-300/80">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Cenário Automático
                    </span>

                    <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[9px] font-medium">
                      <Users className="w-2.5 h-2.5" /> Elenco Inédito
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme / Enredo da Cena Input & AI Auto-fill */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                Tema / Enredo da Cena
                {isEmotional && (
                  <span className="text-[10px] text-rose-400 font-semibold lowercase bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    ❤️ modo emocionante
                  </span>
                )}
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Escreva a sua história ou situação. O cenário será sempre um lugar pobre do Brasil (se for casa, sempre casa de favela bem pobre e meio suja). A IA analisa o enredo e preenche tudo automaticamente.
              </p>
            </div>

            {/* Botão de Análise com IA */}
            <button
              type="button"
              onClick={() => analyzeThemeWithAi(theme, true)}
              disabled={isAnalyzingTheme || !theme.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-rose-500/30 active:scale-95 border border-amber-500/50 text-amber-200 text-xs font-bold transition-all disabled:opacity-50 shadow-sm shrink-0"
              title="A IA analisa o seu enredo e preenche o tom, quantidade ideal de takes, adereços e detalhes"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isAnalyzingTheme ? "animate-spin" : "animate-pulse"}`} />
              <span>{isAnalyzingTheme ? "Analisando Enredo..." : "✨ IA Analisar Enredo & Preencher Tudo"}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder={
                isEmotional
                  ? "Ex: O diploma do filho e o abraço com lágrimas da mãe lavadeira, ou o mecânico Seu Tião trabalhando até tarde na chuva para comprar o remédio da avó..."
                  : "Ex: Raimundo discutindo conta de luz no sofá rasgado enquanto a lâmpada pisca, ou medindo a cratera de água na rua de barro com vara de madeira..."
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-y leading-relaxed"
              required
            />
            {isAnalyzingTheme && (
              <div className="absolute right-3 bottom-3 flex items-center gap-1.5 text-[11px] text-amber-300 bg-slate-900/95 px-2.5 py-1 rounded-lg border border-amber-500/40 shadow-md animate-fade-in">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>IA analisando o seu enredo...</span>
              </div>
            )}
          </div>

          {/* Feedback & Confirmation of Analysis */}
          {analysisResult && (
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3 space-y-2 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Enredo Analisado pela IA! Tudo Configurado para a sua História:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                    storyTone === "emocionante" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    Tom: {storyTone}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-slate-800 text-sky-300 border border-sky-500/30">
                    {numScenes} {numScenes === 1 ? "take" : "takes"} ({numScenes * 9}s)
                  </span>
                  {analysisResult.settingDescription && (
                    <span className="px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[220px]">
                      📍 {analysisResult.settingDescription}
                    </span>
                  )}
                </div>
              </div>

              {analysisResult.explanation && (
                <p className="text-[11px] text-slate-300 leading-relaxed pl-5 border-l-2 border-emerald-500/40">
                  {analysisResult.explanation}
                </p>
              )}

              <div className="text-[10px] text-amber-300/90 flex items-center gap-1 pl-5">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Ao clicar em <strong>"Gerar Prompts Especialistas com Falas de 9s"</strong> abaixo, os prompts serão gerados rigorosamente a partir do seu enredo.</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload da Imagem do Personagem */}
        <CharacterImageUpload
          characterData={uploadedCharacter}
          onChange={setUploadedCharacter}
          characterWeightKg={characterWeightKg}
        />

        {/* Main Control Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target AI Engine */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                IA de Vídeo Alvo
              </span>
              <span className="text-[10px] text-emerald-400 font-normal">Proteção Anti-Bloqueio Ativa</span>
            </label>
            <select
              value={targetAi}
              onChange={(e) => setTargetAi(e.target.value as TargetAiModel)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="flow">🌊 Flow (Anti-Bloqueio: 100% livre de pessoas famosas/marcas)</option>
              <option value="kling">Kling AI (v1.5 / v2.0 - Recomendado)</option>
              <option value="runway">Runway Gen-3 Alpha</option>
              <option value="sora">OpenAI Sora / Sora Turbo</option>
              <option value="luma">Luma Dream Machine</option>
              <option value="hailuo">Hailuo AI (MiniMax Video-01)</option>
              <option value="wan">Wan 2.1 (Open-Source)</option>
              <option value="veo">Google Veo 3.1</option>
            </select>
          </div>

          {/* Novos Personagens Inéditos Indicator */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Criação de Personagens
              </span>
              <span className="text-[10px] text-amber-300 font-normal">Todos {characterWeightKg}kg</span>
            </label>
            <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-medium text-slate-200">
                  Personagens 100% Inéditos para a História
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                Automático
              </span>
            </div>
          </div>
        </div>

        {/* Escolha do Peso Corporal de Todos os Personagens */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                Peso de Todos os Personagens ({characterWeightKg}kg)
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Escolha quantos quilos TODOS os personagens da cena (homens, mulheres, idosas e figurantes) devem ter nos prompts.
              </p>
            </div>

            {/* Stepper + Input */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900 border border-slate-700 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setCharacterWeightKg((prev) => Math.max(40, prev - 10))}
                disabled={characterWeightKg <= 40}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 flex items-center justify-center transition-colors text-xs font-bold"
                title="Diminuir 10kg"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 px-2">
                <input
                  type="number"
                  min={40}
                  max={600}
                  step={5}
                  value={characterWeightKg}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) {
                      setCharacterWeightKg(Math.max(40, Math.min(600, val)));
                    }
                  }}
                  className="w-14 bg-transparent text-center text-xs font-mono font-bold text-amber-300 focus:outline-none"
                />
                <span className="text-[11px] font-mono text-slate-400 font-semibold">kg</span>
              </div>

              <button
                type="button"
                onClick={() => setCharacterWeightKg((prev) => Math.min(600, prev + 10))}
                disabled={characterWeightKg >= 600}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 flex items-center justify-center transition-colors text-xs font-bold"
                title="Aumentar 10kg"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Choice Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { kg: 70, label: "70 kg", desc: "Médio / Padrão" },
              { kg: 100, label: "100 kg", desc: "Forte / Robusto" },
              { kg: 150, label: "150 kg", desc: "Muito Pesado" },
              { kg: 200, label: "200 kg", desc: "Super Obeso" },
              { kg: 250, label: "250 kg", desc: "Hiper-Obeso" },
              { kg: 300, label: "300 kg", desc: "Colossal (Padrão)", highlighted: true },
              { kg: 400, label: "400 kg", desc: "Massa Extrema" },
            ].map((item) => {
              const isSelected = characterWeightKg === item.kg;
              return (
                <button
                  key={item.kg}
                  type="button"
                  onClick={() => setCharacterWeightKg(item.kg)}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/40"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    {item.label}
                    {item.highlighted && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Weight Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Mínimo: 40kg</span>
              <span className="text-amber-400 font-bold">
                {characterWeightKg}kg ≈ {Math.round(characterWeightKg * 2.20462)} lbs
              </span>
              <span>Máximo: 600kg</span>
            </div>
            <input
              type="range"
              min={40}
              max={600}
              step={5}
              value={characterWeightKg}
              onChange={(e) => setCharacterWeightKg(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          {/* Dynamic Weight Anatomy Preview */}
          <div className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800/90">
            <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-white">Consistência Fisiológica Aplicada ({characterWeightKg}kg): </span>
              {characterWeightKg >= 300 ? (
                <span className="text-amber-300">
                  Estrutura colossal com dobras profundas de pele, abdômen pendular proeminente, bochechas roliças com queixo duplo volumoso e física gravitacional autêntica aplicada a todos os personagens.
                </span>
              ) : characterWeightKg >= 200 ? (
                <span className="text-amber-300">
                  Hiper-obesidade acentuada com tronco largo, barriga volumosa sob roupas esticadas, dobras macias e gotas naturais de suor tropical.
                </span>
              ) : characterWeightKg >= 130 ? (
                <span className="text-amber-300">
                  Estrutura muito robusta e encorpada (porte pesado/gordinho clássico), massa corporal espessa e postura estável.
                </span>
              ) : characterWeightKg >= 90 ? (
                <span className="text-slate-300">
                  Físico encorpado e robusto de peso médio-alto com constituição forte e formato realista para os padrões da comunidade.
                </span>
              ) : (
                <span className="text-slate-300">
                  Proporções corporais cotidianas realistas de peso comum ({characterWeightKg}kg), sem gigantismo, mantendo a autenticidade estética periférica.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quantity of Prompts Selector */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                Quantidade de Prompts / Takes do Vídeo
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Escolha quantos prompts gerar de acordo com a duração do seu vídeo (cada prompt tem 9 segundos).
              </p>
            </div>

            {/* Stepper Control */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900 border border-slate-700 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setNumScenes((prev) => Math.max(1, prev - 1))}
                disabled={numScenes <= 1}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 flex items-center justify-center transition-colors text-xs font-bold"
                title="Diminuir quantidade de prompts"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="px-3 text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 min-w-[75px] justify-center">
                <span>{numScenes}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {numScenes === 1 ? "take" : "takes"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNumScenes((prev) => Math.min(6, prev + 1))}
                disabled={numScenes >= 6}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 flex items-center justify-center transition-colors text-xs font-bold"
                title="Aumentar quantidade de prompts"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Choice Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { count: 1, label: "1 Take", time: "9s", desc: "Vídeo Rápido" },
              { count: 2, label: "2 Takes", time: "18s", desc: "Vídeo Curto" },
              { count: 3, label: "3 Takes", time: "27s", desc: "Arco Padrão" },
              { count: 4, label: "4 Takes", time: "36s", desc: "Vídeo Médio" },
              { count: 5, label: "5 Takes", time: "45s", desc: "Esquete" },
              { count: 6, label: "6 Takes", time: "54s", desc: "Episódio" },
            ].map((item) => {
              const isSelected = numScenes === item.count;
              return (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setNumScenes(item.count)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/40"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-amber-400 font-mono">
                      {item.time}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{item.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Helper Note */}
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800/90">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="text-[11px]">
              {numScenes === 1 && (
                <span>
                  <strong>Vídeo Curto (1 Take / 9s):</strong> Perfeito para vídeos rápidos, Reels/TikTok curtos ou testes de geração rápida na IA.
                </span>
              )}
              {numScenes === 2 && (
                <span>
                  <strong>Vídeo Curto (2 Takes / 18s):</strong> Ideal para mini-esquetes rápidas com introdução e desfecho imediato.
                </span>
              )}
              {numScenes === 3 && (
                <span>
                  <strong>Arco Padrão (3 Takes / 27s):</strong> Estrutura recomendada dos vídeos anexados (Abertura, Conflito e Punchline/Desfecho emocionante).
                </span>
              )}
              {numScenes >= 4 && (
                <span>
                  <strong>Vídeo Estendido ({numScenes} Takes / {numScenes * 9}s):</strong> Roteiro completo com múltiplos takes sequenciais e consistência garantida.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Custom optional instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Instruções Extras de Adereços ou Detalhes (Opcional)
          </label>
          <input
            type="text"
            value={customDetails}
            onChange={(e) => setCustomDetails(e.target.value)}
            placeholder={
              isEmotional
                ? "Ex: 'Lágrimas caindo na marmita', 'Abraço apertado de mãe e filho sob chuva fina', 'Segurando o primeiro diploma da família'..."
                : "Ex: 'Quero que o balde da goteira transborde', 'Raimundo segurando garrafa de 2L de Dolly', 'Barro respingando no vizinho'..."
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {isEmotional
              ? "❤️ Prompts calibrados para alta carga emocional, lágrimas autênticas e conexão humana profunda"
              : "⚡ Gera prompts em inglês e português, anatomia 8K, suor realista e marcação métrica [00:00 - 00:09]"}
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
              isEmotional
                ? "bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white shadow-rose-500/25"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {isEmotional ? "Criando História Emocionante & Falas de 9s..." : "Analisando Vídeos e Gerando Falas de 9s..."}
              </>
            ) : isEmotional ? (
              <>
                <Heart className="w-4 h-4 fill-white text-white animate-pulse" />
                Gerar História Emocionante com Falas de 9s
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar Prompts Especialistas com Falas de 9s
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
