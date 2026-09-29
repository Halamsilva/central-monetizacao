/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ProductAnalysisCard } from './components/ProductAnalysisCard';
import { SceneCard } from './components/SceneCard';
import { GuideModal } from './components/GuideModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { GeneratedResult, ScenePrompt, ProductAnalysis } from './types';
import { supabase } from '../../lib/supabase';
import { describeHttpError } from '../../lib/httpError';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  RotateCcw,
  FileText,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const STORAGE_KEY = 'pov_produto_history_v1';

export default function App() {
  const [currentResult, setCurrentResult] = useState<GeneratedResult | null>(null);
  const [history, setHistory] = useState<GeneratedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'raw'>('cards');
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico local', e);
    }
  }, []);

  const saveToHistory = (result: GeneratedResult) => {
    const updated = [result, ...history.filter(h => h.id !== result.id)].slice(0, 20);
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar no histórico local', e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const handleDeleteResult = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleGenerate = async (data: {
    imageBase64: string;
    mimeType: string;
    brandName?: string;
    visualFocus?: string;
    ctaType?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const response = await fetch('/api/agents/povProduto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action: 'generate-pov-prompts', ...data }),
      });

      if (!response.ok) {
        throw new Error(await describeHttpError(response));
      }

      const resData = await response.json();

      // Format raw formatted response if not present
      let rawText = resData.rawFormattedResponse;
      if (!rawText && resData.scenes && resData.scenes.length >= 3) {
        rawText = `PROMPT 1\n${resData.scenes[0].englishPrompt}\n\nFALA:\n"${resData.scenes[0].spokenDialogue}"\n\nPROMPT 2\n${resData.scenes[1].englishPrompt}\n\nFALA:\n"${resData.scenes[1].spokenDialogue}"\n\nPROMPT 3\n${resData.scenes[2].englishPrompt}\n\nFALA:\n"${resData.scenes[2].spokenDialogue}"`;
      }

      const newResult: GeneratedResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUrl: data.imageBase64,
        productAnalysis: resData.productAnalysis,
        scenes: resData.scenes as [ScenePrompt, ScenePrompt, ScenePrompt],
        rawText: rawText,
        customBrand: data.brandName,
        customNotes: data.visualFocus,
        ctaType: data.ctaType,
      };

      setCurrentResult(newResult);
      saveToHistory(newResult);

      // Scroll smoothly to results
      setTimeout(() => {
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error('Erro na geração:', err);
      setErrorMessage(
        err?.message || 'Ocorreu uma falha ao conectar com o serviço de análise visual. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDialogue = (sceneNumber: 1 | 2 | 3, newDialogue: string) => {
    if (!currentResult) return;
    const updatedScenes = currentResult.scenes.map((sc) => {
      if (sc.sceneNumber === sceneNumber) {
        const updatedPrompt = sc.englishPrompt.replace(
          /DIALOGUE:[\s\S]*?"[\s\S]*?"/m,
          `DIALOGUE:\nThe person speaks naturally in Brazilian Portuguese (approximately 9 seconds):\n"${newDialogue}"`
        );
        return {
          ...sc,
          spokenDialogue: newDialogue,
          englishPrompt: updatedPrompt,
        };
      }
      return sc;
    }) as [ScenePrompt, ScenePrompt, ScenePrompt];

    const updatedRawText = `PROMPT 1\n${updatedScenes[0].englishPrompt}\n\nFALA:\n"${updatedScenes[0].spokenDialogue}"\n\nPROMPT 2\n${updatedScenes[1].englishPrompt}\n\nFALA:\n"${updatedScenes[1].spokenDialogue}"\n\nPROMPT 3\n${updatedScenes[2].englishPrompt}\n\nFALA:\n"${updatedScenes[2].spokenDialogue}"`;

    const updatedResult: GeneratedResult = {
      ...currentResult,
      scenes: updatedScenes,
      rawText: updatedRawText,
    };

    setCurrentResult(updatedResult);
    saveToHistory(updatedResult);
  };

  const handleCopyRaw = async () => {
    if (!currentResult) return;
    try {
      await navigator.clipboard.writeText(currentResult.rawText);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } catch (e) {
      console.error('Falha ao copiar texto', e);
    }
  };

  const handleDownloadTxt = () => {
    if (!currentResult) return;
    const blob = new Blob([currentResult.rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = currentResult.productAnalysis.productName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 30);
    link.download = `pov_3cenas_${safeName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-900/60 to-neutral-950 border border-neutral-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Padrão POV Câmera na Testa • Ultra-Realista</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Prompts de Vídeo em 1ª Pessoa para Apresentação de Produtos
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Envie uma foto de qualquer produto. A IA inspeciona rigidamente as características reais e gera exatamente <strong>3 prompts de 9 segundos</strong> em inglês para Kling, Runway, Sora, Luma e Veo, com falas naturais sincronizadas em Português do Brasil.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-neutral-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero características inventadas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                <span>Sequência Viral 27s (Gancho • Detalhes • CTA)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Prompts 100% autossuficientes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <strong className="block font-semibold">Erro ao gerar prompts:</strong>
              <p className="text-xs text-rose-200 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Input / Uploader Section */}
        <ImageUploader onGenerate={handleGenerate} isLoading={isLoading} />

        {/* Results Section */}
        {currentResult && (
          <div className="space-y-8 pt-4">
            {/* Divider and section title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
              <div>
                <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                  Resultado Gerado
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Sequência POV: {currentResult.productAnalysis.productName}
                </h2>
              </div>

              {/* View mode toggle and batch actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-neutral-900 p-1 rounded-xl border border-neutral-800 flex items-center text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('cards')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeTab === 'cards'
                        ? 'bg-orange-500 text-neutral-950 font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Cenas Detalhadas
                  </button>
                  <button
                    onClick={() => setActiveTab('raw')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeTab === 'raw'
                        ? 'bg-orange-500 text-neutral-950 font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Texto Formatado (RAW)
                  </button>
                </div>

                <button
                  onClick={handleCopyRaw}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white transition"
                  title="Copiar todos os 3 prompts no formato padrão"
                >
                  {copiedRaw ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Todos Copiados!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-orange-400" />
                      <span>Copiar Todos</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadTxt}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white transition"
                  title="Baixar arquivo TXT"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar .TXT</span>
                </button>
              </div>
            </div>

            {/* Product Analysis Inspection Card */}
            <ProductAnalysisCard
              analysis={currentResult.productAnalysis}
              imageUrl={currentResult.imageUrl}
            />

            {/* Timeline Progress Bar (0 to 27s) */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 mb-2">
                <span>Linha do Tempo do Vídeo (Total: 27 segundos)</span>
                <span className="text-orange-400">Padrão Ideal para TikTok Shop / Reels</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-center">
                  <span className="block text-[11px] font-bold text-amber-400">CENA 1 (0:00 - 0:09)</span>
                  <span className="text-xs text-neutral-300 font-medium">Gancho & Curiosidade</span>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-2.5 text-center">
                  <span className="block text-[11px] font-bold text-cyan-400">CENA 2 (0:09 - 0:18)</span>
                  <span className="text-xs text-neutral-300 font-medium">Demonstração & Detalhes</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 text-center">
                  <span className="block text-[11px] font-bold text-emerald-400">CENA 3 (0:18 - 0:27)</span>
                  <span className="text-xs text-neutral-300 font-medium">Conclusão + CTA Natural</span>
                </div>
              </div>
            </div>

            {/* Tab 1: Scene Cards */}
            {activeTab === 'cards' && (
              <div className="space-y-6">
                {currentResult.scenes.map((scene) => (
                  <SceneCard
                    key={scene.sceneNumber}
                    scene={scene}
                    productName={currentResult.productAnalysis.productName}
                    onUpdateDialogue={handleUpdateDialogue}
                  />
                ))}
              </div>
            )}

            {/* Tab 2: RAW Formatted Text */}
            {activeTab === 'raw' && (
              <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">
                      Formato Exato de Saída (Pronto para Copiar & Colar)
                    </h3>
                  </div>
                  <button
                    onClick={handleCopyRaw}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs transition"
                  >
                    {copiedRaw ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Texto Completo</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-4 font-mono text-xs text-neutral-300 leading-relaxed overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{currentResult.rawText}</pre>
                </div>
              </div>
            )}

            {/* Next Step Guidance */}
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-neutral-400 space-y-1">
                <p className="font-semibold text-white">
                  Pronto para criar os vídeos com inteligência artificial?
                </p>
                <p>
                  Copie o Prompt 1, 2 e 3 e cole diretamente no Kling AI, Runway Gen-3, Sora ou Luma com a foto do seu produto!
                </p>
              </div>
              <button
                onClick={() => setIsGuideOpen(true)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold transition flex items-center gap-2 flex-shrink-0"
              >
                <span>Ver Guia Passo a Passo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            POV Produto – 3 Cenas de 9 Segundos • Vídeos em 1ª Pessoa para Conversão Viral
          </p>
          <p className="text-[11px] text-neutral-600">
            Câmera 14-16mm • Mesa Dominante • Antebraço Direito • Fala PT-BR
          </p>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectResult={(result) => setCurrentResult(result)}
        onClearHistory={handleClearHistory}
        onDeleteResult={handleDeleteResult}
      />
    </div>
  );
}
