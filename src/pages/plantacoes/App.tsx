import { useState, useEffect } from "react";
import { CultivationTheme, CharacterType, SettingType, ScriptResponse } from "./types";
import ThemeSelector from "./components/ThemeSelector";
import ConfigurationWizard from "./components/ConfigurationWizard";
import StoryboardView from "./components/StoryboardView";
import { Leaf, Sparkles, Sprout, ShieldCheck, HeartHandshake, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { describeHttpError } from "../../lib/httpError";

export default function App() {
  const [step, setStep] = useState<"theme" | "config" | "storyboard">("theme");
  const [theme, setTheme] = useState<string>("");
  const [characterType, setCharacterType] = useState<CharacterType>("homem-rural");
  const [settingType, setSettingType] = useState<SettingType>("quintal-simples");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [scriptResponse, setScriptResponse] = useState<ScriptResponse | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStatusIndex, setLoadingStatusIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const loadingStatuses = [
    "Sincronizando adubo orgânico com o servidor...",
    "Estruturando CENA 1 — A Descoberta surpreendente...",
    "Polindo fofura do substrato para CENA 2 — O Segredo...",
    "Preservando simetria facial, poros e rugas naturais...",
    "Estabilizando roupas desbotadas e mãos com veias para consistência...",
    "Modelando flores e crescimento realista na CENA 3 — A Produção...",
    "Medindo tempo exato de fala de 8 segundos no ritmo do campo...",
    "Afiando unhas sujas de terra para a colheita na CENA 4...",
    "Compilando metadados simplificados para SEO no YouTube, Reels e TikTok...",
    "Finalizando realismo documental digno de gravação de smartphone..."
  ];

  // Rotate loading status text every 2.5s while loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStatusIndex((prev) => (prev + 1) % loadingStatuses.length);
      }, 2500);
    } else {
      setLoadingStatusIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSelectTheme = (selectedThemeTitle: string, suggestedChar?: string, suggestedSetting?: string) => {
    setTheme(selectedThemeTitle);
    if (suggestedChar) setCharacterType(suggestedChar as CharacterType);
    if (suggestedSetting) setSettingType(suggestedSetting as SettingType);
    setStep("config");
  };

  const handleGenerateScript = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';

      const response = await fetch("/api/agents/plantacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          theme,
          characterType,
          settingType,
          avatarImage
        })
      });

      if (!response.ok) {
        throw new Error(await describeHttpError(response));
      }

      const parsedData: ScriptResponse = await response.json();
      setScriptResponse(parsedData);
      setStep("storyboard");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Algo deu errado durante a geração do roteiro. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("theme");
    setTheme("");
    setCharacterType("homem-rural");
    setSettingType("quintal-simples");
    setAvatarImage(null);
    setScriptResponse(null);
    setError(null);
  };

  return (
    <div className="flex w-full rounded-3xl bg-slate-50 text-slate-900 font-sans">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 font-sans">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white shrink-0">
              <Sprout className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-emerald-900 text-base block">AgroVision AI</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">Diretor de Horta</span>
            </div>
          </div>
          <button
            id="sidebar-new-btn"
            onClick={handleReset}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium shadow-sm hover:bg-emerald-700 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Nova Geração
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
              Status do Processo
            </p>
            <div className="space-y-1.5">
              <div className={`p-2 rounded text-xs transition-colors flex items-center justify-between font-semibold ${
                step === "theme" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "text-slate-500 hover:bg-slate-50"
              }`}>
                <span>1. Tema do Cultivo</span>
                {step !== "theme" && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1 rounded">Ok</span>}
              </div>
              <div className={`p-2 rounded text-xs transition-colors flex items-center justify-between font-semibold ${
                step === "config" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "text-slate-500 hover:bg-slate-50"
              }`}>
                <span>2. Parâmetros de Voz</span>
                {step === "storyboard" && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1 rounded">Ok</span>}
              </div>
              <div className={`p-2 rounded text-xs transition-colors flex items-center justify-between font-semibold ${
                step === "storyboard" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "text-slate-500 hover:bg-slate-50"
              }`}>
                <span>3. Roteiro e Prompts</span>
                {step === "storyboard" && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1 rounded">Geral</span>}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
              Exemplos Rápidos
            </p>
            <div className="space-y-1">
              <button
                onClick={() => handleSelectTheme("Abobrinha gigante", "homem-rural", "quintal-simples")}
                className="w-full text-left p-2 hover:bg-slate-50 rounded text-xs text-slate-600 font-medium truncate cursor-pointer transition-colors"
              >
                🥒 Abobrinha Gigante
              </button>
              <button
                onClick={() => handleSelectTheme("Tomate cereja", "jovem-urbano", "apartamento-sacada")}
                className="w-full text-left p-2 hover:bg-slate-50 rounded text-xs text-slate-600 font-medium truncate cursor-pointer transition-colors"
              >
                🍅 Tomate Cereja Orgânico
              </button>
              <button
                onClick={() => handleSelectTheme("Horta em baldes", "homem-rural", "quintal-simples")}
                className="w-full text-left p-2 hover:bg-slate-50 rounded text-xs text-slate-600 font-medium truncate cursor-pointer transition-colors"
              >
                🪣 Horta em Baldes 20L
              </button>
              <button
                onClick={() => handleSelectTheme("Jardim vertical", "jovem-urbano", "apartamento-sacada")}
                className="w-full text-left p-2 hover:bg-slate-50 rounded text-xs text-slate-600 font-medium truncate cursor-pointer transition-colors"
              >
                📐 Jardim Vertical PET
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 p-1.5">
            <div className="w-8 h-8 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-600">
              <Sprout className="w-4 h-4 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Produtor Rural AI</p>
              <p className="text-[10px] text-slate-400 tracking-tight">Smartphone Doc v2.4</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-7 h-7 bg-emerald-600 rounded flex items-center justify-center text-white shrink-0">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              Status:&nbsp;
              <span className="text-emerald-600 font-extrabold font-mono">
                {step === "theme" && "Agente Aguardando Tema"}
                {step === "config" && "Ajustando Personagem"}
                {step === "storyboard" && "Roteiro Conectado Gerado"}
              </span>
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (step !== "theme") {
                  handleReset();
                }
              }}
              disabled={step === "theme"}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg font-semibold cursor-pointer disabled:opacity-40 transition-colors"
            >
              Reiniciar
            </button>
            {step === "storyboard" && (
              <span className="px-3 py-1.5 text-xs bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                ✓ Ultra-Realista
              </span>
            )}
          </div>
        </header>

        {/* Scrollable Container with standard spacing */}
        <div className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto space-y-6">
          
          {error && (
            <div id="error-alert" className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 max-w-xl mx-auto animate-[bounce_1s_1]">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-red-800">
                <h4 className="font-bold">Ocorreu um problema de conexão:</h4>
                <p className="leading-relaxed font-semibold">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-2 text-[10px] uppercase font-bold text-red-900 bg-white border border-red-200 px-2.5 py-1 rounded hover:bg-red-100/50 transition-colors cursor-pointer"
                >
                  Tentar Outro Tema
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {loading ? (
            <div id="loading-overlay" className="py-16 text-center max-w-md mx-auto space-y-6">
              <div className="relative inline-flex items-center justify-center p-1 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-full animate-spin">
                <div className="p-4 bg-white rounded-full">
                  <Leaf className="w-10 h-10 text-emerald-600 fill-current animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-slate-900 text-base">
                  Sincronizando Consistência de Redes...
                </h3>
                <p className="text-xs text-emerald-700 font-mono font-medium animate-pulse">
                  {loadingStatuses[loadingStatusIndex]}
                </p>
              </div>

              <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-xl space-y-2 text-left">
                <p className="text-[10px] text-slate-500 leading-normal font-mono">
                  DICA: Nossos prompts visuais seguem o rigor técnico em inglês exigidos pelas IAs de geração de vídeo modernas para simular imperfeições de lentes e pele humana comum.
                </p>
              </div>
            </div>
          ) : (
            /* MULTI-STEP ROUTING WIZARD COMPONENT */
            <div className="space-y-6">
              {step === "theme" && (
                <ThemeSelector onSelect={handleSelectTheme} selectedTheme={theme} />
              )}
              {step === "config" && (
                <ConfigurationWizard
                  theme={theme}
                  characterType={characterType}
                  settingType={settingType}
                  onChangeCharacter={setCharacterType}
                  onChangeSetting={setSettingType}
                  onSubmit={handleGenerateScript}
                  onBack={handleReset}
                  loading={loading}
                  avatarImage={avatarImage}
                  onChangeAvatar={setAvatarImage}
                />
              )}
              {step === "storyboard" && scriptResponse && (
                <StoryboardView data={scriptResponse} onReset={handleReset} />
              )}
            </div>
          )}
        </div>

        {/* Global Footer in container bar */}
        <footer className="h-12 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
          <div>
            <span>Agência Diretor da Horta Realista — 2026</span>
          </div>
          <div className="hidden sm:flex gap-4">
            <span>✓ Chave API Server-Side</span>
            <span>✓ 100% Livre de Filtro AI</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
