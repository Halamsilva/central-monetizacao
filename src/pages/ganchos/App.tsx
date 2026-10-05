/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptViewer } from './components/PromptViewer';
import { PromptEditor } from './components/PromptEditor';
import { TemplateLibraryModal } from './components/TemplateLibraryModal';
import { RulesBanner } from './components/RulesBanner';
import { PRESET_TEMPLATES, SKIN_REALISM_COMMAND } from './data/templates';
import { ScenePromptData, PresetTemplate } from './types/prompt';
import { parsePromptText, formatPromptText } from './utils/promptParser';
import { Check, Sparkles, Copy, Sliders, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { describeHttpError } from '../../lib/httpError';

const STORAGE_KEY = 'cinematic_prompt_current';
const STORAGE_SKIN_KEY = 'cinematic_prompt_skin_realism';

export default function App() {
  const [currentPrompt, setCurrentPrompt] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || saved.includes('Marcelo (Gerente')) {
      return PRESET_TEMPLATES[0].promptText;
    }
    return saved;
  });

  const [skinRealismActive, setSkinRealismActive] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_SKIN_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentPrompt);
  }, [currentPrompt]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SKIN_KEY, String(skinRealismActive));
  }, [skinRealismActive]);

  // Master 1-Click Copy Handler
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(currentPrompt);
      setHasCopied(true);
      showToast('PROMPT COPIADO COM UM CLIQUE! Pronto para usar.');
      setTimeout(() => setHasCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = currentPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setHasCopied(true);
      showToast('Prompt copiado para a área de transferência!');
      setTimeout(() => setHasCopied(false), 2500);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Toggle skin realism and synchronize current prompt text
  const handleToggleSkinRealism = () => {
    const nextState = !skinRealismActive;
    setSkinRealismActive(nextState);

    const parsed = parsePromptText(currentPrompt);
    const updatedPrompt = formatPromptText(parsed, nextState);
    setCurrentPrompt(updatedPrompt);

    if (nextState) {
      showToast('✨ Textura de pele humana real (poros 8K) adicionada ao personagem!');
    } else {
      showToast('Comando de textura de pele desativado.');
    }
  };

  // Select Preset Template
  const handleSelectTemplate = (template: PresetTemplate) => {
    const parsed = parsePromptText(template.promptText);
    const formatted = formatPromptText(parsed, skinRealismActive);
    setCurrentPrompt(formatted);
    showToast(`Modelo carregado: ${template.title}`);
  };

  // AI or Server Transform
  const handleGenerateWithAI = async (
    inputPrompt: string,
    overrides: Partial<ScenePromptData>,
    preserveCharacters: boolean = false
  ) => {
    setIsGenerating(true);
    try {
      const parsedCurrent = parsePromptText(inputPrompt || currentPrompt);

      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';

      const response = await fetch('/api/agents/ganchos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          originalPrompt: inputPrompt || currentPrompt,
          addRealisticSkinTexture: skinRealismActive,
          sceneNumber: parsedCurrent.sceneNumber || '01',
          preserveCharacters: true,
        }),
      });

      if (!response.ok) {
        throw new Error(await describeHttpError(response));
      }

      const data = await response.json();
      if (data.prompt) {
        const parsedResult = parsePromptText(data.prompt);
        const formattedResult = formatPromptText(parsedResult, skinRealismActive);
        setCurrentPrompt(formattedResult);
        showToast('🎯 Falas adaptadas e personagens mantidos com sucesso!');
      }
    } catch (error) {
      console.warn('AI call error, generating via local engine fallback:', error);
      // Local instant fallback
      const { adaptSpeechPreservingCharacters } = await import('./utils/promptParser');
      const fallbackPrompt = preserveCharacters
        ? adaptSpeechPreservingCharacters(inputPrompt || currentPrompt, skinRealismActive)
        : formatPromptText(parsePromptText(inputPrompt || currentPrompt), skinRealismActive);
      setCurrentPrompt(fallbackPrompt);
      showToast('Fala adaptada mantendo os personagens intactos!');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-[80vh] overflow-hidden rounded-3xl bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500/30 selection:text-rose-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 shadow-2xl shadow-emerald-950/50 text-xs sm:text-sm font-semibold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        skinRealismActive={skinRealismActive}
        onToggleSkinRealism={handleToggleSkinRealism}
      />

      {/* Quick Template Pills Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto text-xs">
          <div className="flex items-center gap-2 shrink-0 text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
              Ganchos Rápidos:
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {PRESET_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors whitespace-nowrap text-xs"
              >
                {tpl.title.split('(')[0].trim()}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="text-rose-400 hover:text-rose-300 text-xs font-semibold shrink-0 flex items-center gap-1"
          >
            <span>Ver Todos</span>
            <span className="font-mono text-[10px]">({PRESET_TEMPLATES.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Rules and Mandatory Structure Banner */}
        <RulesBanner />

        {/* Studio Workspace: Editor and Viewer Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Editor / Transformer */}
          <div className="lg:col-span-5 h-full">
            <PromptEditor
              currentPromptText={currentPrompt}
              onUpdatePrompt={setCurrentPrompt}
              skinRealismActive={skinRealismActive}
              onToggleSkinRealism={handleToggleSkinRealism}
              isGenerating={isGenerating}
              onGenerateWithAI={handleGenerateWithAI}
            />
          </div>

          {/* Right Column: Prompt Viewer with 1-Click Copy */}
          <div className="lg:col-span-7 h-full">
            <PromptViewer
              promptText={currentPrompt}
              onCopyPrompt={handleCopyPrompt}
              hasCopied={hasCopied}
              skinRealismActive={skinRealismActive}
              onToggleSkinRealism={handleToggleSkinRealism}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-400">
        <p>
          Gerador de Prompts Cinematográficos Virais • Preservação estrita de estrutura técnica • Nenhuma imagem é gerada
        </p>
      </footer>

      {/* Template Modal */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        onCopyTemplate={text => {
          navigator.clipboard.writeText(text);
          showToast('Prompt copiado com sucesso!');
        }}
      />
    </div>
  );
}
