import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, FileText, AlertCircle, Copy, Check, Globe, RotateCcw, Zap } from 'lucide-react';
import Markdown from 'react-markdown';
import { VideoUpload } from './VideoUpload';
import { analyzeVideo, uploadVideoToGemini, waitForFileReady } from './geminiService';
import { optimizeVideo } from './videoOptimizer';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

function CopyButton({ text, label, variant = 'default', id }: { text: string; label?: string; variant?: 'default' | 'primary' | 'outline'; id: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  if (variant === 'primary') {
    return (
      <button
        id={id}
        onClick={handleCopy}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm tracking-wide rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
      >
        {copied ? (
          <>
            <Check size={16} className="text-emerald-400" />
            <span>Prompt Completo Copiado!</span>
          </>
        ) : (
          <>
            <Copy size={16} />
            <span>{label || 'Copiar Prompt Completo'}</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        id={id}
        onClick={handleCopy}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-950 font-semibold text-xs rounded-lg transition-all bg-white hover:bg-zinc-50 shadow-sm active:scale-95 cursor-pointer"
      >
        {copied ? (
          <>
            <Check size={14} className="text-emerald-600" />
            <span>Copiado!</span>
          </>
        ) : (
          <>
            <Copy size={14} />
            <span>{label || 'Copiar'}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      id={id}
      onClick={handleCopy}
      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 rounded-lg cursor-pointer"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      {label || (copied ? 'Copiado!' : 'Copiar')}
    </button>
  );
}

const LANGUAGES = [
  { id: 'brasil', label: 'Brasil', flag: '🇧🇷', subtitle: 'Português' },
  { id: 'estados_unidos', label: 'Estados Unidos', flag: '🇺🇸', subtitle: 'English' },
  { id: 'mexico', label: 'México', flag: '🇲🇽', subtitle: 'Español' },
] as const;

export default function App() {
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'optimizing' | 'analyzing' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'brasil' | 'estados_unidos' | 'mexico'>('brasil');

  const handleManualOptimize = async () => {
    if (!file || isAnalyzing || isOptimizing) return;
    try {
      setIsOptimizing(true);
      setOptimizationProgress(0);
      const optimized = await optimizeVideo(file, 18, (p) => setOptimizationProgress(p));
      if (optimized && optimized !== file) {
        setFile(optimized);
      }
      setError(null);
    } catch (err: any) {
      console.warn("Falha na otimização manual:", err);
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(0);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    if (!user?.id) {
      setError('Faca login novamente.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setUploadProgress(0);
    setStatusMessage('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) throw new Error('Faca login novamente.');

      const { data: secrets } = await supabase
        .from('user_secrets')
        .select('gemini_api_key')
        .eq('id', user.id)
        .maybeSingle();

      const key = String(secrets?.gemini_api_key || '').trim();

      if (!key) {
        throw new Error(
          'Para enviar videos ao Google, adicione sua chave do Google AI Studio em Configuracoes.'
        );
      }

      setUploadStage('optimizing');
      const prepared = await optimizeVideo(file, 18, (pct) => {
        setUploadStage('optimizing');
        setOptimizationProgress(pct);
      });

      setUploadStage('uploading');
      setStatusMessage('Enviando o video para o Google...');

      const uploaded = await uploadVideoToGemini(prepared, key, (pct) => {
        setUploadStage('uploading');
        setUploadProgress(pct);
      });

      setUploadStage('analyzing');
      await waitForFileReady(uploaded.fileName, key, (message) => {
        setStatusMessage(message);
      });

      setStatusMessage('Analisando o video (pode levar 1-2 minutos)...');

      const analysis = await analyzeVideo(
        {
          fileUri: uploaded.fileUri,
          fileName: uploaded.fileName,
          mimeType: prepared.type || 'video/mp4',
          language,
        },
        accessToken
      );

      setResult(analysis || 'Nenhum resultado gerado.');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Ocorreu um erro ao analisar o video.');
    } finally {
      setIsAnalyzing(false);
      setUploadStage(null);
      setUploadProgress(0);
      setOptimizationProgress(0);
      setStatusMessage('');
    }
  };

  // Robust multilingual parsing for Full Video Timeline, Metadata, and Continuity Bible
  let metadataContent = '';
  let bibleContent = '';
  let segments: string[] = [];

  if (result) {
    // 1. Extract Duration & Planning Metadata (if generated)
    const metaMatch = result.match(/(?:#\s*(?:METADADOS|DURATION METADATA|METADATOS)[^\n]*)([\s\S]*?)(?=#\s*(?:BÍBLIA|BIBLIA|FORENSIC CONTINUITY|CHARACTER CONTINUITY|CRONOGRAMA|SCENE TIMELINE|TIMELINE|CENAS|ESCENAS)|(?:\n\s*---\s*\n\s*###\s*(?:SEGMENTO|CENA|SCENE|ESCENA))|$)/i);
    if (metaMatch) {
      metadataContent = metaMatch[1].trim();
    }

    // 2. Extract Continuity Bible
    const bibleRegex = /(?:#\s*(?:BÍBLIA|BIBLIA|FORENSIC CONTINUITY|CHARACTER CONTINUITY)[^\n]*)([\s\S]*?)(?=#\s*(?:CRONOGRAMA|SCENE TIMELINE|TIMELINE|CENAS|ESCENAS|GENERATED SCENES|SCHEDULE)|(?:\n\s*---\s*\n\s*###\s*(?:SEGMENTO|CENA|SCENE|ESCENA))|$)/i;
    const match = result.match(bibleRegex);
    if (match) {
      bibleContent = match[1].trim();
    }

    // 3. Extract all Scene Segments across the full video timeline
    const schedMatch = result.match(/(?:#\s*(?:CRONOGRAMA|SCENE TIMELINE|TIMELINE|CENAS|ESCENAS|GENERATED SCENES|SCHEDULE)[^\n]*)/i);
    let scenesText = '';
    if (schedMatch && schedMatch.index !== undefined) {
      scenesText = result.slice(schedMatch.index + schedMatch[0].length);
    } else {
      scenesText = result;
    }

    // Split scenes on standard delimiters ('---' or '### SEGMENTO/CENA/SCENE/ESCENA')
    const rawSegments = scenesText
      .split(/(?=(?:^|\n)\s*---)|(?=(?:^|\n)\s*###\s*(?:SEGMENTO|CENA|SCENE|ESCENA|PARTE|PART)\b)/i)
      .map(s => s.replace(/^\s*---\s*/, '').trim())
      .filter(s => {
        if (s.length < 20) return false;
        const low = s.toLowerCase();
        // Discard headers if captured as stand-alone items
        if (
          low.startsWith('# bíblia') || 
          low.startsWith('# biblia') || 
          low.startsWith('# cronograma') || 
          low.startsWith('# scene timeline') ||
          low.startsWith('# metadados') ||
          low.startsWith('# duration metadata') ||
          low.startsWith('# metadatos')
        ) return false;
        return true;
      });

    segments = rawSegments;
  }

  return (
    <div id="app-root" className="flex flex-col">
      {/* Header */}
      <header id="app-header" className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">VideoPrompter AI</h1>
          </div>
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
            Cinematic AI Cloning Engine
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Transforme vídeos em prompts detalhados <span className="text-zinc-400 font-medium text-2xl block mt-2">CRIADO POR HALAM SILVA</span>
          </h2>
          <p className="text-lg text-zinc-600">
            Análise cinematográfica e clonagem idêntica por IA: ancoragem fotográfica milimétrica desde o primeiro quadro (00:00:00), biometria facial forense ([P1], [P2]), sincronização labial fonética estrita e Master Prompts hiper-descritivos para Kling 1.5, Runway Gen-3, Luma, Sora e Wan 2.1.
          </p>
        </div>

        <div className="space-y-8">
          <VideoUpload 
            onFileSelect={setFile} 
            selectedFile={file} 
            onClear={() => {
              setFile(null);
              setResult(null);
              setError(null);
              setUploadStage(null);
            }}
            disabled={isAnalyzing}
            isOptimizing={isOptimizing}
            optimizationProgress={optimizationProgress}
            uploadProgress={uploadProgress}
            uploadStage={uploadStage}
            onOptimizeManual={handleManualOptimize}
          />

          {/* Language Selector Component */}
          <div id="language-selector-container" className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-sm max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-650">
                  <Globe size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">Idioma do Prompt</h4>
                  <p className="text-xs text-zinc-500">Output language for characters and scenes script</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded tracking-wide uppercase self-start sm:self-auto">
                Target Language
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.id;
                return (
                  <button
                    key={lang.id}
                    id={`lang-btn-${lang.id}`}
                    onClick={() => setLanguage(lang.id)}
                    disabled={isAnalyzing || isOptimizing}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left cursor-pointer active:scale-[0.98]
                      ${isSelected 
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-md' 
                        : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 text-zinc-700'}
                      ${isAnalyzing || isOptimizing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="text-2xl" role="img" aria-label={lang.label}>{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold tracking-tight ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{lang.label}</span>
                      <span className={`text-xs ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>{lang.subtitle}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* High-Fidelity Forensic Mode Indicator */}
            <div id="fidelity-mode-badge" className="mt-4 pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Modo de Clonagem Idêntica Ativado</span>
              </div>
              <span className="text-[11px] text-zinc-500">
                Biometria Facial • FACS • Iluminação 3-Pontos • Master Prompts Internacionais
              </span>
            </div>
          </div>

          {statusMessage && (
            <p className="text-center text-xs font-semibold text-zinc-500 pt-1">{statusMessage}</p>
          )}

          <div className="flex justify-center">
            <button
              id="btn-generate-prompts"
              onClick={() => handleAnalyze()}
              disabled={!file || isAnalyzing || isOptimizing}
              className={`
                px-8 py-3 rounded-full font-semibold transition-all flex items-center gap-2
                ${!file || isAnalyzing || isOptimizing 
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl active:scale-95'}
              `}
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Otimizando vídeo ({optimizationProgress}%)...
                </>
              ) : uploadStage === 'uploading' ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Enviando vídeo ({uploadProgress}%)...
                </>
              ) : uploadStage === 'analyzing' || isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analisando em {LANGUAGES.find((l) => l.id === language)?.label || 'Português'}...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Gerar Prompts ({LANGUAGES.find((l) => l.id === language)?.label})
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                id="alert-error-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-amber-50 border border-amber-200 text-zinc-800 p-5 rounded-2xl flex flex-col gap-4 max-w-2xl mx-auto shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                    <AlertCircle size={20} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="font-semibold text-sm text-zinc-900">
                      {error.includes("Acesso negado") || error.includes("Permissão negada") || error.includes("403")
                        ? "Configuração de Chave de API Necessária"
                        : error.includes("413") || error.includes("muito grande")
                        ? "Limite de Tamanho Excedido (Erro 413)"
                        : "Atenção ao Processar"}
                    </h4>
                    <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">{error}</p>
                    {(error.includes("aistudio.google.com") || error.includes("Settings > Secrets") || error.includes("denied access")) && (
                      <div className="mt-3 p-3 bg-amber-150/60 bg-amber-100/60 rounded-xl text-xs text-zinc-700 space-y-1.5 border border-amber-200/80">
                        <div className="font-semibold text-zinc-900">Como resolver em 3 passos:</div>
                        <ol className="list-decimal list-inside space-y-1 text-zinc-650">
                          <li>
                            Acesse <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-medium text-amber-900 hover:text-amber-950">aistudio.google.com/app/apikey</a> e crie uma chave em um novo projeto Google Cloud ativo.
                          </li>
                          <li>
                            No menu lateral ou topo do Google AI Studio, clique em <strong>Settings &gt; Secrets</strong>.
                          </li>
                          <li>
                            Adicione o segredo com o nome <strong>GEMINI_API_KEY</strong> colando a nova chave, e clique no botão abaixo.
                          </li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
                {file && !isAnalyzing && !isOptimizing && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
                    <button
                      id="btn-retry-analysis"
                      onClick={() => handleAnalyze()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow transition-all active:scale-95 cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      Tentar Novamente
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {result && (
              <div id="results-wrapper" className="space-y-8">
                {/* Unified Prompt Copy Header Panel */}
                <motion.div
                  id="unified-copy-header-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white p-6 rounded-3xl shadow-md border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-700/60 rounded-xl flex items-center justify-center">
                      <Sparkles size={22} className="text-yellow-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">Prompt de Produção Gerado!</h3>
                        <span className="text-[11px] font-semibold bg-zinc-700/80 px-2 py-0.5 rounded-full flex items-center gap-1 text-zinc-200">
                          {LANGUAGES.find((l) => l.id === language)?.flag} {LANGUAGES.find((l) => l.id === language)?.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        Histórico completo, Bíblia de Continuidade e Diálogos encaixados por bloco de tempo traduzidos e prontos para clonagem.
                      </p>
                    </div>
                  </div>
                  <CopyButton id="btn-copy-total-prompt" text={result} label="Copiar Prompt Completo" variant="primary" />
                </motion.div>

                {/* Video Duration & Full Cloning Plan if present */}
                {metadataContent && (
                  <motion.div
                    id="metadata-section-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950 shadow-xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 mb-1.5">
                      <Sparkles size={16} className="text-emerald-600" />
                      Planejamento de Clonagem do Vídeo Inteiro (100% da Linha do Tempo)
                    </div>
                    <div className="text-xs markdown-body text-emerald-900/90 leading-relaxed font-mono">
                      <Markdown>{metadataContent}</Markdown>
                    </div>
                  </motion.div>
                )}

                {/* Continuity Bible Section if output contains it */}
                {bibleContent && (
                  <motion.div
                    id="bible-section-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden"
                  >
                    <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-900 font-bold">
                        <FileText size={18} className="text-zinc-500" />
                        Bíblia de Continuidade e Clonagem de Personagens
                      </div>
                      <CopyButton id="btn-copy-bible-segment" text={bibleContent} label="Copiar Bíblia" variant="outline" />
                    </div>
                    <div className="p-6 text-sm markdown-body prose-sm">
                      <Markdown>{bibleContent}</Markdown>
                    </div>
                  </motion.div>
                )}

                {/* 8s Scene Breakdowns */}
                {segments.length > 0 && (
                  <div id="scene-breakdowns-list" className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2">
                      <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                        <Sparkles size={20} className="text-zinc-500" />
                        Cenas do Vídeo Inteiro (Prompts de Clonagem Otimizados)
                      </h3>
                      <span className="text-xs bg-zinc-900 text-white font-mono px-3 py-1 rounded-full w-fit">
                        {segments.length} {segments.length === 1 ? 'Cena' : 'Cenas Consecutivas'} (100% Coberto)
                      </span>
                    </div>

                    <div className="grid gap-6">
                      {segments.map((segment, index) => {
                        // Extract scene title elegantly
                        const titleMatch = segment.match(/^(?:###\s*)?(?:SEGMENTO|SEGMENT|ESCENA|CENA|SCENE)?[:\s-]*([^\n]+)/i);
                        let title = `Cena ${index + 1}`;
                        if (titleMatch && titleMatch[1]) {
                          const clean = titleMatch[1].replace(/^[#\s:-]+/, '').trim();
                          if (clean.length > 2) title = clean;
                        }

                        // Extract character tags present in this specific scene
                        const charRegex = /\[(P\d+(?:\s*-\s*[^\]]+)?)\]/g;
                        const charMatches = Array.from(segment.matchAll(charRegex)).map(m => m[1]);
                        const uniqueChars = Array.from(new Set(charMatches)).slice(0, 4);
                        
                        // Extract distinct prompts if present
                        const masterMatch = segment.match(/(?:Master Cloning Prompt[^\n]*|\*Master Cloning Prompt[^\n]*):?\s*([\s\S]+)$/i);
                        let masterPrompt = masterMatch ? masterMatch[1].trim() : '';
                        masterPrompt = masterPrompt.replace(/^["'`]|["'`]$/g, '').trim();

                        const directMatch = segment.match(/(?:\*Prompt Direto[^\n]*|\*Direct Script Prompt[^\n]*|\*Prompt Directo[^\n]*|Prompt Direto[^\n]*):?\s*([\s\S]*?)(?=(?:\*Master Cloning Prompt|\*Prompt Master|Master Cloning Prompt|---|$))/i);
                        let directPrompt = directMatch ? directMatch[1].trim() : '';
                        directPrompt = directPrompt.replace(/^["'`]|["'`]$/g, '').trim();

                        // Fallback generic prompt extraction
                        const aiPromptMatch = segment.match(/(?:Prompt de Clonagem|Hyper-Descriptive AI Video Cloning Prompt|Optimized AI Video Cloning Prompt|Optimized AI Prompt|Prompt de Clonación|Prompt IA Otimizado|3\.\s*\*\*Prompt|Prompt|Versão "Prompt"|4\.|5\.|[Pp]rompt de IA):?\s*([\s\S]+)$/i);
                        let aiPrompt = aiPromptMatch ? aiPromptMatch[1].trim() : segment.trim();
                        aiPrompt = aiPrompt.replace(/^["'`]|["'`]$/g, '').trim();

                        return (
                          <motion.div
                            id={`scene-segment-card-${index}`}
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden hover:border-zinc-300 transition-colors"
                          >
                            <div className="border-b border-zinc-100 px-5 py-3.5 bg-zinc-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-zinc-900">{title}</span>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                    <Sparkles size={11} className="text-emerald-600" />
                                    Continuidade Embutida
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200/80 px-2 py-0.5 rounded-full">
                                    <Sparkles size={11} className="text-blue-600" />
                                    Características Completas Pré-Fala
                                  </span>
                                </div>
                                {uniqueChars.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <span className="text-[11px] text-zinc-500 font-medium">Personagens na cena:</span>
                                    {uniqueChars.map((c, ci) => (
                                      <span key={ci} className="text-[11px] font-mono font-medium bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">
                                        [{c}]
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {masterPrompt ? (
                                  <>
                                    <CopyButton id={`btn-copy-master-${index}`} text={masterPrompt} label="Copiar Master Prompt (Continuidade Embutida)" variant="primary" />
                                    {directPrompt && (
                                      <CopyButton id={`btn-copy-direct-${index}`} text={directPrompt} label="Copiar Prompt no Idioma" variant="outline" />
                                    )}
                                  </>
                                ) : (
                                  <CopyButton id={`btn-copy-ai-prompt-${index}`} text={aiPrompt} label="Copiar Prompt de Clonagem" variant="outline" />
                                )}
                                <CopyButton id={`btn-copy-segment-${index}`} text={segment.trim()} label="Copiar Cena Completa" variant="outline" />
                              </div>
                            </div>
                            <div className="p-6 text-sm markdown-body prose-sm">
                              <Markdown>{segment.trim()}</Markdown>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Raw Full Output Details Panel */}
                <motion.div
                  id="raw-detailed-analysis-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden"
                >
                  <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold">
                      <FileText size={18} className="text-zinc-500" />
                      Texto Completo da Análise (Markdown)
                    </div>
                    <CopyButton id="btn-copy-raw-result" text={result} label="Copiar Texto Inteiro" variant="outline" />
                  </div>
                  <div className="p-8 markdown-body">
                    <Markdown>{result}</Markdown>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer id="app-footer" className="border-t border-zinc-200 py-8 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-zinc-400">
            &copy; 2026 VideoPrompter AI. Criado por <span className="font-semibold text-zinc-650">HALAM SILVA</span>.
          </p>
          <p className="text-xs text-zinc-300 mt-2 uppercase tracking-tighter">
            Criado para análise criativa de conteúdo
          </p>
        </div>
      </footer>
    </div>
  );
}
