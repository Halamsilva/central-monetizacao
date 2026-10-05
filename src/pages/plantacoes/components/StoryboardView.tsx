import React, { useState, useRef, useEffect } from "react";
import { ScriptResponse, Scene } from "../types";
import { 
  Copy, Check, Play, Square, Volume2, Sparkles, Smartphone, 
  RefreshCw, ClipboardCheck, ArrowLeft, Leaf, MapPin, User, ChevronRight, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StoryboardViewProps {
  data: ScriptResponse;
  onReset: () => void;
}

export default function StoryboardView({ data, onReset }: StoryboardViewProps) {
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [copiedUnifiedIndex, setCopiedUnifiedIndex] = useState<number | null>(null);
  const [copiedSEO, setCopiedSEO] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"visual" | "raw">("visual");

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const activeScene: Scene = data.scenes[activeSceneIndex] || data.scenes[0];

  const handleCopyPrompt = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };

  const handleCopyUnifiedPrompt = (scene: Scene, index: number) => {
    const text = `PROMPT VISUAL (VIDEO): ${scene.visualPrompt}\n\nFALA DE ÁUDIO (NARRATOR): "${scene.narration}"\n\nSOM AMBIENTE (SFX): ${scene.ambientSound}`;
    navigator.clipboard.writeText(text);
    setCopiedUnifiedIndex(index);
    setTimeout(() => setCopiedUnifiedIndex(null), 2000);
  };

  const handleCopySEO = () => {
    navigator.clipboard.writeText(data.seo);
    setCopiedSEO(true);
    setTimeout(() => setCopiedSEO(false), 2000);
  };

  const handleCopyFullScript = () => {
    let fullText = `TEMA: ${data.theme}\n`;
    fullText += `PERFIL CONTEXTO DO PERSONAGEM: ${data.characterProfile}\n`;
    fullText += `CENOGRAFIA ORIGINAL: ${data.scenographyDescription}\n\n`;

    data.scenes.forEach((scene, i) => {
      fullText += `--- ${scene.title || `CENA ${i+1}`} ---\n`;
      fullText += `PROMPT VISUAL (IA): ${scene.visualPrompt}\n`;
      fullText += `FALAS DO PERSONAGEM: "${scene.narration}"\n`;
      fullText += `SOM AMBIENTE: ${scene.ambientSound}\n\n`;
    });

    fullText += `SEO METADATA\n${data.seo}`;

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Speaks using Web Speech API to simulate natural 8s timing
  const handlePlayNarration = (text: string) => {
    if (!synthRef.current) return;

    if (isPlayingAudio) {
      synthRef.current.cancel();
      setIsPlayingAudio(false);
      return;
    }

    synthRef.current.cancel();
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.lang = "pt-BR";
    utteranceRef.current.rate = 0.82; // Slower, country-side cadence
    utteranceRef.current.pitch = 0.95; // Slightly deeper, warm pitch

    utteranceRef.current.onend = () => {
      setIsPlayingAudio(false);
    };

    utteranceRef.current.onerror = () => {
      setIsPlayingAudio(false);
    };

    setIsPlayingAudio(true);
    synthRef.current.speak(utteranceRef.current);
  };

  const handleToggleAmbient = () => {
    setIsAmbientPlaying(!isAmbientPlaying);
  };

  // Background gradient simulators based on selected theme/plant
  const getSceneVisualGradient = (index: number) => {
    const gradients = [
      "from-emerald-900/40 to-stone-900/80", // Descoberta
      "from-amber-900/40 to-stone-950/80",    // Segredo / Substrato
      "from-teal-900/40 to-stone-900/80",     // Produção
      "from-emerald-950/40 to-neutral-900/80" // Colheita
    ];
    return gradients[index] || "from-emerald-900/35 to-stone-900/80";
  };

  return (
    <div id="storyboard-view-parent" className="space-y-8 pb-12">
      {/* Action Header / Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            id="back-to-input-btn"
            onClick={onReset}
            className="p-2 border border-gray-200 hover:border-emerald-300 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            title="Voltar para a escolha do tema"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
              Script Gerado com Sucesso
            </span>
            <h2 className="text-xl font-sans font-bold text-gray-900 line-clamp-1">
              Roteiro: {data.theme}
            </h2>
          </div>
        </div>

        {/* Tab Buttons & Global Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
            <button
              id="tab-visual-btn"
              onClick={() => setActiveTab("visual")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === "visual"
                  ? "bg-white text-emerald-950 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Cena por Cena
            </button>
            <button
              id="tab-raw-btn"
              onClick={() => setActiveTab("raw")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === "raw"
                  ? "bg-white text-emerald-950 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Roteiro Geral
            </button>
          </div>

          <button
            id="copy-full-script-btn"
            onClick={handleCopyFullScript}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedAll ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedAll ? "Copiado!" : "Copiar Tudo"}
          </button>
        </div>
      </div>

      {/* Main Container Layout */}
      {activeTab === "visual" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: 12-grids - 5 columns is the Mobile Preview Frame */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-stone-900 rounded-[32px] p-3.5 border-4 border-stone-800 shadow-2xl relative overflow-hidden aspect-[9/16] max-w-sm mx-auto flex flex-col justify-between">
              
              {/* Internal simulated speaker / notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-stone-950 rounded-b-xl z-25 flex items-center justify-center">
                <div className="w-12 h-1 bg-stone-800 rounded-full" />
                <div className="w-2 h-2 bg-stone-900 rounded-full ml-3 border border-stone-800" />
              </div>

              {/* Viewport/Camera Layer */}
              <div className="absolute inset-x-2 inset-y-2 rounded-[24px] overflow-hidden bg-stone-950 z-10 flex flex-col justify-between p-4 pt-6">
                
                {/* 1. Backdrop simulated illustration depending on stage */}
                <div className={`absolute inset-0 bg-gradient-to-b ${getSceneVisualGradient(activeSceneIndex)} opacity-90 transition-all duration-700 z-0`} />
                
                {/* Aesthetic texture background representing garden */}
                <div className="absolute inset-0 opacity-15 mix-blend-color-dodge pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] z-1 animate-[pulse_6s_infinite]" />
                
                {/* Top bar controls */}
                <div className="relative z-10 flex justify-between items-center text-white/80 font-mono text-[9px] tracking-wider pt-2">
                  <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                    <span className="text-red-400 font-bold">REC</span>
                    <span>00:08</span>
                  </div>
                  <div className="bg-black/35 px-2 py-0.5 rounded-full text-white font-semibold">
                    {activeScene.title?.split("—")[0].trim() || `CENA ${activeSceneIndex + 1}`}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>SMARTPHONE</span>
                  </div>
                </div>

                {/* 3x3 Composition Guidelines Rule-Of-Thirds Grid */}
                <div className="absolute inset-0 border border-white/5 pointer-events-none z-10 grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/5" />
                  <div className="border-r border-b border-white/5" />
                  <div className="border-b border-white/5" />
                  <div className="border-r border-b border-white/5" />
                  <div className="border-r border-b border-white/5" />
                  <div className="border-b border-white/5" />
                  <div className="border-r border-white/5" />
                  <div className="border-r border-white/5" />
                  <div className="relative" />
                </div>

                {/* Simulated Focus Ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-yellow-400/35 w-16 h-16 pointer-events-none rounded z-10 flex items-center justify-center">
                  <div className="w-1 h-1 bg-yellow-400/50 rounded-full" />
                </div>

                {/* Middle illustration space describing consistent character */}
                <div className="relative z-10 my-auto text-center px-4 py-8 bg-black/20 backdrop-blur-xs rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-center">
                    <span className="p-3 bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/20">
                      {activeSceneIndex === 0 && <Leaf className="w-8 h-8 animate-bounce" />}
                      {activeSceneIndex === 1 && <HelpCircle className="w-8 h-8 animate-[spin_5s_linear_infinite]" />}
                      {activeSceneIndex === 2 && <Volume2 className="w-8 h-8 animate-pulse" />}
                      {activeSceneIndex === 3 && <Sparkles className="w-8 h-8" />}
                    </span>
                  </div>
                  <h4 className="text-[10px] tracking-widest text-emerald-400 font-mono font-bold uppercase">
                    DIRETRIZ DE ENQUADRAMENTO
                  </h4>
                  <p className="text-[11px] text-zinc-100 font-medium leading-normal line-clamp-4">
                    {activeSceneIndex === 0 && "Primeiro plano: Homem rural mostra a planta de perto com orgulho, terra ao fundo."}
                    {activeSceneIndex === 1 && "Foco na terra: Detalhe das mãos remexendo o substrato fofo com fibras rústicas."}
                    {activeSceneIndex === 2 && "Plano inteiro: O personagem aponta para múltiplas outras flores e frutos ao longo do quintal."}
                    {activeSceneIndex === 3 && "Super Close-up: Mão calejada colhe com firmeza o fruto fresco e o exibe com orgulho discreto."}
                  </p>
                </div>

                {/* Bottom Overlay containing Real-Time Subtitle */}
                <div className="relative z-10 space-y-2">
                  <div className="bg-black/80 rounded-xl p-3 border border-white/10 shadow-lg text-center backdrop-blur-md">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-yellow-400 block mb-1">
                      FALA DO VÍDEO (~8s)
                    </span>
                    <p className="text-xs text-white leading-relaxed font-sans font-medium">
                      "{activeScene.narration}"
                    </p>
                  </div>
                  
                  {/* Virtual Audio Player bar indicator */}
                  <div className="bg-black/60 px-3 py-1.5 rounded-lg flex items-center justify-between text-[8px] tracking-wider text-stone-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>{activeScene.ambientSound?.split(".")[0] || "Som Ambiente"}</span>
                    </div>
                    <span className="text-[9px] text-white font-bold bg-emerald-500/20 px-1 py-0.5 rounded">
                      PT-BR AUDIO
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Shoot instructions advice card below the phone view */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2.5">
              <h3 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Como filmar esta cena com seu celular:
              </h3>
              <ul className="text-xs text-stone-600 space-y-1 pl-4 list-disc leading-relaxed">
                <li>Grave com a <strong>câmera traseira nativa</strong>, evite a câmera de selfie para manter grão real.</li>
                <li>Fique contra ou lateral à <strong>luz natural do sol</strong>, garantindo sombras realistas nas rugas de expressão.</li>
                <li>Deixe o áudio com ruído normal de vento suave; não use microfone com isolação artificial de inteligência artificial.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT PANEL: 12-grids - 7 columns contains scene selection timeline and detailed text info */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Context Profile Block */}
            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-gray-100 pb-3.5 md:pb-0 md:pr-4">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs uppercase tracking-wider font-mono">
                  <User className="w-4 h-4 text-emerald-600" />
                  Consistência do Personagem
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-sans font-medium">
                  {data.characterProfile}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs uppercase tracking-wider font-mono">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Cenografia e Local
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-sans font-medium">
                  {data.scenographyDescription}
                </p>
              </div>
            </div>

            {/* Horizontal Timeline Scenes Nav steps */}
            <div className="grid grid-cols-4 gap-2">
              {data.scenes.map((scene, index) => {
                const isActive = activeSceneIndex === index;
                return (
                  <button
                    id={`timeline-step-${index}`}
                    key={index}
                    onClick={() => {
                      setActiveSceneIndex(index);
                      if (synthRef.current) synthRef.current.cancel();
                      setIsPlayingAudio(false);
                    }}
                    type="button"
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-emerald-500/20"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-[10px] font-mono block opacity-65 uppercase font-bold">
                      Etapa 0{index + 1}
                    </span>
                    <span className="text-xs font-sans font-bold block truncate mt-0.5">
                      {scene.title?.split("—")[1]?.trim() || `Cena 0${index + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Detailed Scene Visual prompt & Script specs */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              
              {/* Scene Title header banner */}
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    Cena {activeSceneIndex + 1} de 4
                  </span>
                  <h3 id="current-scene-title" className="text-sm font-bold text-gray-900 mt-1 uppercase tracking-tight">
                    {activeScene.title || `Cena ${activeSceneIndex + 1}`}
                  </h3>
                </div>
                
                {/* Audio simulation player actions */}
                <div className="flex gap-1.5">
                  <button
                    id="narrate-audio-btn"
                    onClick={() => handlePlayNarration(activeScene.narration)}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer border transition-colors ${
                      isPlayingAudio
                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100"
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        Parar Voz
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Ouvir Voz (Voz do Campo)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Central components details list */}
              <div className="p-5 space-y-5">
                
                {/* Dialogue/Narration bubble */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-400">
                    Falas Humilde (Aprox. 8s Português)
                  </label>
                  <p className="p-4 bg-emerald-50/20 text-emerald-950 font-sans font-medium text-sm leading-relaxed rounded-xl border border-emerald-500/10 italic">
                    "{activeScene.narration}"
                  </p>
                </div>

                {/* SFX / Ambient sound card */}
                <div className="space-y-2 select-none">
                  <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-400">
                    Sons Ambientais Naturais
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 font-medium">
                    <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{activeScene.ambientSound}</span>
                  </div>
                </div>

                {/* Visual Video Generator Prompt (English) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-400">
                      Visual AI Prompt (Pronto para Sora, Veo, Kling, Runway, Luma)
                    </label>
                    <div className="flex gap-3">
                      <button
                        id={`copy-scene-prompt-${activeSceneIndex}`}
                        onClick={() => handleCopyPrompt(activeScene.visualPrompt, activeSceneIndex)}
                        className="text-xs text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-none border-none"
                        title="Copia exclusivamente o prompt de vídeo em inglês"
                      >
                        {copiedPromptIndex === activeSceneIndex ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Vídeo Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Só Vídeo
                          </>
                        )}
                      </button>

                      <button
                        id={`copy-scene-unified-prompt-${activeSceneIndex}`}
                        onClick={() => handleCopyUnifiedPrompt(activeScene, activeSceneIndex)}
                        className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-none border-none"
                        title="Copia tudo da cena em um único prompt: Vídeo + Fala + Som ambiente"
                      >
                        {copiedUnifiedIndex === activeSceneIndex ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Completo Copiado!
                          </>
                        ) : (
                          <>
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            Copiar Prompt Completo (Vídeo + Áudio)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300 leading-normal select-all select-none">
                    {activeScene.visualPrompt}
                  </div>
                </div>

              </div>

              {/* Bottom Quick slide flow */}
              <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center">
                <p className="text-[10px] text-gray-400 font-mono">
                  Garantia de consistência total de personagem e textura nas gerações de vídeo.
                </p>
                {activeSceneIndex < 3 && (
                  <button
                    onClick={() => {
                      setActiveSceneIndex(activeSceneIndex + 1);
                      if (synthRef.current) synthRef.current.cancel();
                      setIsPlayingAudio(false);
                    }}
                    type="button"
                    className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    Próxima Cena
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* HIGHLY POLISHED SCENES GRID PORTRAYING PROFESSIONAL ESTHETICS */
        <div id="raw-script-tab" className="space-y-6">
          
          {/* Header Context Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                TEMÁTICA PRINCIPAL:
              </p>
              <h3 className="text-sm font-semibold text-slate-900 border-l border-slate-200 pl-3">
                {data.theme}
              </h3>
            </div>
            
            <div className="flex gap-4 text-xs text-slate-500 font-medium">
              <span>👤 Resumo: <strong className="text-slate-800">{data.characterProfile.split(",")[0] || "Produtor"}</strong></span>
              <span>📍 Local: <strong className="text-slate-800">{data.scenographyDescription.split(",")[0] || "Horta"}</strong></span>
            </div>
          </div>

          {/* Scenes Grid */}
          <div className="grid grid-cols-2 gap-4">
            {data.scenes.map((scene, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xs transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-2.5">
                    <h3 className="text-xs font-black uppercase text-slate-400">
                      Cena {i + 1}: {scene.title?.split("—")[1]?.trim() || `Etapa ${i + 1}`}
                    </h3>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono italic">
                      ~8.0s
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-[11px] leading-relaxed text-slate-600 italic border-l-2 border-emerald-500 pl-2 font-medium">
                      "{scene.narration}"
                    </p>
                    
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded font-mono break-words leading-normal border border-slate-100">
                      <span className="font-bold text-slate-700 uppercase">PROMPT: </span>
                      {scene.visualPrompt}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center select-none">
                  <div className="text-[10px] text-slate-400 font-mono flex flex-col gap-0.5">
                    <span>🔊 {scene.ambientSound?.split(".")[0] || "Sons rústicos"}</span>
                    <span>🎬 Macro Detail - 4K 30fps</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyPrompt(scene.visualPrompt, i)}
                      className="text-[10px] bg-slate-100/50 hover:bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                      title="Copiar prompt de vídeo"
                    >
                      {copiedPromptIndex === i ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Vídeo Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Só Vídeo
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyUnifiedPrompt(scene, i)}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded border border-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                      title="Copiar prompt completo da cena"
                    >
                      {copiedUnifiedIndex === i ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="w-3 h-3" />
                          Prompt Completo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SEO Footer Area matching emerald-900 look */}
          <div className="bg-emerald-990 bg-[#064e3b] text-emerald-100 p-6 rounded-xl flex flex-col md:flex-row gap-6 items-center border border-emerald-800 shadow-sm justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <p className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono">
                  SEO Metadata & Indexing Ready
                </p>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                {data.theme} Rúbrica de Geração Especialista
              </h4>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed font-sans max-w-2xl select-all select-none">
                {data.seo}
              </p>
            </div>
            
            <div className="flex flex-col gap-2.5 items-end shrink-0 w-full md:w-auto">
              <button
                id="copy-seo-text-btn-footer"
                onClick={handleCopySEO}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border border-emerald-600 shadow-sm"
              >
                {copiedSEO ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSEO ? "Copiado!" : "Copiar Metadados SEO"}
              </button>
              
              <div className="flex flex-wrap gap-1.5 justify-end">
                <span className="px-2 py-0.5 bg-emerald-800 text-[9px] rounded text-emerald-300 font-mono">#hortaurbana</span>
                <span className="px-2 py-0.5 bg-emerald-800 text-[9px] rounded text-emerald-300 font-mono">#vidarural</span>
                <span className="px-2 py-0.5 bg-emerald-800 text-[9px] rounded text-emerald-300 font-mono">#hortacaseira</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
