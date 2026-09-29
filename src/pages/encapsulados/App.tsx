import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { IdentityBanner } from './components/IdentityBanner';
import { PromptStudioForm } from './components/PromptStudioForm';
import { PromptSequenceList } from './components/PromptSequenceList';
import { AgentChatDrawer } from './components/AgentChatDrawer';
import { RulesModal } from './components/RulesModal';
import { PRESET_SCRIPTS } from './data/presets';
import { VideoScript, PromptGenerationRequest } from './types';
import { supabase } from '../../lib/supabase';
import { AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentScript, setCurrentScript] = useState<VideoScript | null>(PRESET_SCRIPTS[0]);
  const [activePromptId, setActivePromptId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  const [lastRequest, setLastRequest] = useState<PromptGenerationRequest | null>(null);

  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_SCRIPTS.find((s) => s.id === presetId);
    if (found) {
      setCurrentScript(found);
      setActivePromptId(1);
      setErrorMessage(null);
    }
  };

  const handleGenerateScript = async (request: PromptGenerationRequest) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLastRequest(request);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const response = await fetch('/api/agents/encapsulados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ...request, action: 'generate-script' }),
      });

      if (!response.ok) {
        let errorDetail = 'Falha na resposta do servidor.';
        try {
          const rawText = await response.text();
          try {
            const errJson = JSON.parse(rawText);
            if (errJson.error) errorDetail = errJson.error;
          } catch {
            if (response.status === 413) {
              errorDetail = 'O arquivo enviado (imagem ou vídeo) excedeu o limite de tamanho. Envie uma foto menor ou comprima o vídeo.';
            } else if (response.status === 504 || response.status === 502) {
              errorDetail = 'Tempo limite excedido na conexão. Clique em "Tentar Novamente" abaixo para reprocessar instantaneamente.';
            } else if (rawText && rawText.length < 200 && !rawText.includes('<html')) {
              errorDetail = rawText;
            }
          }
        } catch {
          // ignore parsing error
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();

      if (data.script && Array.isArray(data.script.prompts) && data.script.prompts.length > 0) {
        setCurrentScript(data.script);
        setActivePromptId(1);
        setErrorMessage(null);
      } else if (data.error) {
        setErrorMessage(data.error);
      } else {
        setErrorMessage('Não foi possível estruturar os 9 prompts automaticamente. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Error generating script:', err);
      const isDemandError = String(err?.message || '').toLowerCase().includes('demand') ||
                            String(err?.message || '').includes('503');
      if (isDemandError) {
        setErrorMessage('O modelo principal de IA está com alta demanda momentânea nos servidores da Google. Clique em "Tentar Novamente" abaixo para utilizar nossa rota instantânea alternativa.');
      } else {
        setErrorMessage(err?.message || 'Falha momentânea na comunicação. Clique em "Tentar Novamente" abaixo para reprocessar.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearPrompts = () => {
    setCurrentScript(null);
    setActivePromptId(1);
  };

  const handleNewVideo = () => {
    setCurrentScript(null);
    setActivePromptId(1);
    // Focus the form input
    const input = document.getElementById('input-video-theme');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b120e] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <Navbar
        onNewVideo={handleNewVideo}
        onClearPrompts={handleClearPrompts}
        onOpenRules={() => setIsRulesOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        hasScript={Boolean(currentScript)}
      />

      {/* Official Identity & Fixed Rules Banner */}
      <IdentityBanner />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {/* Error notification if any */}
        {errorMessage && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-800/60 bg-red-950/50 p-3.5 text-xs text-red-200 shadow-lg">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5 sm:mt-0" />
              <div className="leading-relaxed">
                <span className="font-semibold text-white mr-1.5">Aviso de Processamento:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {lastRequest && (
                <button
                  type="button"
                  onClick={() => handleGenerateScript(lastRequest)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-red-700/60 bg-red-900/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Tentar Novamente</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="rounded-lg p-1.5 text-red-300/80 hover:bg-red-900/40 hover:text-white transition-colors"
                title="Fechar aviso"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content: Form & Prompts Sequence */}
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Prompt Studio Input Form */}
          <PromptStudioForm
            onGenerate={handleGenerateScript}
            isLoading={isLoading}
            onSelectPreset={handleSelectPreset}
          />

          {/* The 9 Prompts Sequence List or Clean State */}
          {currentScript ? (
            <PromptSequenceList
              script={currentScript}
              activePromptId={activePromptId}
              onSelectPrompt={(id) => setActivePromptId(id)}
              onClearPrompts={handleClearPrompts}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-emerald-900/60 bg-[#0e1713]/80 p-8 text-center shadow-lg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/90 border border-emerald-700/40 text-emerald-400 mb-3 shadow-inner">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Área de Prompts Limpa
              </h3>
              <p className="text-xs text-emerald-300/70 mt-1 max-w-md mx-auto">
                Os prompts anteriores foram removidos. Digite um tema acima ou clique em uma das sugestões para formular 9 novos prompts virais de 8s (72s no total).
              </p>
              <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
                <button
                  onClick={() => handleSelectPreset('script-tartaro-dental')}
                  className="rounded-lg border border-emerald-800/70 bg-[#14231b] px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-900/50 hover:text-white transition-colors"
                >
                  Carregar Exemplo: Tártaro Dental
                </button>
                <button
                  onClick={() => handleSelectPreset('script-figado-gordura')}
                  className="rounded-lg border border-emerald-800/70 bg-[#14231b] px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-900/50 hover:text-white transition-colors"
                >
                  Carregar Exemplo: Fígado & Gordura
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Chat Drawer */}
      <AgentChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onApplyScript={(script) => {
          setCurrentScript(script);
          setActivePromptId(1);
        }}
      />

      {/* Manual Visual & Fixed Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-emerald-900/30 bg-[#080d0a] py-6 text-center text-xs text-emerald-400/60">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-300 tracking-wider">CORPO REVELADO</span>
            <span>•</span>
            <span>Engenharia Fixa de Vídeos Virais IA</span>
          </div>
          <div className="text-[11px] text-emerald-500/60">
            9 Prompts Conectados • 8 Segundos Cada • 72s Total • Formato 9:16
          </div>
        </div>
      </footer>
    </div>
  );
}
