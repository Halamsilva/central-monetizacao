import React, { useState } from 'react';
import { PromptScene, SpeakerGender } from '../types';
import { supabase } from '../../../lib/supabase';
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Clock, 
  Video, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  User,
  Shuffle,
  Wand2,
  CheckCircle2,
  RefreshCw,
  Edit3,
  AlertTriangle,
  Scissors,
  Link2,
  CornerDownRight
} from 'lucide-react';
import { ruralAudio } from '../utils/audio';

interface PromptCardProps {
  scene: PromptScene;
  totalScenes: number;
  themeTitle?: string;
  speakerGender?: SpeakerGender;
  onUpdateScene?: (updatedScene: PromptScene) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ 
  scene, 
  totalScenes, 
  themeTitle = '',
  speakerGender = 'male',
  onUpdateScene 
}) => {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedSpeech, setCopiedSpeech] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showHookSelector, setShowHookSelector] = useState(false);
  const [isLoadingMoreHooks, setIsLoadingMoreHooks] = useState(false);
  const [isEditingSpeech, setIsEditingSpeech] = useState(false);
  const [editedSpeech, setEditedSpeech] = useState(scene.spokenDialogue);

  const wordCount = scene.spokenDialogue ? scene.spokenDialogue.trim().split(/\s+/).filter(Boolean).length : 0;
  const isSpeechTooLong = wordCount > 17;

  // Default varied hook pool if scene didn't come with one
  const availableHooks = scene.alternativeHooks && scene.alternativeHooks.length > 0
    ? scene.alternativeHooks
    : [
        {
          style: "Choque de Realidade",
          text: "Quem fez inferno na sua vida hoje, amanhã vai beber da própria fumaça que acendeu."
        },
        {
          style: "Metáfora da Roça",
          text: "Árvore que dá fruto bom no terreiro é a que mais leva pedrada de quem não planta."
        },
        {
          style: "Pergunta Direta",
          text: "Você já reparou como o silêncio às vezes machuca a alma muito mais do que bofetada?"
        },
        {
          style: "Sabedoria de Raiz",
          text: speakerGender === 'female' 
            ? "Minha finada mãe já me dizia: nunca confunda quem te aplaude com quem segura sua mão."
            : "Meu finado pai me ensinou na lida: paciência de homem trabalhador nunca é fraqueza."
        },
        {
          style: "Verdade Crua",
          text: "O caixão não tem gaveta e a terra nunca cobrou um tostão de ninguém nessa vida."
        },
        {
          style: "Alerta de Caráter",
          text: "Cobra não avisa o bote; aprenda a desconfiar de quem só te cerca de agrado falso."
        }
      ];

  const calculateSeconds = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.min(9, Math.max(5, Math.round(words / 2.0)));
  };

  const handleSelectHook = (hookText: string, hookStyleName: string) => {
    if (!onUpdateScene) return;
    const estSec = calculateSeconds(hookText);

    // Recalculate formatted prompt with the new spoken dialogue
    const newFormatted = `${scene.visualPrompt}

Spoken dialogue in Brazilian Portuguese:
"${hookText}"

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`;

    onUpdateScene({
      ...scene,
      spokenDialogue: hookText,
      hookStyle: hookStyleName,
      fullFormattedPrompt: newFormatted,
      estimatedSeconds: estSec,
    });
  };

  const handleSaveEditedSpeech = () => {
    if (!onUpdateScene) return;
    const trimmed = editedSpeech.trim();
    if (!trimmed) return;

    const estSec = calculateSeconds(trimmed);
    const newFormatted = `${scene.visualPrompt}

Spoken dialogue in Brazilian Portuguese:
"${trimmed}"

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`;

    onUpdateScene({
      ...scene,
      spokenDialogue: trimmed,
      fullFormattedPrompt: newFormatted,
      estimatedSeconds: estSec,
    });
    setIsEditingSpeech(false);
  };

  const handleAutoTrimSpeech = () => {
    if (!onUpdateScene) return;
    const words = scene.spokenDialogue.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 16) return;
    let trimmed = words.slice(0, 16).join(" ").replace(/[,;:\-\s]+$/, "");
    if (!/[.!?]$/.test(trimmed)) trimmed += ".";

    const estSec = calculateSeconds(trimmed);
    const newFormatted = `${scene.visualPrompt}

Spoken dialogue in Brazilian Portuguese:
"${trimmed}"

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`;

    onUpdateScene({
      ...scene,
      spokenDialogue: trimmed,
      fullFormattedPrompt: newFormatted,
      estimatedSeconds: estSec,
    });
    setEditedSpeech(trimmed);
  };

  const handleFetchMoreHooks = async () => {
    setIsLoadingMoreHooks(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const response = await fetch('/api/agents/reflexaoVelhoRoca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          action: 'generate-alternative-hooks',
          theme: themeTitle,
          currentHook: scene.spokenDialogue,
          speakerGender: speakerGender,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.alternativeHooks && Array.isArray(data.alternativeHooks)) {
          if (onUpdateScene) {
            onUpdateScene({
              ...scene,
              alternativeHooks: data.alternativeHooks,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao gerar ganchos sob demanda:', err);
    } finally {
      setIsLoadingMoreHooks(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'full' | 'speech') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'full') {
        setCopiedFull(true);
        setTimeout(() => setCopiedFull(false), 2200);
      } else {
        setCopiedSpeech(true);
        setTimeout(() => setCopiedSpeech(false), 2200);
      }
    } catch {
      // Fallback
    }
  };

  const handleToggleVoice = () => {
    if (isPlayingAudio) {
      ruralAudio.stopSpeech();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      ruralAudio.speakPortuguese(
        scene.spokenDialogue,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        speakerGender === 'female' ? 'female' : 'male'
      );
    }
  };

  const isHookScene = scene.index === 1;

  return (
    <div 
      id={`prompt-scene-card-${scene.index}`}
      className={`p-5 sm:p-6 rounded-2xl bg-[#1a130e] border transition-all shadow-md space-y-4 ${
        isHookScene ? 'border-[#54351d] ring-1 ring-[#c26a2c]/20' : 'border-[#362518] hover:border-[#4d3623]'
      }`}
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#2a1d14]">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-[#291b12] text-[#e0894a] border border-[#442c1c]">
            {scene.index}
          </span>
          <h4 className="text-base sm:text-lg font-serif-roca font-bold text-[#faf3e8]">
            {scene.stageName || `Prompt ${scene.index}`}
          </h4>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-[#241a12] text-[#c9956d] border border-[#3b291c]">
            Cena {scene.index} de {totalScenes}
          </span>
          {isHookScene && scene.hookStyle && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-[#362013] text-[#f5a769] border border-[#52331f] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#f5a769]" />
              Estilo: {scene.hookStyle}
            </span>
          )}
        </div>

        {/* Duration & Word count verification badge + Hook switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isHookScene && onUpdateScene && (
            <button
              onClick={() => setShowHookSelector(!showHookSelector)}
              id="btn-toggle-hook-selector"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#2c1b11] hover:bg-[#3c2518] text-[#f2a265] border border-[#5a361e] transition-colors"
              title="Trocar por outro modelo ou estilo de gancho variado"
            >
              <Shuffle className="w-3 h-3 text-[#f2a265]" />
              <span>Variar Gancho ({availableHooks.length})</span>
            </button>
          )}

          {isSpeechTooLong && onUpdateScene && (
            <button
              onClick={handleAutoTrimSpeech}
              id={`btn-auto-trim-${scene.index}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-[#3d1c10] hover:bg-[#522515] text-[#fca582] border border-[#6b2e1a] transition-colors animate-pulse"
              title="Encurtar automaticamente para ficar abaixo de 9 segundos (máx 16 palavras)"
            >
              <Scissors className="w-3 h-3 text-[#fca582]" />
              <span>Encurtar p/ ≤9s</span>
            </button>
          )}

          <span 
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
              isSpeechTooLong
                ? 'bg-[#2a140d] text-[#e87a5d] border-[#5e2715]'
                : 'bg-[#182412] text-[#86cc72] border-[#2c471f]'
            }`}
            title={isSpeechTooLong ? "Aviso: a fala pode ultrapassar 9 segundos" : "Duração ideal calculada para fala natural da roça (máximo 8 a 9 segundos)"}
          >
            {isSpeechTooLong ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[#e87a5d]" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-[#86cc72]" />
            )}
            <span>~{scene.estimatedSeconds || 8}s ({wordCount} palavras {isSpeechTooLong ? '• >9s' : '• ≤9s'})</span>
          </span>
        </div>
      </div>

      {/* Interactive Hook Variety Drawer for Scene 1 */}
      {isHookScene && showHookSelector && (
        <div className="p-4 rounded-xl bg-[#21160e] border border-[#4d321d] space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#f0ae71]">
              <Wand2 className="w-4 h-4 text-[#e08244]" />
              <span>Escolha um Gancho Alternativo (Sem Fórmulas Repetidas):</span>
            </div>
            <button
              onClick={handleFetchMoreHooks}
              disabled={isLoadingMoreHooks}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#170e09] hover:bg-[#2e1c12] text-[#d49767] border border-[#3d2616] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingMoreHooks ? 'animate-spin' : ''}`} />
              <span>{isLoadingMoreHooks ? 'Gerando...' : 'Gerar Novos Ganchos IA'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {availableHooks.map((h, i) => {
              const isCurrent = scene.spokenDialogue === h.text;
              return (
                <div
                  key={i}
                  onClick={() => handleSelectHook(h.text, h.style)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-[#311f14] border-[#c26a2c] ring-1 ring-[#c26a2c]/40 text-[#faf3e8]'
                      : 'bg-[#180f0a] border-[#332216] hover:border-[#523623] hover:bg-[#22150e] text-[#cfbeae]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#291a10] text-[#e08244] border border-[#442a1a]">
                      {h.style}
                    </span>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[11px] text-[#79a665] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ativo</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-serif-roca italic leading-relaxed">
                    "{h.text}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Narrative Continuity Connector */}
      {scene.narrativeConnector && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a120b] border border-[#382618] text-[11px] text-[#c9956d]">
          {scene.index === 1 ? (
            <Link2 className="w-3.5 h-3.5 text-[#e08244] shrink-0" />
          ) : (
            <CornerDownRight className="w-3.5 h-3.5 text-[#e08244] shrink-0" />
          )}
          <span className="text-[#8e7b6d] font-medium">
            {scene.index === 1 ? 'Ponto de Partida:' : `Conexão com Prompt ${scene.index - 1}:`}
          </span>
          <span className="text-[#f5d9bc] italic font-serif-roca">{scene.narrativeConnector}</span>
        </div>
      )}

      {/* Main Feature: Spoken Dialogue Block */}
      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#24170f] to-[#1c120b] border-l-4 border-l-[#c26a2c] border-y border-r border-[#382618]">
        <div className="flex items-center justify-between text-xs text-[#debfa6] mb-1.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#e08244]">
              Fala {speakerGender === 'female' ? 'da Velha' : 'do Velho'} da Roça (~{scene.estimatedSeconds || 8}s):
            </span>
            {onUpdateScene && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingSpeech(!isEditingSpeech);
                  setEditedSpeech(scene.spokenDialogue);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[#a69485] hover:text-[#f7ede1] hover:bg-[#332014] transition-colors"
                title="Editar fala manualmente"
              >
                <Edit3 className="w-3 h-3 text-[#d48c59]" />
                <span>{isEditingSpeech ? 'Cancelar' : 'Editar'}</span>
              </button>
            )}
          </div>

          <button
            onClick={handleToggleVoice}
            id={`btn-play-voice-${scene.index}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isPlayingAudio
                ? 'bg-[#3d2717] text-[#f7c28c] border-[#c26a2c] animate-pulse'
                : 'bg-[#1e140d] text-[#b8a695] border-[#382518] hover:text-[#faf3e8] hover:bg-[#2b1c12]'
            }`}
            title="Ouvir simulação de voz em português com cadência calma"
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#e08244]" />
                <span>Pausar Voz</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#e08244]" />
                <span>Ouvir Fala</span>
              </>
            )}
          </button>
        </div>

        {isEditingSpeech ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editedSpeech}
              onChange={(e) => setEditedSpeech(e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-lg bg-[#140c07] border border-[#4a2f1c] text-[#f7ede1] text-sm font-serif-roca italic focus:outline-none focus:border-[#c26a2c] leading-relaxed resize-y"
              placeholder="Digite a fala (mantenha entre 12 e 17 palavras para ficar sob 9 segundos)..."
            />
            <div className="flex items-center justify-between text-xs text-[#a69485]">
              <span className={editedSpeech.trim().split(/\s+/).filter(Boolean).length > 17 ? 'text-[#e87a5d] font-semibold' : 'text-[#86cc72]'}>
                {editedSpeech.trim().split(/\s+/).filter(Boolean).length} palavras (~{calculateSeconds(editedSpeech)}s • limite: 17 palavras / 9s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSpeech(false)}
                  className="px-2.5 py-1 rounded bg-[#1e140d] hover:bg-[#2b1d14] text-[#a69485] hover:text-[#f7ede1]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedSpeech}
                  className="px-3 py-1 rounded bg-[#c26a2c] hover:bg-[#d97c38] text-white font-medium shadow-sm transition-colors"
                >
                  Salvar Fala
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-base sm:text-lg font-serif-roca italic text-[#f7ede1] leading-relaxed">
            "{scene.spokenDialogue}"
          </p>
        )}
      </div>

      {/* Camera & Action Quick Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-[#140e0a] border border-[#2b1c12] flex items-start gap-2">
          <Video className="w-3.5 h-3.5 text-[#e08244] shrink-0 mt-0.5" />
          <div>
            <span className="text-[#8c7a6a] font-medium block text-[11px]">Enquadramento & Câmera:</span>
            <span className="text-[#ded1c2]">{scene.cameraAngle || 'Vertical 9:16 smartphone documental 4K'}</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#140e0a] border border-[#2b1c12] flex items-start gap-2">
          <User className="w-3.5 h-3.5 text-[#e08244] shrink-0 mt-0.5" />
          <div>
            <span className="text-[#8c7a6a] font-medium block text-[11px]">Ação & Expressão:</span>
            <span className="text-[#ded1c2]">{scene.characterAction || 'Olhar profundo e sereno para a câmera'}</span>
          </div>
        </div>
      </div>

      {/* Toggle Full Visual Prompt Details */}
      <div>
        <button
          type="button"
          onClick={() => setShowFullDetails(!showFullDetails)}
          className="flex items-center gap-1.5 text-xs text-[#a89683] hover:text-[#debfa6] transition-colors py-1"
        >
          {showFullDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showFullDetails ? 'Ocultar descrição visual detalhada' : 'Ver prompt visual completo independente'}</span>
        </button>

        {showFullDetails && (
          <div className="mt-2.5 p-3.5 rounded-xl bg-[#120c08] border border-[#26180f] text-xs text-[#b8a695] leading-relaxed font-mono space-y-2 animate-in fade-in">
            <div className="text-[11px] text-[#e08244] font-sans font-semibold">
              Descrição Visual Completa (Auto-Contida):
            </div>
            <p className="whitespace-pre-wrap">{scene.visualPrompt}</p>
          </div>
        )}
      </div>

      {/* Action Copy Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 text-xs">
        {/* Copy Speech Only */}
        <button
          onClick={() => copyToClipboard(scene.spokenDialogue, 'speech')}
          id={`btn-copy-speech-${scene.index}`}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#241810] hover:bg-[#322216] text-[#debfa6] border border-[#3d291a] transition-all"
          title="Copiar apenas o texto da fala para gerador de voz"
        >
          {copiedSpeech ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#79a665]" />
              <span className="text-[#79a665] font-semibold">Fala Copiada!</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5 text-[#e08244]" />
              <span>Copiar apenas a Fala (Áudio)</span>
            </>
          )}
        </button>

        {/* Copy Full Prompt Block */}
        <button
          onClick={() => copyToClipboard(scene.fullFormattedPrompt || `${scene.visualPrompt}\n\nSpoken dialogue in Brazilian Portuguese:\n"${scene.spokenDialogue}"\n\nNo speech other than the exact dialogue provided.\nNo subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`, 'full')}
          id={`btn-copy-prompt-${scene.index}`}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#c26a2c] hover:bg-[#d67634] text-white font-semibold transition-all shadow-sm"
          title="Copiar prompt pronto para colar em Sora, Kling, Runway ou Luma"
        >
          {copiedFull ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Prompt Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Prompt Completo (Sora/Kling)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
