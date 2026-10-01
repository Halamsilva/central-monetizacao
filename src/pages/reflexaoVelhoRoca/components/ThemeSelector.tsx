import React, { useState } from 'react';
import { ThemeItem, EnvironmentPreset, SpeakerGender } from '../types';
import { ENVIRONMENT_PRESETS } from '../data/presets';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import { 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  Layers, 
  MapPin, 
  Sliders, 
  HelpCircle,
  Quote,
  User,
  Plus,
  Minus,
  Clock,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ThemeSelectorProps {
  themes: ThemeItem[];
  selectedTheme: ThemeItem | null;
  onSelectTheme: (theme: ThemeItem) => void;
  onRefreshThemes: (customTopic?: string) => Promise<void>;
  isRefreshing: boolean;
  onGenerateReflection: (config: {
    theme: string;
    environment: string;
    promptCount: number;
    includeFaithEnding: boolean;
    speakerGender: SpeakerGender;
    customAvatarUrl?: string;
    customAvatarDescription?: string;
    customEnvironmentUrl?: string;
    customEnvironmentDescription?: string;
  }) => void;
  isGeneratingReflection: boolean;
  hasStarted: boolean;
  onStartClick: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  themes,
  selectedTheme,
  onSelectTheme,
  onRefreshThemes,
  isRefreshing,
  onGenerateReflection,
  isGeneratingReflection,
  hasStarted,
  onStartClick,
}) => {
  const [customTopic, setCustomTopic] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentPreset>(ENVIRONMENT_PRESETS[0]);
  const [promptCount, setPromptCount] = useState<number>(8);
  const [includeFaithEnding, setIncludeFaithEnding] = useState<boolean>(true);
  const [showConfigOptions, setShowConfigOptions] = useState<boolean>(false);
  const [speakerGender, setSpeakerGender] = useState<SpeakerGender>('male');
  
  // Custom media state (Avatar & Scenery uploads)
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | undefined>(undefined);
  const [customAvatarDescription, setCustomAvatarDescription] = useState<string>('');
  const [customEnvironmentUrl, setCustomEnvironmentUrl] = useState<string | undefined>(undefined);
  const [customEnvironmentDescription, setCustomEnvironmentDescription] = useState<string>('');
  const [showMediaUploads, setShowMediaUploads] = useState<boolean>(false);

  const handleRefresh = (e: React.FormEvent) => {
    e.preventDefault();
    onRefreshThemes(customTopic.trim() || undefined);
  };

  const handleGenerate = () => {
    if (!selectedTheme) return;
    onGenerateReflection({
      theme: selectedTheme.title,
      environment: `${selectedEnv.name} (${selectedEnv.timeOfDay})`,
      promptCount,
      includeFaithEnding,
      speakerGender,
      customAvatarUrl,
      customAvatarDescription: customAvatarDescription.trim() || undefined,
      customEnvironmentUrl,
      customEnvironmentDescription: customEnvironmentDescription.trim() || undefined,
    });
  };

  // State 1: Before clicking "Vamos começar?"
  if (!hasStarted) {
    return (
      <div className="w-full max-w-4xl mx-auto py-10 px-4 text-center">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#231912] to-[#17110c] border border-[#3e2b1d] shadow-2xl overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#c26a2c]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#3d2819] text-[#f2af74] border border-[#583922]">
              <Sparkles className="w-3.5 h-3.5" />
              Vídeos Virais de Alta Retenção Emocional
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif-roca font-bold text-[#faf3e8] tracking-tight leading-tight">
              A Sabedoria que Faz a Gente Parar o Feed
            </h2>

            <p className="text-sm sm:text-base text-[#baa999] leading-relaxed">
              O agente formula roteiros sequenciais de <strong>no mínimo 9 segundos por cena</strong> narrados com sabedoria da roça — você pode escolher entre <strong>O Velho da Roça (Homem)</strong> ou <strong>A Velha da Roça (Mulher)</strong>. Cada cena é um prompt fotorealista 9:16 pronto para Sora, Kling, Runway e Luma.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onStartClick}
                id="btn-vamos-comecar"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#c26a2c] to-[#a3521d] hover:from-[#d67634] hover:to-[#b35b21] text-white font-semibold text-base sm:text-lg transition-all shadow-xl shadow-[#c26a2c]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>"Vamos começar?"</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8c7a6a] italic">
              * Seguindo a regra do agente: ao dizer "vamos começar?", serão apresentados 5 temas de reflexão antes de gerar os prompts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Theme Selection & Configuration
  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 space-y-8">
      {/* Top Banner & Refresh Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#1c150f] border border-[#352518]">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-[#d97c36]">
            Passo 1 de 2 • Escolha do Tema
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-roca font-bold text-[#faf3e8]">
            5 Temas de Reflexão do Velho da Roça
          </h2>
          <p className="text-xs sm:text-sm text-[#a89683]">
            Escolha um dos 5 temas abaixo ou informe um assunto específico da sua preferência.
          </p>
        </div>

        {/* Custom topic input or reload 5 themes */}
        <form onSubmit={handleRefresh} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            id="input-custom-theme"
            placeholder="Inspiração (ex: ingratidão, traição, herança...)"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            className="w-full md:w-64 px-3.5 py-2 text-xs rounded-xl bg-[#140e0a] border border-[#3e2c1e] text-[#f2e7d8] placeholder-[#7d6c5d] focus:outline-none focus:border-[#c26a2c]"
          />
          <button
            type="submit"
            disabled={isRefreshing}
            id="btn-refresh-themes"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#2b1e14] hover:bg-[#3b2a1c] text-[#f0ae71] border border-[#483321] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            title="Gerar 5 novos temas com IA"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Gerando...' : 'Novos Temas'}</span>
          </button>
        </form>
      </div>

      {/* The 5 Theme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="themes-grid">
        {themes.map((theme, index) => {
          const isSelected = selectedTheme?.id === theme.id;
          return (
            <div
              key={theme.id || index}
              onClick={() => onSelectTheme(theme)}
              id={`theme-card-${theme.id}`}
              className={`group relative p-5 rounded-2xl text-left cursor-pointer transition-all duration-200 border flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-[#2e1d13] to-[#22150d] border-[#c26a2c] shadow-lg shadow-[#c26a2c]/15 ring-2 ring-[#c26a2c]/30'
                  : 'bg-[#1a130d] border-[#312216] hover:border-[#4f3624] hover:bg-[#221811]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-[#291c13] text-[#e0894a] border border-[#422c1d]">
                    {index + 1}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-[#291b12] text-[#b89474] border border-[#3b2719]">
                    {theme.category}
                  </span>
                </div>

                <h3 className="text-base font-serif-roca font-bold text-[#faf3e8] group-hover:text-[#f7c28c] transition-colors leading-snug">
                  {theme.title}
                </h3>

                <p className="mt-2 text-xs text-[#ab9b88] leading-relaxed line-clamp-3">
                  {theme.description}
                </p>

                {theme.hookPreview && (
                  <div className="mt-3 p-3 rounded-xl bg-[#140e0a] border border-[#2b1c12] space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#e08244] block">
                      Gancho Inicial Variado (~9s):
                    </span>
                    <div className="text-xs text-[#debfa6] italic flex items-start gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-[#c26a2c] shrink-0 mt-0.5" />
                      <span>"{theme.hookPreview}"</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#291d14] flex items-center justify-between text-xs">
                <span className="text-[#877565]">~9 segundos por prompt</span>
                <span className={`flex items-center gap-1 font-medium ${isSelected ? 'text-[#e08244]' : 'text-[#9c8976] group-hover:text-[#faf3e8]'}`}>
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4 text-[#e08244]" />
                      <span>Selecionado</span>
                    </>
                  ) : (
                    <span>Escolher este</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 2: Confirmation & Advanced Options */}
      {selectedTheme && (
        <div 
          id="generation-control-panel"
          className="p-6 rounded-3xl bg-[#1d150e] border border-[#422c1b] shadow-xl space-y-6 animate-in fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#312115]">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#d97c36]">
                Passo 2 de 2 • Roteiro Pronto para Gerar
              </span>
              <h3 className="text-xl font-serif-roca font-bold text-[#faf3e8] mt-0.5">
                Tema: "{selectedTheme.title}"
              </h3>
            </div>
            <button
              onClick={() => setShowConfigOptions(!showConfigOptions)}
              id="btn-toggle-config-options"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#c4b3a1] bg-[#291c13] hover:bg-[#352519] border border-[#3e2c1d] transition-colors self-start sm:self-auto"
            >
              <Sliders className="w-3.5 h-3.5 text-[#e08244]" />
              <span>{showConfigOptions ? 'Ocultar Cenário & Fé' : 'Ajustar Cenário & Fé'}</span>
            </button>
          </div>

          {/* Escolha do Personagem: Homem ou Mulher */}
          <div className="space-y-3" id="speaker-gender-selector">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#e08244] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Quem vai falar no vídeo?</span>
              </label>
              <span className="text-[11px] text-[#8c7b6c]">
                {speakerGender === 'female' ? '👵 A Velha da Roça selecionada' : '👨 O Velho da Roça selecionado'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Homem: O Velho da Roça */}
              <button
                type="button"
                onClick={() => setSpeakerGender('male')}
                id="speaker-choice-male"
                className={`text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                  speakerGender === 'male'
                    ? 'bg-gradient-to-r from-[#2f1e14] to-[#23170e] border-[#c26a2c] ring-2 ring-[#c26a2c]/40 text-[#faf3e8] shadow-md'
                    : 'bg-[#150f0a] border-[#2e1f14] text-[#a69584] hover:bg-[#1f1610] hover:border-[#3d2a1b]'
                }`}
              >
                <div className="w-14 h-14 rounded-xl bg-[#2b1b11] border border-[#482d1c] overflow-hidden shrink-0">
                  <img
                    src="/src/assets/images/velho_da_roca_portrait_1788826027975.jpg"
                    alt="O Velho da Roça"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-serif-roca font-bold text-[#faf3e8]">
                      👨 O Velho da Roça (Homem)
                    </div>
                    {speakerGender === 'male' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3d2719] border border-[#c26a2c] text-[#f2af74] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#b09e8d] mt-1 leading-snug">
                    Senhor de 80 anos, rugas profundas e chapéu de palha. Voz masculina grave, calma e experiente.
                  </p>
                </div>
              </button>

              {/* Mulher: A Velha da Roça */}
              <button
                type="button"
                onClick={() => setSpeakerGender('female')}
                id="speaker-choice-female"
                className={`text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                  speakerGender === 'female'
                    ? 'bg-gradient-to-r from-[#2f1e14] to-[#23170e] border-[#c26a2c] ring-2 ring-[#c26a2c]/40 text-[#faf3e8] shadow-md'
                    : 'bg-[#150f0a] border-[#2e1f14] text-[#a69584] hover:bg-[#1f1610] hover:border-[#3d2a1b]'
                }`}
              >
                <div className="w-14 h-14 rounded-xl bg-[#2b1b11] border border-[#482d1c] overflow-hidden shrink-0">
                  <img
                    src="/src/assets/images/velha_roca_portrait_1788827899692.jpg"
                    alt="A Velha da Roça"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-serif-roca font-bold text-[#faf3e8]">
                      👵 A Velha da Roça (Mulher)
                    </div>
                    {speakerGender === 'female' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3d2719] border border-[#c26a2c] text-[#f2af74] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#b09e8d] mt-1 leading-snug">
                    Senhora de 80 anos, rugas afetuosas e coque de cabelos brancos. Voz feminina doce e maternal.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Escolha da Quantidade de Prompts (Cenas de ~9s) */}
          <div className="space-y-3" id="prompt-count-selector">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#e08244] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Quantos prompts você quer criar?</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#debfa6] font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#e08244]" />
                  ~{promptCount * 9}s de vídeo total
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2e1f14] text-[#f2af74] border border-[#4a3220] font-bold">
                  {promptCount} {promptCount === 1 ? 'cena' : 'cenas'}
                </span>
              </div>
            </div>

            {/* Presets de Cenas */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { count: 4, label: "4 Cenas", time: "~36s", tag: "Shorts / Rápido" },
                { count: 6, label: "6 Cenas", time: "~54s", tag: "Reels / TikTok" },
                { count: 8, label: "8 Cenas", time: "~72s", tag: "Padrão Recomendado" },
                { count: 10, label: "10 Cenas", time: "~90s", tag: "Aprofundado" },
                { count: 12, label: "12 Cenas", time: "~108s", tag: "Roteiro Longo" },
              ].map((preset) => (
                <button
                  key={preset.count}
                  type="button"
                  id={`prompt-preset-${preset.count}`}
                  onClick={() => setPromptCount(preset.count)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    promptCount === preset.count
                      ? 'bg-gradient-to-b from-[#3a2417] to-[#25170f] border-[#c26a2c] ring-2 ring-[#c26a2c]/30 text-white shadow-md'
                      : 'bg-[#150f0a] border-[#2e1f14] text-[#a69584] hover:bg-[#1e150f] hover:border-[#3d291a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#faf3e8]">{preset.label}</span>
                    <span className="text-[10px] text-[#e08244] font-medium">{preset.time}</span>
                  </div>
                  <div className="text-[10px] text-[#8c7b6c] mt-0.5">{preset.tag}</div>
                </button>
              ))}
            </div>

            {/* Stepper de precisão (3 a 12 cenas) */}
            <div className="p-3 rounded-2xl bg-[#140e09] border border-[#2b1c12] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#b09e8d] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c26a2c]" />
                <span>Ou ajuste na precisão (3 a 12 prompts de no mínimo 9 segundos cada):</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="flex items-center bg-[#23170e] rounded-xl border border-[#3e2819] p-1">
                  <button
                    type="button"
                    onClick={() => setPromptCount(Math.max(3, promptCount - 1))}
                    disabled={promptCount <= 3}
                    id="btn-decrement-prompts"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d1c1af] hover:bg-[#322013] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Diminuir quantidade de prompts"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold font-mono text-[#faf3e8]">
                    {promptCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPromptCount(Math.min(12, promptCount + 1))}
                    disabled={promptCount >= 12}
                    id="btn-increment-prompts"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d1c1af] hover:bg-[#322013] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Aumentar quantidade de prompts"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] text-[#8c7b6c] whitespace-nowrap">
                  = <strong className="text-[#f5ebd9]">~{promptCount * 9}s</strong> de narração
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Fotos Próprias: Avatar & Cenário */}
          <div className="space-y-3 pt-1" id="custom-media-uploader-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#e08244] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Subir Fotos Próprias (Avatar & Cenário)</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {customAvatarUrl && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1b2b16] text-[#84c472] border border-[#2d4724] font-semibold flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Avatar Próprio Ativo
                  </span>
                )}
                {customEnvironmentUrl && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1b2b16] text-[#84c472] border border-[#2d4724] font-semibold flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Cenário Próprio Ativo
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowMediaUploads(!showMediaUploads)}
                  id="btn-toggle-media-uploads"
                  className="text-xs text-[#debfa6] hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#20150d] hover:bg-[#2b1c12] border border-[#3b2718] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#e08244]" />
                  <span>{showMediaUploads ? 'Ocultar Uploads' : (customAvatarUrl || customEnvironmentUrl ? 'Gerenciar Fotos' : 'Subir Imagens Próprias')}</span>
                  {showMediaUploads ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Quick Banner */}
            <div className="p-3.5 rounded-2xl bg-[#18110b] border border-[#312215] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#faf3e8] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#e08244]" />
                  <span>Deseja usar o seu próprio avatar e o seu próprio cenário?</span>
                </div>
                <p className="text-[11px] text-[#9c8b7c]">
                  {customAvatarUrl || customEnvironmentUrl
                    ? 'Suas imagens já estão carregadas e prontas! Elas aparecem no Simulador 9:16 e são descritas com fidelidade pela IA nos prompts de vídeo.'
                    : 'Suba fotos para dar um rosto e um cenário personalizado à reflexão (arraste ou selecione). Se não subir, os personagens e cenários clássicos da roça continuam ativos.'}
                </p>
              </div>

              {!showMediaUploads && (
                <button
                  type="button"
                  onClick={() => setShowMediaUploads(true)}
                  id="btn-open-media-uploads"
                  className="text-xs font-bold text-[#e08244] hover:text-[#ff9c5a] shrink-0 underline decoration-[#e08244]/40 hover:decoration-[#e08244] self-start sm:self-auto"
                >
                  {customAvatarUrl || customEnvironmentUrl ? 'Ver Fotos Carregadas →' : 'Subir Fotos Agora →'}
                </button>
              )}
            </div>

            {/* Upload Dropzones */}
            {showMediaUploads && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                {/* Avatar Upload Dropzone */}
                <ImageUploadDropzone
                  id="avatar-uploader"
                  label="Imagem do Próprio Avatar"
                  sublabel="Foto da pessoa, idoso ou avatar que falará no vídeo"
                  currentImageUrl={customAvatarUrl}
                  defaultImageFallbackUrl={
                    speakerGender === 'female'
                      ? '/src/assets/images/velha_roca_portrait_1788827899692.jpg'
                      : '/src/assets/images/velho_da_roca_portrait_1788826027975.jpg'
                  }
                  aspectRatioLabel="Proporção vertical 9:16 ou 1:1"
                  descriptionValue={customAvatarDescription}
                  onDescriptionChange={setCustomAvatarDescription}
                  descriptionPlaceholder="Ex: Senhor de 75 anos com chapéu de couro, camisa azul xadrez e barba branca"
                  onImageChange={setCustomAvatarUrl}
                />

                {/* Scenery Upload Dropzone */}
                <ImageUploadDropzone
                  id="environment-uploader"
                  label="Imagem do Próprio Cenário"
                  sublabel="Foto da sua varanda, fazenda, fogão a lenha ou sítio"
                  currentImageUrl={customEnvironmentUrl}
                  aspectRatioLabel="Proporção vertical 9:16 recomendada"
                  descriptionValue={customEnvironmentDescription}
                  onDescriptionChange={setCustomEnvironmentDescription}
                  descriptionPlaceholder="Ex: Varanda rústica com cerca de madeira branca e cafezal ao fundo"
                  onImageChange={setCustomEnvironmentUrl}
                />
              </div>
            )}
          </div>

          {/* Collapsible config: Ambiente e Mensagem de Fé */}
          {showConfigOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#2a1d13]">
              {/* Environment presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#debfa6] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#c26a2c]" />
                  <span>Ambiente da Roça:</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ENVIRONMENT_PRESETS.map((env) => (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setSelectedEnv(env)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                        selectedEnv.id === env.id
                          ? 'bg-[#2e1d13] border-[#c26a2c] text-[#faf3e8]'
                          : 'bg-[#150f0a] border-[#2e1f14] text-[#a69584] hover:bg-[#201710]'
                      }`}
                    >
                      <div className="font-semibold text-[#eedecb]">{env.name}</div>
                      <div className="text-[11px] text-[#8c7b6c] mt-0.5">{env.timeOfDay}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Faith ending option */}
              <div className="space-y-3 flex flex-col justify-start">
                <label className="text-xs font-semibold text-[#debfa6] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c26a2c]" />
                  <span>Mensagem de Fé & Encerramento:</span>
                </label>
                <div className="p-4 rounded-xl bg-[#150f0a] border border-[#2e1f14]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFaithEnding}
                      onChange={(e) => setIncludeFaithEnding(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-[#c26a2c] focus:ring-[#c26a2c] accent-[#c26a2c]"
                    />
                    <div>
                      <span className="text-xs font-medium text-[#eedecb] block">
                        Incluir mensagem de fé e paz em Deus na última cena
                      </span>
                      <span className="text-[11px] text-[#8c7b6c] block mt-0.5">
                        Conforme a cartilha do agente, o fechamento traz serenidade espiritual sem parecer sermão religioso ou forçado.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action to trigger full reflection generation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-[#a39281] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#79a665]" />
              <span>
                Pronto para gerar <strong>{promptCount} prompts 9:16</strong> (~{promptCount * 9}s de vídeo com {speakerGender === 'female' ? 'A Velha da Roça' : 'O Velho da Roça'})
              </span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGeneratingReflection}
              id="btn-generate-reflection"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#c26a2c] to-[#9c4c1a] hover:from-[#d67634] hover:to-[#b0551e] text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-[#c26a2c]/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
            >
              {isGeneratingReflection ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Escrevendo Roteiro {speakerGender === 'female' ? 'da Velha' : 'do Velho'} ({promptCount} cenas)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#ffd1aa]" />
                  <span>Gerar Roteiro de {promptCount} Prompts</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
