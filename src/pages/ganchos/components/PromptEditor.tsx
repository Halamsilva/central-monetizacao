import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  RefreshCw,
  Flame,
  Layers,
  Edit3,
  HelpCircle,
  Zap,
  Sliders,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { ScenePromptData } from '../types/prompt';
import { formatPromptText, parsePromptText, estimateDialogueTiming, getGanchosLanguageLabel } from '../utils/promptParser';
import { SKIN_REALISM_COMMAND } from '../data/templates';

interface PromptEditorProps {
  currentPromptText: string;
  onUpdatePrompt: (newPrompt: string) => void;
  skinRealismActive: boolean;
  onToggleSkinRealism: () => void;
  isGenerating: boolean;
  onGenerateWithAI: (inputPrompt: string, overrides: Partial<ScenePromptData>, preserveCharacters?: boolean) => Promise<void>;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  currentPromptText,
  onUpdatePrompt,
  skinRealismActive,
  onToggleSkinRealism,
  isGenerating,
  onGenerateWithAI,
}) => {
  const [activeTab, setActiveTab] = useState<'transform' | 'form'>('transform');
  const [rawInputText, setRawInputText] = useState('');
  const [intensity, setIntensity] = useState<'extrema' | 'alta' | 'moderada'>('extrema');

  // Form fields state
  const parsed = parsePromptText(currentPromptText);
  const [formData, setFormData] = useState<ScenePromptData>(parsed);

  // Sync formData when currentPromptText changes
  const handleTabChange = (tab: 'transform' | 'form') => {
    if (tab === 'form') {
      setFormData(parsePromptText(currentPromptText));
    }
    setActiveTab(tab);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawInputText(text);
        const parsed = parsePromptText(text);
        const formatted = formatPromptText(parsed, skinRealismActive);
        onUpdatePrompt(formatted);
        setFormData(parsed);
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied', err);
    }
  };

  const handleFormFieldChange = (field: keyof ScenePromptData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    const formatted = formatPromptText(updated, skinRealismActive);
    onUpdatePrompt(formatted);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawInputText(val);
    if (val.includes('CENA:') || val.includes('PERSONAGENS:') || val.includes('POSTURA:') || val.includes('fala no idioma')) {
      const parsed = parsePromptText(val);
      const formatted = formatPromptText(parsed, skinRealismActive);
      onUpdatePrompt(formatted);
      setFormData(parsed);
    }
  };

  const handleApplyPastedPrompt = () => {
    const text = rawInputText.trim();
    if (!text) return;
    const parsed = parsePromptText(text);
    const formatted = formatPromptText(parsed, skinRealismActive);
    onUpdatePrompt(formatted);
    setFormData(parsed);
  };

  const handleTransformSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = rawInputText.trim() || currentPromptText;
    await onGenerateWithAI(textToSend, {
      hasRealisticSkin: skinRealismActive,
    });
  };

  // Quick intensifier for speech tailored to characters
  const handleIntensifyDialogue = () => {
    const textToSend = rawInputText.trim() || currentPromptText;
    onGenerateWithAI(textToSend, {
      hasRealisticSkin: skinRealismActive,
    }, true);
  };

  const timing = estimateDialogueTiming(formData.spokenDialogue || '');

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Tabs */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => handleTabChange('transform')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'transform'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Reescrever Prompt / Roteiro</span>
          </button>
          <button
            onClick={() => handleTabChange('form')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'form'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Campos Obrigatórios</span>
          </button>
        </div>

        {/* Realism Badge */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onToggleSkinRealism}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
              skinRealismActive
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Pele Realista: {skinRealismActive ? 'ATIVADA' : 'DESATIVADA'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
        {activeTab === 'transform' ? (
          /* TAB 1: Transform / Rewrite Prompt */
          <form onSubmit={handleTransformSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  Cole seu prompt original ou roteiro:
                </label>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors flex items-center gap-1"
                  title="Colar texto copiado na área de transferência"
                >
                  <span>📋 Colar Texto Copiado</span>
                </button>
              </div>
              <textarea
                value={rawInputText}
                onChange={handleTextareaChange}
                placeholder="Cole aqui o seu prompt original (ex: CENA: ..., PERSONAGENS: Nome: ..., POSTURA: ...)"
                rows={8}
                className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 leading-relaxed resize-none"
              />
              {rawInputText.trim() && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleApplyPastedPrompt}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors"
                  >
                    <span>📥 Carregar Personagens Deste Prompt na Tela</span>
                  </button>
                </div>
              )}
            </div>

            {/* Directives and Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Nível de Hostilidade da Fala (~9s):
                </label>
                <div className="flex gap-2">
                  {(['extrema', 'alta', 'moderada'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIntensity(lvl)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize border transition-all ${
                        intensity === lvl
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Comando Extra de Textura de Pele:
                </label>
                <button
                  type="button"
                  onClick={onToggleSkinRealism}
                  className={`w-full py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-between ${
                    skinRealismActive
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Pele Humana Real com Poros 8K
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800">
                    {skinRealismActive ? 'Sim' : 'Não'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Rules reminder box */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Critérios Obrigatórios Aplicados Automaticamente:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                <li>Preserva a estrutura formal completa (CENA, PERSONAGENS, POSTURA, etc.)</li>
                <li>Fala com raiva e impacto imediato nos primeiros 4 segundos</li>
                <li>Tempo calibrado para exatamente 9 segundos (27 a 30 palavras)</li>
                <li>Sem imagens • Retorna prompt técnico integral em texto</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const textToSend = rawInputText.trim() || currentPromptText;
                  onGenerateWithAI(textToSend, {
                    hasRealisticSkin: skinRealismActive,
                  }, true); // preserveCharacters = true
                }}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white shadow-lg shadow-rose-950/60 transition-all cursor-pointer border border-amber-300/30"
              >
                <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>🎯 ADAPTAR FALA (9s • PRESERVAR OS PERSONAGENS)</span>
              </button>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>PROCESSANDO ESTRUTURA...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Reescrever Prompt Inteiro</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleIntensifyDialogue}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-colors"
                  title="Gerar nova variação de fala de 9 segundos"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Nova Variação de Fala (~9s)</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* TAB 2: Form fields mode */
          <div className="space-y-4">
            {/* Scene Number & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Número da Cena:
                </label>
                <input
                  type="text"
                  value={formData.sceneNumber}
                  onChange={e => handleFormFieldChange('sceneNumber', e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-rose-500"
                  placeholder="01"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Nome do Personagem (Antagonista):
                </label>
                <input
                  type="text"
                  value={formData.characterName}
                  onChange={e => handleFormFieldChange('characterName', e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                  placeholder="Marcelo (Gerente da Loja)"
                />
              </div>
            </div>

            {/* CENA */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                CENA: (descrição cinematográfica completa)
              </label>
              <textarea
                rows={3}
                value={formData.sceneDescription}
                onChange={e => handleFormFieldChange('sceneDescription', e.target.value)}
                className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />
            </div>

            {/* DESCRIÇÃO VISUAL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  DESCRIÇÃO VISUAL DO PERSONAGEM:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const currentVisual = formData.characterVisual;
                    if (!currentVisual.toLowerCase().includes('textura de pele')) {
                      handleFormFieldChange('characterVisual', `${currentVisual} ${SKIN_REALISM_COMMAND}.`);
                    }
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  + Injetar Textura de Pele Humana Real
                </button>
              </div>
              <textarea
                rows={3}
                value={formData.characterVisual}
                onChange={e => handleFormFieldChange('characterVisual', e.target.value)}
                className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />
            </div>

            {/* POSTURA */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                POSTURA: (linguagem corporal e atitude física)
              </label>
              <textarea
                rows={2}
                value={formData.characterPosture}
                onChange={e => handleFormFieldChange('characterPosture', e.target.value)}
                className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />
            </div>

            {/* PERFIL PSICOLÓGICO */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                PERFIL PSICOLÓGICO: (emoção de raiva, desprezo, nojo e soberba)
              </label>
              <textarea
                rows={2}
                value={formData.characterPsychology}
                onChange={e => handleFormFieldChange('characterPsychology', e.target.value)}
                className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />
            </div>

            {/* Motivação & Medo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Motivação:
                </label>
                <textarea
                  rows={2}
                  value={formData.motivation}
                  onChange={e => handleFormFieldChange('motivation', e.target.value)}
                  className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Medo:
                </label>
                <textarea
                  rows={2}
                  value={formData.fear}
                  onChange={e => handleFormFieldChange('fear', e.target.value)}
                  className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* FALA FINAL (COM MEDIDOR DE ~8S) */}
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  {formData.characterName || 'Personagem'} fala no idioma e estilo de {getGanchosLanguageLabel()}:
                </label>
                <span className="text-[11px] font-mono text-slate-300">
                  {timing.wordCount} palavras • ~{timing.durationSeconds}s
                </span>
              </div>
              <textarea
                rows={3}
                value={formData.spokenDialogue}
                onChange={e => handleFormFieldChange('spokenDialogue', e.target.value)}
                placeholder="“SEGURANÇA! Tira esse lixo daqui agora...”"
                className="w-full bg-slate-950 p-3 rounded-xl border border-rose-800/60 text-rose-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-rose-400 leading-relaxed resize-none"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Alvo: 8 segundos • Ataque e agressão nos primeiros 4s</span>
                <span
                  className={`font-semibold ${
                    timing.isOptimal ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {timing.statusText}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
