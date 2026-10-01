import React, { useState } from 'react';
import { ReflectionScript, SpeakerGender } from '../types';
import { supabase } from '../../../lib/supabase';
import { PromptCard } from './PromptCard';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import { 
  ArrowLeft, 
  Smartphone, 
  Share2, 
  Volume2, 
  VolumeX, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw,
  Layers,
  FileDown,
  User,
  Check,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ruralAudio } from '../utils/audio';

interface ReflectionStudioProps {
  script: ReflectionScript;
  onBackToThemes: () => void;
  onOpenSimulator: () => void;
  onOpenExport: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onUpdateScript?: (updatedScript: ReflectionScript) => void;
}

export const ReflectionStudio: React.FC<ReflectionStudioProps> = ({
  script,
  onBackToThemes,
  onOpenSimulator,
  onOpenExport,
  onRegenerate,
  isRegenerating,
  onUpdateScript,
}) => {
  const [isPlayingFullAudio, setIsPlayingFullAudio] = useState(false);
  const [showCustomMediaDrawer, setShowCustomMediaDrawer] = useState(false);
  const currentGender: SpeakerGender = script.speakerGender || 'male';
  const isFemale = currentGender === 'female';

  const totalSeconds = script.prompts.reduce((acc, p) => acc + (p.estimatedSeconds || 9), 0);
  const totalWords = script.prompts.reduce((acc, p) => acc + (p.spokenDialogue ? p.spokenDialogue.split(/\s+/).length : 0), 0);

  const handleUpdateScene = (updatedScene: any) => {
    if (!onUpdateScript) return;
    const newPrompts = script.prompts.map(p => p.index === updatedScene.index ? updatedScene : p);
    onUpdateScript({
      ...script,
      prompts: newPrompts,
    });
  };

  const handleToggleGender = (newGender: SpeakerGender) => {
    if (!onUpdateScript || newGender === currentGender) return;
    ruralAudio.stopSpeech();
    setIsPlayingFullAudio(false);
    onUpdateScript({
      ...script,
      speakerGender: newGender,
    });
  };

  const [isApplyingAvatar, setIsApplyingAvatar] = useState(false);

  const handleUpdateAvatar = async (newUrl: string | undefined) => {
    if (!onUpdateScript) return;
    
    if (!newUrl) {
      // Reverter para o personagem padrão mantendo consistência
      onUpdateScript({
        ...script,
        customAvatarUrl: undefined,
        customAvatarVisualProfile: undefined,
      });
      return;
    }

    try {
      setIsApplyingAvatar(true);
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const res = await fetch('/api/agents/reflexaoVelhoRoca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          action: 'apply-avatar-to-script',
          script,
          avatarUrl: newUrl,
          avatarDescription: script.customAvatarDescription,
          speakerGender: currentGender,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.script) {
          onUpdateScript(data.script);
          return;
        }
      }
    } catch (err) {
      console.warn('Falha ao aplicar avatar via API, aplicando localmente:', err);
    } finally {
      setIsApplyingAvatar(false);
    }

    onUpdateScript({
      ...script,
      customAvatarUrl: newUrl,
    });
  };

  const handleUpdateEnvironment = (newUrl: string | undefined) => {
    if (!onUpdateScript) return;
    onUpdateScript({
      ...script,
      customEnvironmentUrl: newUrl,
    });
  };

  const handleToggleFullAudio = () => {
    if (isPlayingFullAudio) {
      ruralAudio.stopSpeech();
      setIsPlayingFullAudio(false);
    } else {
      setIsPlayingFullAudio(true);
      playSequenceAudio(0);
    }
  };

  const playSequenceAudio = (index: number) => {
    if (index >= script.prompts.length) {
      setIsPlayingFullAudio(false);
      return;
    }
    const scene = script.prompts[index];
    ruralAudio.speakPortuguese(
      scene.spokenDialogue,
      () => {},
      () => {
        // slight pause before next scene
        setTimeout(() => {
          playSequenceAudio(index + 1);
        }, 600);
      },
      currentGender
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 space-y-8 animate-in fade-in">
      {/* Studio Navigation & Overview Header */}
      <div className="p-6 rounded-3xl bg-[#1d150e] border border-[#3e2b1d] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={onBackToThemes}
            id="btn-back-to-themes"
            className="flex items-center gap-2 text-xs font-semibold text-[#bfa995] hover:text-[#faf3e8] transition-colors self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos 5 Temas</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Listen whole sequence */}
            <button
              onClick={handleToggleFullAudio}
              id="btn-play-full-narration"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isPlayingFullAudio
                  ? 'bg-[#3b2718] text-[#f7c28c] border-[#c26a2c] animate-pulse'
                  : 'bg-[#241810] text-[#debfa6] border-[#3e2c1d] hover:bg-[#302116]'
              }`}
            >
              {isPlayingFullAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-[#e08244]" />
                  <span>Pausar Áudio Sequencial</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-[#e08244]" />
                  <span>Ouvir Sequência Completa</span>
                </>
              )}
            </button>

            {/* Test in 9:16 simulator */}
            <button
              onClick={onOpenSimulator}
              id="btn-open-simulator"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2c1e13] hover:bg-[#3b291a] text-[#faf3e8] border border-[#483321] transition-colors shadow-sm"
            >
              <Smartphone className="w-4 h-4 text-[#e08244]" />
              <span>Simulador 9:16</span>
            </button>

            {/* Export modal */}
            <button
              onClick={onOpenExport}
              id="btn-open-export"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#c26a2c] hover:bg-[#d67634] text-white transition-colors shadow-md"
            >
              <FileDown className="w-4 h-4" />
              <span>Copiar / Exportar Tudo</span>
            </button>
          </div>
        </div>

        {/* Script Title & Metadata */}
        <div className="pt-2 border-t border-[#2e2015] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2b1b11] text-[#e0894a] border border-[#462c1b]">
                Roteiro Aprovado
              </span>
              <span className="text-xs text-[#9f8e7c]">
                {script.environment}
              </span>
            </div>

            {/* Character Selector Pill in Studio */}
            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
              <div className="flex items-center gap-1.5 p-1 bg-[#140e09] rounded-xl border border-[#312115]">
                <span className="text-[11px] font-medium text-[#8d7c6b] px-2 flex items-center gap-1">
                  <User className="w-3 h-3 text-[#c26a2c]" /> Voz:
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleGender('male')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    !isFemale
                      ? 'bg-[#c26a2c] text-white shadow-sm'
                      : 'text-[#a69584] hover:text-[#eee0ce]'
                  }`}
                >
                  <span>👨 O Velho</span>
                  {!isFemale && <Check className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleGender('female')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isFemale
                      ? 'bg-[#c26a2c] text-white shadow-sm'
                      : 'text-[#a69584] hover:text-[#eee0ce]'
                  }`}
                >
                  <span>👵 A Velha</span>
                  {isFemale && <Check className="w-3 h-3" />}
                </button>
              </div>

              {/* Botão de Fotos Personalizadas */}
              <button
                type="button"
                onClick={() => setShowCustomMediaDrawer(!showCustomMediaDrawer)}
                id="btn-toggle-studio-media"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  showCustomMediaDrawer
                    ? 'bg-[#3d2719] text-[#f2af74] border-[#c26a2c]'
                    : script.customAvatarUrl || script.customEnvironmentUrl
                    ? 'bg-[#1b2b16] text-[#84c472] border-[#2d4724] hover:bg-[#253d1f]'
                    : 'bg-[#18100a] text-[#b09e8d] border-[#312115] hover:bg-[#251910] hover:text-[#faf3e8]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#e08244]" />
                <span>
                  {script.customAvatarUrl && script.customEnvironmentUrl
                    ? 'Avatar & Cenário Próprios'
                    : script.customAvatarUrl
                    ? 'Avatar Próprio Ativo'
                    : script.customEnvironmentUrl
                    ? 'Cenário Próprio Ativo'
                    : 'Subir Fotos'}
                </span>
                {showCustomMediaDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Drawer de Upload e Gerenciamento de Fotos no Estúdio */}
          {showCustomMediaDrawer && (
            <div className="p-4 rounded-2xl bg-[#140e09] border border-[#382619] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#faf3e8] flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#e08244]" />
                    <span>Gerenciar Imagens do Roteiro (Avatar & Cenário)</span>
                  </h4>
                  <p className="text-[11px] text-[#8c7b6c]">
                    As fotos enviadas são imediatamente atualizadas no estúdio e no Simulador 9:16.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomMediaDrawer(false)}
                  className="text-xs text-[#b09e8d] hover:text-white px-2 py-1"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUploadDropzone
                  id="studio-avatar-uploader"
                  label="Imagem do Próprio Avatar"
                  sublabel="Suba a foto do seu personagem para o vídeo"
                  currentImageUrl={script.customAvatarUrl}
                  defaultImageFallbackUrl={
                    isFemale
                      ? '/src/assets/images/velha_roca_portrait_1788827899692.jpg'
                      : '/src/assets/images/velho_da_roca_portrait_1788826027975.jpg'
                  }
                  onImageChange={handleUpdateAvatar}
                />

                <ImageUploadDropzone
                  id="studio-environment-uploader"
                  label="Imagem do Próprio Cenário"
                  sublabel="Suba a foto do seu sítio, varanda ou local"
                  currentImageUrl={script.customEnvironmentUrl}
                  onImageChange={handleUpdateEnvironment}
                />
              </div>
            </div>
          )}

          <div className="flex items-start gap-4">
            {/* Character Avatar Box */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#28190f] border-2 border-[#4a3220] overflow-hidden shrink-0 shadow-lg">
              <img
                src={
                  script.customAvatarUrl ||
                  (isFemale
                    ? '/src/assets/images/velha_roca_portrait_1788827899692.jpg'
                    : '/src/assets/images/velho_da_roca_portrait_1788826027975.jpg')
                }
                alt={script.customAvatarUrl ? 'Avatar Personalizado' : (isFemale ? 'Velha da Roça' : 'Velho da Roça')}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {script.customAvatarUrl && (
                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-bold text-[#84c472] text-center py-0.5 tracking-tighter uppercase">
                  Próprio
                </span>
              )}
            </div>

            {/* Custom Scenery Mini-Box (if uploaded) */}
            {script.customEnvironmentUrl && (
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#28190f] border-2 border-[#2d4724] overflow-hidden shrink-0 shadow-lg">
                <img
                  src={script.customEnvironmentUrl}
                  alt="Cenário Personalizado"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-bold text-[#84c472] text-center py-0.5 tracking-tighter uppercase">
                  Cenário
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[#e08244]">
                  {script.customAvatarUrl
                    ? 'Avatar Personalizado'
                    : isFemale
                    ? 'A Velha da Roça • Senhora de 80 anos'
                    : 'O Velho da Roça • Senhor de 80 anos'}
                </span>
                <span className="text-[11px] text-[#78695c]">
                  ({isFemale ? 'Voz feminina doce e maternal' : 'Voz masculina grave e reflexiva'})
                </span>
                {script.customEnvironmentUrl && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#1b2b16] text-[#84c472] border border-[#2d4724]">
                    Cenário Próprio Ativo
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif-roca font-bold text-[#faf3e8] tracking-tight leading-snug mt-0.5">
                "{script.title}"
              </h2>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-xs text-[#b8a796] pt-1 border-t border-[#2a1d13]">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#e08244]" />
              <span><strong>{script.prompts.length}</strong> Cenas (Prompts)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#79a665]" />
              <span><strong>~{totalSeconds} segundos</strong> de vídeo (~{Math.round(totalSeconds / 60 * 10) / 10} min)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#e08244]" />
              <span><strong>{totalWords}</strong> palavras faladas</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#debfa6]">
              <ShieldCheck className="w-4 h-4 text-[#79a665]" />
              <span>Regra dos 9s (no mínimo) & UGC 9:16 Aplicada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Continuity Guarantee Notice Card */}
      <div className="p-4 rounded-2xl bg-[#17110c] border border-[#2d1e14] text-xs text-[#a39281] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#271910] text-[#e08244] flex items-center justify-center shrink-0 border border-[#3e2819] mt-0.5 sm:mt-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="leading-relaxed">
            {script.customAvatarUrl || script.customAvatarVisualProfile ? (
              <>
                <strong className="text-[#84c472]">Avatar Próprio Travado & Textura de Pessoa Real:</strong> Todas as cenas (do Prompt 1 ao {script.prompts.length}) mantêm rigorosamente o mesmo avatar com as mesmas características físicas exatas e fotorrealismo de pele humana autêntica (micro-poros visíveis, rugas orgânicas, translucidez dérmica e olhos com reflexo real da luz — zero plástico ou 3D CGI).
              </>
            ) : (
              <>
                <strong className="text-[#f5ebd9]">Continuidade Rígida:</strong> Todas as cenas descrevem detalhadamente {isFemale ? 'a mesma senhora de 80 anos com rugas afetuosas, cabelos em coque e vestido de algodão floral desbotado' : 'o mesmo senhor de 80 anos com rugas naturais, pele marcada pelo sol com micro-poros reais, chapéu de palha e camisa gasta de trabalhador rural'}, variando apenas enquadramento e sutis gestos humanos.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {isApplyingAvatar && (
            <span className="text-[11px] text-[#e08244] flex items-center gap-1 font-medium animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" /> Aplicando em todos os prompts...
            </span>
          )}
          <button
            onClick={onRegenerate}
            disabled={isRegenerating || isApplyingAvatar}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#241910] hover:bg-[#322216] text-[#debfa6] border border-[#392617] transition-colors whitespace-nowrap disabled:opacity-50"
            title="Regerar reflexão com novas variações"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Regerando...' : 'Regerar Roteiro'}</span>
          </button>
        </div>
      </div>

      {/* List of Individual Prompts */}
      <div className="space-y-5" id="prompts-list">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif-roca font-bold text-[#faf3e8]">
            Blocos Individuais de Prompts (Copie Separadamente)
          </h3>
          <span className="text-xs text-[#8c7b6c]">
            Pronto para Sora, Kling, Runway, Luma e Minimax
          </span>
        </div>

        {script.prompts.map((scene) => (
          <PromptCard
            key={scene.index}
            scene={scene}
            totalScenes={script.prompts.length}
            themeTitle={script.title}
            speakerGender={currentGender}
            onUpdateScene={handleUpdateScene}
          />
        ))}
      </div>

      {/* Bottom Floating/Sticky Action Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#24170f] via-[#1d130c] to-[#24170f] border border-[#422c1b] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 className="text-base font-serif-roca font-bold text-[#faf3e8]">
            {isFemale ? 'Gostou deste roteiro da Velha da Roça?' : 'Gostou deste roteiro do Velho da Roça?'}
          </h4>
          <p className="text-xs text-[#ab9b88] mt-0.5">
            Você pode copiar todos os prompts de uma só vez ou testar um novo tema agora mesmo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToThemes}
            className="px-4 py-2.5 rounded-xl bg-[#2b1d13] hover:bg-[#38271a] text-[#debfa6] border border-[#442f1f] text-xs font-semibold transition-colors"
          >
            Outro Tema
          </button>
          <button
            onClick={onOpenExport}
            className="px-5 py-2.5 rounded-xl bg-[#c26a2c] hover:bg-[#d67634] text-white text-xs font-bold transition-all shadow-md"
          >
            Copiar Todos os Prompts
          </button>
        </div>
      </div>
    </div>
  );
};
