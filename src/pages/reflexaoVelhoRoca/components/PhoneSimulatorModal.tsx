import React, { useState, useEffect, useRef } from 'react';
import { ReflectionScript } from '../types';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight,
  Info
} from 'lucide-react';
import { ruralAudio } from '../utils/audio';

interface PhoneSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: ReflectionScript;
}

export const PhoneSimulatorModal: React.FC<PhoneSimulatorModalProps> = ({
  isOpen,
  onClose,
  script,
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 to 100
  const [ambientActive, setAmbientActive] = useState(true);
  const [showSubtitlesForPreview, setShowSubtitlesForPreview] = useState(true);

  const timerRef = useRef<number | null>(null);
  const currentScene = script.prompts[currentSceneIndex] || script.prompts[0];

  useEffect(() => {
    if (!isOpen) {
      handleStop();
    }
  }, [isOpen]);

  const handleStop = () => {
    setIsPlaying(false);
    ruralAudio.stopSpeech();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSceneProgress(0);
  };

  const handlePlayScene = (index: number) => {
    if (!script.prompts[index]) return;
    setCurrentSceneIndex(index);
    setIsPlaying(true);
    setSceneProgress(0);

    if (ambientActive && !ruralAudio.getIsAmbientPlaying()) {
      ruralAudio.startAmbient();
    }

    const scene = script.prompts[index];
    const durationSeconds = scene.estimatedSeconds || 9;
    const intervalMs = 100;
    const stepIncrement = (intervalMs / (durationSeconds * 1000)) * 100;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setSceneProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current!);
          // Next scene
          if (index + 1 < script.prompts.length) {
            handlePlayScene(index + 1);
          } else {
            setIsPlaying(false);
          }
          return 100;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    ruralAudio.speakPortuguese(
      scene.spokenDialogue,
      () => {},
      () => {
        // Speech ended naturally
      },
      script.speakerGender || 'male'
    );
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      handleStop();
    } else {
      handlePlayScene(currentSceneIndex);
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      handlePlayScene(currentSceneIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSceneIndex < script.prompts.length - 1) {
      handlePlayScene(currentSceneIndex + 1);
    }
  };

  const handleReset = () => {
    handleStop();
    setCurrentSceneIndex(0);
    setSceneProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div 
        id="phone-simulator-modal"
        className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-[#18120c] border border-[#3e2c1d] rounded-3xl p-4 sm:p-6 text-[#faf3e8] shadow-2xl flex flex-col items-center"
      >
        {/* Modal Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-[#302115]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#e08244]">
                Simulador Vertical 9:16
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2e1f14] border border-[#482f1e] text-[#f2af74] font-medium">
                {script.customAvatarUrl ? '👤 Avatar Personalizado' : (script.speakerGender === 'female' ? '👵 A Velha da Roça' : '👨 O Velho da Roça')}
              </span>
              {script.customEnvironmentUrl && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1c2e17] border border-[#2f4f27] text-[#87c475] font-medium">
                  🏞️ Cenário Próprio
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-serif-roca font-bold text-[#faf3e8] mt-0.5">
              {script.title}
            </h3>
          </div>
          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            id="btn-close-simulator"
            className="p-2 rounded-xl text-[#9f8d7b] hover:text-white hover:bg-[#2e1f14] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="w-full mt-4 flex flex-col lg:flex-row items-center justify-center gap-6">
          {/* Phone Frame (9:16 Aspect Ratio) */}
          <div className="relative w-[300px] sm:w-[330px] h-[580px] sm:h-[630px] bg-black rounded-[42px] border-[8px] border-[#2c1f15] shadow-2xl overflow-hidden flex flex-col justify-between shrink-0 ring-1 ring-[#5c4028]/50">
            {/* Phone Notch / Speaker */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#2c1f15] rounded-full z-30 flex items-center justify-center">
              <div className="w-10 h-1 bg-[#1a120b] rounded-full" />
            </div>

            {/* Background Video/Photo Mockup */}
            <div className="absolute inset-0 z-10 overflow-hidden">
              {script.customEnvironmentUrl && script.customAvatarUrl ? (
                <>
                  {/* Cenário como plano de fundo vertical */}
                  <img
                    src={script.customEnvironmentUrl}
                    alt="Cenário Personalizado"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-7000 ease-linear ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

                  {/* Avatar sobreposto em moldura elegante de retrato falante */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-2 pb-12">
                    <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full overflow-hidden border-2 border-[#e08244] shadow-2xl ring-4 ring-black/60">
                      <img
                        src={script.customAvatarUrl}
                        alt="Avatar Personalizado"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </>
              ) : script.customEnvironmentUrl ? (
                <>
                  {/* Cenário com avatar padrão posicionado */}
                  <img
                    src={script.customEnvironmentUrl}
                    alt="Cenário Personalizado"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-7000 ease-linear ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-2 pb-12">
                    <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full overflow-hidden border-2 border-[#c26a2c] shadow-2xl ring-4 ring-black/60">
                      <img
                        src={
                          script.speakerGender === 'female'
                            ? '/src/assets/images/velha_roca_portrait_1788827899692.jpg'
                            : '/src/assets/images/velho_da_roca_portrait_1788826027975.jpg'
                        }
                        alt={script.speakerGender === 'female' ? 'Velha da Roça' : 'Velho da Roça'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Foto única em tela cheia (avatar próprio ou padrão) */}
                  <img
                    src={
                      script.customAvatarUrl ||
                      (script.speakerGender === 'female'
                        ? '/src/assets/images/velha_roca_portrait_1788827899692.jpg'
                        : '/src/assets/images/velho_da_roca_portrait_1788826027975.jpg')
                    }
                    alt={script.customAvatarUrl ? 'Avatar Personalizado' : (script.speakerGender === 'female' ? 'Velha da Roça' : 'Velho da Roça')}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-7000 ease-linear ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                </>
              )}
            </div>

            {/* Top Multi-Story Progress Bars */}
            <div className="relative z-20 pt-8 px-3 flex items-center gap-1.5">
              {script.prompts.map((p, idx) => (
                <div key={idx} className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#f5ebd9] transition-all"
                    style={{
                      width:
                        idx < currentSceneIndex
                          ? '100%'
                          : idx === currentSceneIndex
                          ? `${sceneProgress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* In-Preview Floating Subtitles (Optional toggle for creator review) */}
            <div className="relative z-20 px-4 pb-6 space-y-3">
              {showSubtitlesForPreview && (
                <div className="p-3 rounded-xl bg-black/65 backdrop-blur-sm border border-white/10 text-center animate-in fade-in">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#e08244] block mb-1">
                    {currentScene?.stageName || `Cena ${currentSceneIndex + 1}`} (~9s)
                  </span>
                  <p className="text-sm sm:text-base font-serif-roca text-white leading-relaxed italic drop-shadow-md">
                    "{currentScene?.spokenDialogue}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-white/70 px-1">
                <span>Cena {currentSceneIndex + 1} de {script.prompts.length}</span>
                <span>TikTok / Reels 9:16</span>
              </div>
            </div>
          </div>

          {/* Controls & Scene Details Panel */}
          <div className="flex-1 w-full max-w-md space-y-4 text-xs sm:text-sm">
            {/* Playback Controls */}
            <div className="p-4 rounded-2xl bg-[#201710] border border-[#392618] space-y-3">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentSceneIndex === 0}
                  className="p-2.5 rounded-xl bg-[#2c1f15] hover:bg-[#3d2c1e] text-[#faf3e8] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Cena Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlayPause}
                  id="btn-phone-play-pause"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#c26a2c] hover:bg-[#d67634] text-white font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-[#c26a2c]/20"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>{sceneProgress > 0 ? 'Continuar' : 'Reproduzir'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentSceneIndex === script.prompts.length - 1}
                  className="p-2.5 rounded-xl bg-[#2c1f15] hover:bg-[#3d2c1e] text-[#faf3e8] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Próxima Cena"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-xl bg-[#2c1f15] hover:bg-[#3d2c1e] text-[#ab9b88] hover:text-[#faf3e8] transition-colors"
                  title="Reiniciar do Início"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-[#312115] flex items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 text-[#c4b3a1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSubtitlesForPreview}
                    onChange={(e) => setShowSubtitlesForPreview(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#c26a2c] accent-[#c26a2c]"
                  />
                  <span>Legenda no Simulador</span>
                </label>

                <button
                  onClick={() => {
                    if (ambientActive) {
                      ruralAudio.stopAmbient();
                      setAmbientActive(false);
                    } else {
                      ruralAudio.startAmbient();
                      setAmbientActive(true);
                    }
                  }}
                  className="flex items-center gap-1 text-[#ab9b88] hover:text-[#e08244]"
                >
                  {ambientActive ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#e08244]" />
                      <span>Som Roça Ligado</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Sem Som Ambiente</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Current Scene Details */}
            <div className="p-4 rounded-2xl bg-[#1d150e] border border-[#352417] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#e08244] font-semibold">
                <span>{currentScene?.stageName}</span>
                <span>~{currentScene?.estimatedSeconds || 9}s de fala</span>
              </div>
              <p className="text-sm font-serif-roca text-[#f4eee4] italic">
                "{currentScene?.spokenDialogue}"
              </p>
              <div className="pt-2 text-xs text-[#9f8e7c] space-y-1">
                <div><strong>Ação:</strong> {currentScene?.characterAction}</div>
                <div><strong>Câmera:</strong> {currentScene?.cameraAngle}</div>
              </div>
            </div>

            {/* Note about video generation */}
            <div className="p-3 rounded-xl bg-[#23180f] border border-[#3d2a1b] text-xs text-[#ab9a88] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#e08244] shrink-0 mt-0.5" />
              <span>
                <strong>Regra do Agente:</strong> No vídeo gerado final por IA (Sora/Kling/Runway), nunca insira legendas ou textos na tela. O texto exibido aqui é apenas para você conferir a cadência e o tempo das falas.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
