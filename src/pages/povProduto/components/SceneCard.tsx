import React, { useState } from 'react';
import { ScenePrompt } from '../types';
import { Copy, Check, Eye, MessageSquare, Hand, Sparkles, Video, RefreshCw, Edit3, Save, X } from 'lucide-react';
import { SpeechPlayer } from './SpeechPlayer';

interface SceneCardProps {
  scene: ScenePrompt;
  productName: string;
  onUpdateDialogue?: (sceneNumber: 1 | 2 | 3, newDialogue: string) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene, productName, onUpdateDialogue }) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedDialogue, setCopiedDialogue] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(scene.spokenDialogue);
  const [altIndex, setAltIndex] = useState(0);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(scene.englishPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt', err);
    }
  };

  const handleCopyDialogue = async () => {
    try {
      await navigator.clipboard.writeText(scene.spokenDialogue);
      setCopiedDialogue(true);
      setTimeout(() => setCopiedDialogue(false), 2000);
    } catch (err) {
      console.error('Failed to copy dialogue', err);
    }
  };

  const handleCycleAlternative = () => {
    if (!scene.alternativeDialogues || scene.alternativeDialogues.length <= 1) return;
    const nextIndex = (altIndex + 1) % scene.alternativeDialogues.length;
    setAltIndex(nextIndex);
    const newDialogue = scene.alternativeDialogues[nextIndex];
    if (onUpdateDialogue) {
      onUpdateDialogue(scene.sceneNumber, newDialogue);
    }
  };

  const handleSaveEdit = () => {
    if (editedText.trim() && onUpdateDialogue) {
      onUpdateDialogue(scene.sceneNumber, editedText.trim());
    }
    setIsEditing(false);
  };

  const getSceneBadge = () => {
    switch (scene.sceneNumber) {
      case 1:
        return {
          title: 'PROMPT 1 — GANCHO / PRIMEIRO CONTATO',
          badgeColor: 'from-amber-500 to-orange-500 text-neutral-950',
          accentBorder: 'border-orange-500/30',
          phase: 'Descoberta',
          time: '0:00 - 0:09 (9 seg)',
        };
      case 2:
        return {
          title: 'PROMPT 2 — DETALHES / DEMONSTRAÇÃO REAL',
          badgeColor: 'from-cyan-500 to-blue-500 text-neutral-950',
          accentBorder: 'border-blue-500/30',
          phase: 'Demonstração Real',
          time: '0:09 - 0:18 (9 seg)',
        };
      case 3:
        return {
          title: 'PROMPT 3 — CONCLUSÃO + CTA NATURAL',
          badgeColor: 'from-emerald-500 to-teal-400 text-neutral-950',
          accentBorder: 'border-emerald-500/30',
          phase: 'Conversão / CTA',
          time: '0:18 - 0:27 (9 seg)',
        };
      default:
        return {
          title: `PROMPT ${scene.sceneNumber}`,
          badgeColor: 'from-neutral-500 to-neutral-400 text-neutral-950',
          accentBorder: 'border-neutral-700',
          phase: 'Cena',
          time: '9 seg',
        };
    }
  };

  const badgeInfo = getSceneBadge();

  return (
    <div className={`bg-neutral-900/80 rounded-2xl border ${badgeInfo.accentBorder} overflow-hidden shadow-xl transition-all duration-200 hover:border-neutral-700`}>
      {/* Top Banner */}
      <div className="bg-neutral-950/60 px-5 py-3.5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r ${badgeInfo.badgeColor} shadow-sm`}>
            CENA {scene.sceneNumber}
          </span>
          <h3 className="text-sm font-bold text-white tracking-wide">
            {scene.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            {badgeInfo.time}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
            {badgeInfo.phase}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Brazilian Portuguese Spoken Dialogue Box */}
        <div className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-800/90 relative group">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Fala Específica Condizente com o Produto (~9s)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {scene.alternativeDialogues && scene.alternativeDialogues.length > 1 && !isEditing && (
                <button
                  onClick={handleCycleAlternative}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 transition font-medium"
                  title="Alternar entre outras falas condizentes para este produto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Outra Variação</span>
                </button>
              )}

              {!isEditing ? (
                <button
                  onClick={() => {
                    setEditedText(scene.spokenDialogue);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition"
                  title="Editar o texto da fala"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Fala</span>
                </button>
              ) : null}

              <button
                onClick={handleCopyDialogue}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition"
                title="Copiar apenas a fala"
              >
                {copiedDialogue ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {scene.mentalTrigger && (
            <div className="mb-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gatilho Mental: {scene.mentalTrigger}</span>
            </div>
          )}

          {isEditing ? (
            <div className="my-2 space-y-2">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full bg-neutral-900 border border-orange-500/50 rounded-lg p-2.5 text-white text-sm focus:outline-none leading-relaxed"
                rows={2}
                placeholder="Digite a fala condizente em Português do Brasil..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Fala</span>
                </button>
              </div>
            </div>
          ) : (
            <blockquote className="text-base sm:text-lg font-medium text-neutral-100 italic leading-relaxed border-l-2 border-orange-500 pl-3 my-2">
              "{scene.spokenDialogue}"
            </blockquote>
          )}

          {/* Integrated Speech Audio Player & 9s timer */}
          <div className="mt-3">
            <SpeechPlayer dialogue={scene.spokenDialogue} sceneNumber={scene.sceneNumber} />
          </div>
        </div>

        {/* Visual Sync & Hand Movement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-neutral-950/50 rounded-xl p-3 border border-neutral-800/60">
            <div className="flex items-center gap-1.5 text-neutral-400 font-semibold mb-1">
              <Hand className="w-3.5 h-3.5 text-amber-400" />
              <span>Interação Física da Mão Direita</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              {scene.visualInteraction}
            </p>
          </div>

          <div className="bg-neutral-950/50 rounded-xl p-3 border border-neutral-800/60">
            <div className="flex items-center gap-1.5 text-neutral-400 font-semibold mb-1">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Foco Visual Real</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              {scene.keyFocalPoint}
            </p>
          </div>
        </div>

        {/* Standalone English Video Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Prompt de Vídeo Completo (Em Inglês para Kling / Sora / Runway / Luma / Veo)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFullPrompt(!showFullPrompt)}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition underline underline-offset-2"
              >
                {showFullPrompt ? 'Mostrar Menos' : 'Expandir Tudo'}
              </button>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs shadow-md shadow-orange-500/10 transition"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Prompt Completo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative rounded-xl bg-neutral-950 border border-neutral-800 p-4 font-mono text-xs text-neutral-300 leading-relaxed overflow-x-auto">
            <pre className={`whitespace-pre-wrap ${showFullPrompt ? '' : 'max-h-56 overflow-y-auto'}`}>
              {scene.englishPrompt}
            </pre>
            {!showFullPrompt && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none rounded-b-xl" />
            )}
          </div>
        </div>

        {/* POV Technical Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-neutral-400">
          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
            📹 Lente 14–16mm POV
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
            📐 Câmera na Testa (Visão p/ Baixo)
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
            🖥️ Mesa Domina 65–75%
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
            🖐️ Antebraço Canto Inferior Direito
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
            🏠 Home-Office Brasileiro
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
            🚫 Sem Rosto / Sem Movimento Artificial
          </span>
        </div>
      </div>
    </div>
  );
};
