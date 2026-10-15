import React, { useState, useEffect } from 'react';
import {
  Radio,
  BookOpen,
  History,
  Copy,
  Check,
  Download,
  Share2,
  Tv,
  Sparkles,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { GeneratedNewsData, InputMode, PacingOption, QuickFactsForm } from './types';
import { callCriadorNoticias } from './api';
import { InputTabs, EXAMPLES } from './components/InputTabs';
import { RulesModal } from './components/RulesModal';
import { TeleprompterModal } from './components/TeleprompterModal';
import { AudioPlayerSection } from './components/AudioPlayerSection';
import { VideoPromptsSection } from './components/VideoPromptsSection';
import { BreakdownViewer } from './components/BreakdownViewer';
import { FactCheckCard } from './components/FactCheckCard';
import { HistoryDrawer } from './components/HistoryDrawer';

export default function App() {
  // Input states
  const [mode, setMode] = useState<InputMode>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [quickFacts, setQuickFacts] = useState<QuickFactsForm>({
    title: '',
    location: '',
    whatHappened: '',
    details: '',
  });
  const [pacing, setPacing] = useState<PacingOption>('standard');
  const [includeQuestion, setIncludeQuestion] = useState(true);

  // App processing states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generated results
  const [result, setResult] = useState<GeneratedNewsData | null>(null);
  const [showAlternativeTitles, setShowAlternativeTitles] = useState(false);

  // Modals & Drawers
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isPrompterOpen, setIsPrompterOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Local storage history (filtering out any legacy template items)
  const [history, setHistory] = useState<GeneratedNewsData[]>(() => {
    try {
      const saved = localStorage.getItem('viralnews_history');
      if (!saved) return [];
      const parsed: GeneratedNewsData[] = JSON.parse(saved);
      return parsed.filter(
        (item) =>
          !item.script?.includes('Um acontecimento surpreendente chamou a atenção') &&
          !item.script?.includes('Um acontecimento de grande impacto chamou a atenção')
      );
    } catch {
      return [];
    }
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('viralnews_history', JSON.stringify(history));
    } catch {}
  }, [history]);

  // Loading animation step tracker
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keyboard shortcut Ctrl+Enter to generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, url, text, quickFacts, pacing, includeQuestion, isLoading]);

  // Select pre-built example
  const handleSelectExample = (ex: any) => {
    setMode('text');
    setText(ex.snippet);
    showToast(`Exemplo carregado: "${ex.title}"`);
  };

  // Generate news script API call
  const handleGenerate = async () => {
    if (isLoading) return;

    if (mode === 'url' && !url.trim()) {
      showToast('Por favor, informe a URL da notícia.');
      return;
    }
    if (mode === 'text' && !text.trim()) {
      showToast('Por favor, cole o texto ou trecho da reportagem.');
      return;
    }
    if (
      mode === 'quick_facts' &&
      (!quickFacts.title.trim() || !quickFacts.whatHappened.trim())
    ) {
      showToast('Preencha ao menos o Título e O que aconteceu.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const json = await callCriadorNoticias('generate-news', {
        mode,
        url,
        text,
        quickFacts,
        pacing,
        includeQuestion,
      });

      if (!json.success) {
        throw new Error(json.error || 'Falha ao processar o roteiro da notícia.');
      }

      const generatedData: GeneratedNewsData = {
        ...json.data,
        searchLinks: json.searchLinks,
        scrapedSource: json.scrapedSource,
        generatedAt: new Date().toISOString(),
        id: Date.now().toString(),
      };

      setResult(generatedData);
      setHistory((prev) => [generatedData, ...prev.slice(0, 24)]);
      showToast('Roteiro viral gerado com sucesso!');

      // Smooth scroll to result
      setTimeout(() => {
        document.getElementById('resultado-roteiro')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy helper
  const copyToClipboard = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    showToast(`${label} copiado para a área de transferência!`);
  };

  // Download .txt file
  const downloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result.rawFormattedOutput], { type: 'text/plain;charset=utf-8' });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `roteiro-${result.title.slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    link.click();
    showToast('Arquivo baixado com sucesso!');
  };

  const loadingMessages = [
    'Acessando fatos e checando dados em fontes confiáveis...',
    'Construindo gancho de alta retenção (0–10s) sem saudações...',
    'Formatando narração em Português Brasileiro (180–260 palavras)...',
    'Finalizando estrutura das 5 fases e título de alto impacto...',
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Broadcast Bar / Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 shadow-lg shadow-rose-950/60 text-white">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-extrabold text-white tracking-wide uppercase">
                VIRALNEWS <span className="text-rose-500">STUDIO</span>
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                ON AIR • AGENTE ATIVO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Transforme links e notícias reais em roteiros de alta retenção para redes sociais (≤ 2 min)
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRulesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Prompt Mestre:</span> 9 Regras
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            Histórico
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 font-mono text-[10px]">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Newsroom Banner / Value Props */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/30 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-current" />
              Roteirista Jornalístico de Alta Retenção
            </span>
            <p className="text-xs text-slate-300">
              Cole um link de qualquer portal de notícias, texto em qualquer idioma ou fatos rápidos.
              O Agente aplica a tríade de ouro: <strong>Veracidade</strong>, <strong>Gancho imediato</strong> e <strong>Narração natural em Português Brasileiro</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
              ⏱️ Max 120 seg
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
              📊 180 a 260 palavras
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
              🇧🇷 Português BR
            </span>
          </div>
        </div>

        {/* Input Interface */}
        <InputTabs
          mode={mode}
          setMode={setMode}
          url={url}
          setUrl={setUrl}
          text={text}
          setText={setText}
          quickFacts={quickFacts}
          setQuickFacts={setQuickFacts}
          pacing={pacing}
          setPacing={setPacing}
          includeQuestion={includeQuestion}
          setIncludeQuestion={setIncludeQuestion}
          onSelectExample={handleSelectExample}
          isLoading={isLoading}
          onSubmit={handleGenerate}
        />

        {/* Loading Progress State */}
        {isLoading && (
          <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4 animate-pulse">
            <div className="w-12 h-12 rounded-full border-3 border-rose-500/20 border-t-rose-500 animate-spin mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                O Agente está redigindo seu roteiro viral
              </h3>
              <p className="text-xs text-rose-400 font-mono">
                {loadingMessages[loadingStep]}
              </p>
            </div>
            <div className="max-w-md mx-auto w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${((loadingStep + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-white text-xs underline ml-4"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Generated Script Results Studio */}
        {result && (
          <div id="resultado-roteiro" className="space-y-6 pt-2">
            {/* Contingency Notification if API quota was 429 */}
            {result.isContingency && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white block">
                      Roteiro Estruturado pelo Motor de Contingência Editorial
                    </span>
                    <span className="text-[11px] text-amber-300">
                      As 9 regras do Prompt Mestre foram cumpridas integralmente (180–260 palavras, 5 fases, gancho e fatos apurados), garantindo que seu fluxo de gravação nunca seja interrompido por limites temporários de cota da chave gratuita (429).
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-white font-medium text-[11px] transition-colors cursor-pointer"
                >
                  Tentar Conectar com IA ao Vivo
                </button>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Reportagem Pronta para Gravação
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Teleprompter Button */}
                <button
                  onClick={() => setIsPrompterOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
                >
                  <Tv className="w-3.5 h-3.5" />
                  Modo Teleprompter (Gravar)
                </button>

                {/* Copy Script Only */}
                <button
                  onClick={() => copyToClipboard(result.script, 'Roteiro de narração')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Narração
                </button>

                {/* Copy Official Format (Regra 8) */}
                <button
                  onClick={() => copyToClipboard(result.rawFormattedOutput, 'Formato Oficial (Regra 8)')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  title="Copia exatamente no formato: TÍTULO, NOTÍCIA PARA NARRAÇÃO, DURAÇÃO ESTIMADA, FONTES"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Formato Regra 8
                </button>

                {/* Download TXT */}
                <button
                  onClick={downloadTxt}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Baixar arquivo de texto (.txt)"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Headline Card (Regra 7) */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-current" />
                  TÍTULO VIRAL (Regra 7):
                </span>
                <button
                  onClick={() => copyToClipboard(result.title, 'Título viral')}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copiar Título
                </button>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-white leading-snug tracking-tight">
                {result.title}
              </h2>

              {/* Insights & Alternative titles toggle */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                {result.viralityInsights && (
                  <p className="text-slate-400 italic">
                    💡 <strong>Estratégia do Gancho:</strong> {result.viralityInsights}
                  </p>
                )}

                {result.alternativeTitles && result.alternativeTitles.length > 0 && (
                  <button
                    onClick={() => setShowAlternativeTitles(!showAlternativeTitles)}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-mono cursor-pointer"
                  >
                    <span>{showAlternativeTitles ? 'Ocultar' : 'Ver 3 Variações de Título'}</span>
                    {showAlternativeTitles ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Alternative titles list */}
              {showAlternativeTitles && result.alternativeTitles && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mt-2">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Variações de Ângulos para Teste A/B:
                  </span>
                  {result.alternativeTitles.map((altTitle, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs text-slate-300 hover:text-white group"
                    >
                      <span className="leading-snug">• {altTitle}</span>
                      <button
                        onClick={() => copyToClipboard(altTitle, `Título alternativo ${idx + 1}`)}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-0.5 ml-2"
                      >
                        <Copy className="w-2.5 h-2.5" /> Copiar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Continuous Voice Narration Script (Regra 4, 5 & 8) */}
            <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold block mb-1">
                    NOTÍCIA PARA NARRAÇÃO (Regra 8):
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-medium">
                      ✓ {result.wordCount} palavras (Meta: 180 a 260)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono font-medium">
                      ⏱️ {result.estimatedDuration} (≤ 2 min)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono font-medium">
                      🎙️ Texto Contínuo Sem Rubricas
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(result.script, 'Roteiro de narração')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Roteiro
                </button>
              </div>

              {/* The Script text itself */}
              <div className="text-slate-100 text-base md:text-lg leading-relaxed md:leading-loose font-sans font-medium whitespace-pre-line tracking-normal select-text">
                {result.script}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>
                  Pronto para transformar em áudio • Sem marcações de câmera ou emojis
                </span>
                <span>Português Brasileiro</span>
              </div>
            </div>

            {/* Audio Studio Player (Gemini 3.8 TTS + Web Speech) */}
            <AudioPlayerSection script={result.script} />

            {/* 8 Video Prompts for AI (10s blocks without dialogue) */}
            <VideoPromptsSection
              prompts={result.videoPrompts}
              newsTitle={result.title}
            />

            {/* Timed Structural Breakdown (Regra 3: 0–10s, 10–35s, 35–75s, 75–105s, 105–120s) */}
            {result.breakdown && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                <BreakdownViewer breakdown={result.breakdown} />
              </div>
            )}

            {/* Fact Check Card & Sources (Regras 1, 6 & 8) */}
            <FactCheckCard
              keyFacts={result.keyFacts}
              sources={result.sources}
              searchLinks={result.searchLinks}
              scrapedSource={result.scrapedSource}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 space-y-1">
        <p>
          VIRALNEWS STUDIO — Agente de Notícias Virais baseado no Prompt Mestre Oficial
        </p>
        <p className="text-[11px] text-slate-600">
          Priorizando sempre a Tríade: Veracidade + Retenção + Narração Natural.
        </p>
      </footer>

      {/* Rules Reference Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Teleprompter Fullscreen Modal */}
      {result && (
        <TeleprompterModal
          isOpen={isPrompterOpen}
          onClose={() => setIsPrompterOpen(false)}
          title={result.title}
          script={result.script}
        />
      )}

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={(item) => setResult(item)}
        onClear={() => setHistory([])}
        onDelete={(id) => setHistory((prev) => prev.filter((i) => i.id !== id))}
      />
    </div>
  );
}
