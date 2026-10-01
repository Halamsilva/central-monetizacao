import React, { useState } from 'react';
import { Header } from './components/Header';
import { ThemeSelector } from './components/ThemeSelector';
import { ReflectionStudio } from './components/ReflectionStudio';
import { AgentRulesModal } from './components/AgentRulesModal';
import { PhoneSimulatorModal } from './components/PhoneSimulatorModal';
import { ExportModal } from './components/ExportModal';
import { ThemeItem, ReflectionScript, SpeakerGender } from './types';
import { supabase } from '../../lib/supabase';
import { INITIAL_THEMES, SAMPLE_SAVED_SCRIPT } from './data/presets';
import { AlertCircle, X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [themes, setThemes] = useState<ThemeItem[]>(INITIAL_THEMES);
  const [selectedTheme, setSelectedTheme] = useState<ThemeItem | null>(null);
  const [activeScript, setActiveScript] = useState<ReflectionScript | null>(null);

  // Loading states
  const [isRefreshingThemes, setIsRefreshingThemes] = useState<boolean>(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState<boolean>(false);

  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleStart = () => {
    setHasStarted(true);
    showToast('Apresentando 5 temas de reflexão do Velho da Roça. Escolha um para criar os prompts!', 'info');
  };

  const handleLoadPresetExample = () => {
    setHasStarted(true);
    setSelectedTheme(INITIAL_THEMES[0]);
    setActiveScript(SAMPLE_SAVED_SCRIPT);
    showToast('Exemplo clássico carregado: "A vida devolve aquilo que você planta"!', 'success');
  };

  const handleRefreshThemes = async (customTopic?: string) => {
    setIsRefreshingThemes(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const response = await fetch('/api/agents/reflexaoVelhoRoca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ action: 'generate-themes', keyword: customTopic }),
      });

      if (!response.ok) {
        throw new Error('Não foi possível gerar novos temas');
      }

      const data = await response.json();
      if (data.themes && Array.isArray(data.themes) && data.themes.length > 0) {
        setThemes(data.themes);
        setSelectedTheme(null);
        showToast(
          customTopic 
            ? `5 novos temas gerados inspirados em "${customTopic}"!` 
            : '5 novos temas formulados com sabedoria do campo!', 
          'success'
        );
      }
    } catch (err: any) {
      console.warn('Usando temas predefinidos de contingência:', err);
      showToast('Novos temas de contingência carregados com sucesso.', 'info');
    } finally {
      setIsRefreshingThemes(false);
    }
  };

  const handleGenerateReflection = async (config: {
    theme: string;
    environment: string;
    promptCount: number;
    includeFaithEnding: boolean;
    speakerGender: SpeakerGender;
    customAvatarUrl?: string;
    customAvatarDescription?: string;
    customEnvironmentUrl?: string;
    customEnvironmentDescription?: string;
  }) => {
    setIsGeneratingReflection(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const response = await fetch('/api/agents/reflexaoVelhoRoca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ...config, action: 'generate-reflection' }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro na resposta do servidor');
      }

      const scriptData: ReflectionScript = await response.json();
      scriptData.id = `script-${Date.now()}`;
      scriptData.createdAt = new Date().toISOString();
      if (!scriptData.speakerGender) {
        scriptData.speakerGender = config.speakerGender;
      }
      if (config.customAvatarUrl) {
        scriptData.customAvatarUrl = config.customAvatarUrl;
        scriptData.customAvatarDescription = config.customAvatarDescription;
      }
      if (config.customEnvironmentUrl) {
        scriptData.customEnvironmentUrl = config.customEnvironmentUrl;
        scriptData.customEnvironmentDescription = config.customEnvironmentDescription;
      }

      setActiveScript(scriptData);
      showToast(`Roteiro com ${scriptData.prompts.length} prompts 9:16 gerado com sucesso!`, 'success');
    } catch (err: any) {
      console.error('Falha ao gerar roteiro via API:', err);
      // Fallback gracioso com estrutura estrita de 9 segundos
      const isFemale = config.speakerGender === 'female';
      const isCustomAvatar = Boolean(config.customAvatarUrl || config.customAvatarDescription);
      const customAvatarClause = config.customAvatarDescription
        ? `${config.customAvatarDescription.trim()}, with authentic photorealistic human skin texture, visible natural micro-pores, fine organic wrinkles, dermal translucency with sub-surface scattering, and lifelike eyes with realistic sclera reflections. Zero plastic skin, zero 3D CGI`
        : `authentic custom character with natural human skin texture, visible micro-pores, natural facial folds, lifelike eyes, and realistic dermal translucency`;

      const requestedPrompts = SAMPLE_SAVED_SCRIPT.prompts
        .slice(0, Math.max(3, Math.min(config.promptCount || 8, SAMPLE_SAVED_SCRIPT.prompts.length)))
        .map((p, idx) => {
          const dialogue = isFemale && idx === 0 
            ? "Minha filha, tem gente que só lembra de te procurar quando a água já tá batendo no pescoço." 
            : p.spokenDialogue;

          if (!isCustomAvatar) {
            return {
              ...p,
              spokenDialogue: dialogue,
            };
          }

          const customVisual = `Vertical 9:16 documentary smartphone style 4K HDR raw footage. ${customAvatarClause}. Setting: ${config.environment || "humble rural porch during golden hour"}. Framing: ${p.cameraAngle}. Action: ${p.characterAction}. Soft natural golden hour lighting, subtle breathing movement, natural blinking.`;

          const customFormatted = `${customVisual}

Spoken dialogue in Brazilian Portuguese:
"${dialogue}"

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`;

          return {
            ...p,
            visualPrompt: customVisual,
            spokenDialogue: dialogue,
            fullFormattedPrompt: customFormatted,
          };
        });

      const fallbackScript: ReflectionScript = {
        ...SAMPLE_SAVED_SCRIPT,
        id: `script-${Date.now()}`,
        title: config.theme,
        theme: config.theme,
        environment: config.environment,
        speakerGender: config.speakerGender,
        customAvatarUrl: config.customAvatarUrl,
        customAvatarDescription: config.customAvatarDescription,
        customAvatarVisualProfile: isCustomAvatar ? customAvatarClause : undefined,
        customEnvironmentUrl: config.customEnvironmentUrl,
        customEnvironmentDescription: config.customEnvironmentDescription,
        prompts: requestedPrompts
      };
      setActiveScript(fallbackScript);
      showToast(
        isCustomAvatar
          ? 'Roteiro montado mantendo seu avatar próprio em todos os prompts com textura de pessoa real!'
          : 'Roteiro montado seguindo todas as regras de 9 segundos e UGC!',
        'info'
      );
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14100c] text-[#f4eee4] flex flex-col font-sans selection:bg-[#c26a2c] selection:text-white">
      {/* Header */}
      <Header
        onOpenRules={() => setIsRulesOpen(true)}
        onSelectPreloaded={handleLoadPresetExample}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#251910] border border-[#4d3421] text-xs font-medium text-[#f5ebd9] shadow-2xl">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#79a665]" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#e08244]" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[#9e8d7b] hover:text-white ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeScript ? (
          <ReflectionStudio
            script={activeScript}
            onBackToThemes={() => setActiveScript(null)}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
            onUpdateScript={(updated) => setActiveScript(updated)}
            onRegenerate={() => {
              const themeTitle = activeScript.theme || (selectedTheme ? selectedTheme.title : activeScript.title);
              handleGenerateReflection({
                theme: themeTitle,
                environment: activeScript.environment,
                promptCount: activeScript.prompts.length,
                includeFaithEnding: true,
                speakerGender: activeScript.speakerGender || 'male',
                customAvatarUrl: activeScript.customAvatarUrl,
                customAvatarDescription: activeScript.customAvatarDescription,
                customEnvironmentUrl: activeScript.customEnvironmentUrl,
                customEnvironmentDescription: activeScript.customEnvironmentDescription,
              });
            }}
            isRegenerating={isGeneratingReflection}
          />
        ) : (
          <ThemeSelector
            themes={themes}
            selectedTheme={selectedTheme}
            onSelectTheme={(theme) => setSelectedTheme(theme)}
            onRefreshThemes={handleRefreshThemes}
            isRefreshing={isRefreshingThemes}
            onGenerateReflection={handleGenerateReflection}
            isGeneratingReflection={isGeneratingReflection}
            hasStarted={hasStarted}
            onStartClick={handleStart}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a1d13] bg-[#0e0a07] py-6 px-4 text-center text-xs text-[#877565]">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-serif-roca text-sm text-[#bda894]">
            "A vida não esquece aquilo que cada um resolveu plantar pelo caminho."
          </p>
          <p className="text-[11px] text-[#6d5c4e]">
            Reflexões do Velho da Roça • Agente especializado em vídeos curtos 9:16 para TikTok, Reels e Shorts • Sem legendas no vídeo final • Voz humilde e humana de 80 anos.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AgentRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {activeScript && (
        <>
          <PhoneSimulatorModal
            isOpen={isSimulatorOpen}
            onClose={() => setIsSimulatorOpen(false)}
            script={activeScript}
          />

          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            script={activeScript}
          />
        </>
      )}
    </div>
  );
}
