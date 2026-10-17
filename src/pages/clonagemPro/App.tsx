import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, FileText, AlertCircle, Copy, Check, Globe, RotateCcw, Zap, Camera, ShieldCheck, Film, HelpCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { VideoUpload } from './components/VideoUpload';
import { analyzeVideo, getStudentGeminiKey, translateAnalysis, uploadVideoToGemini, waitForFileReady } from './services/gemini';
import { optimizeVideo } from './utils/videoOptimizer';
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
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'optimizing' | 'analyzing' | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'brasil' | 'estados_unidos' | 'mexico'>('brasil');
  const [resultsByLanguage, setResultsByLanguage] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastUploaded, setLastUploaded] = useState<{ fileUri: string; fileName: string } | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

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

  const handleLanguageChange = async (newLang: 'brasil' | 'estados_unidos' | 'mexico') => {
    if (newLang === language) return;
    const oldLang = language;
    setLanguage(newLang);

    // 1. If no analysis result is generated yet, just switch target language for upcoming analysis
    if (!result) return;

    // 2. If we already generated or translated this language in cache, switch instantly!
    if (resultsByLanguage[newLang]) {
      setResult(resultsByLanguage[newLang]);
      return;
    }

    // 3. If a result exists on screen, translate and localize it immediately without re-uploading!
    setIsTranslating(true);
    setError(null);
    try {
      const currentRes = result;
      const translated = await translateAnalysis(currentRes, newLang);
      setResultsByLanguage((prev) => ({
        ...prev,
        [oldLang]: currentRes,
        [newLang]: translated,
      }));
      setResult(translated);
    } catch (err: any) {
      console.warn("Falha na adaptação de idioma:", err);
      setLanguage(oldLang);
      setError(
        "Não foi possível traduzir a análise automaticamente: " +
          (err?.message || "") +
          ". Clique no botão 'Re-analisar vídeo original' para gerar a análise diretamente neste idioma."
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAnalyze = async (overrideLang?: 'brasil' | 'estados_unidos' | 'mexico') => {
    if (!file) return;

    const langToUse = overrideLang || language;
    if (overrideLang && overrideLang !== language) {
      setLanguage(overrideLang);
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setUploadProgress(0);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!sessionData?.session?.access_token) {
        throw new Error('Faca login novamente.');
      }

      const key = await getStudentGeminiKey(userId);

      if (!key) {
        throw new Error(
          'Para enviar videos ao Google, adicione sua chave do Google AI Studio em Configuracoes. E ela que autoriza o envio do arquivo.'
        );
      }

      let uploaded: { fileUri: string; fileName: string } | null = null;

      // Reaproveita o upload anterior quando o mesmo arquivo ja foi enviado.
      if (lastUploadedFile === file && lastUploaded) {
        uploaded = lastUploaded;
      } else {
        setUploadStage('uploading');
        setStatusMessage('Enviando o video para o Google...');

        const uploadedResult = await uploadVideoToGemini(file, key, (pct) => {
          setUploadStage('uploading');
          setUploadProgress(pct);
        });

        uploaded = uploadedResult;
        setLastUploaded(uploadedResult);
        setLastUploadedFile(file);
      }

      setUploadStage('analyzing');
      setStatusMessage('Processando o video no Google...');

      await waitForFileReady(uploaded.fileName, key, (message) => {
        setStatusMessage(message);
      });

      setStatusMessage('Analisando o video (pode levar 1 a 2 minutos)...');

      const analysis = await analyzeVideo({
        fileUri: uploaded.fileUri,
        fileName: uploaded.fileName,
        mimeType: file.type || 'video/mp4',
        language: langToUse,
      });

      setResult(analysis || 'Nenhum resultado gerado.');

      if (analysis) {
        setResultsByLanguage((prev) => ({ ...prev, [langToUse]: analysis }));
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || 'Ocorreu um erro ao analisar o video.';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setUploadStage(null);
      setUploadProgress(0);
      setIsOptimizing(false);
      setStatusMessage('');
    }
  };

  // Robust multilingual parsing for Full Video Timeline, Metadata, and Continuity Bible
  let metadataContent = '';
  let bibleContent = '';
  let segments: string[] = [];
  let allI2vPrompts = '';
  let allT2vPrompts = '';

  const extractI2v = (seg: string): string => {
    const m = seg.match(/(?:Prompt\s*(?:em|en|de)?\s*(?:Modo)?\s*(?:Image-to-Video|Imagen a Video|I2V)|(?:Image-to-Video|Imagen a Video|I2V)\s*(?:\([^)]*\))?\s*(?:Mode|Modo)?\s*Prompt|Seedance\s*2\.5\s*(?:I2V|Image-to-Video)|Prompt\s*Seedance\s*2\.5\s*I2V|Prompt Modo I2V|I2V Prompt|Prompt I2V)[^\n]*:?\s*(?:`[^`]*`\s*)?["'“]?([\s\S]*?)(?=(?:["'”]?\s*\n\s*-\s*\*\*|\n\s*-\s*\*\*Prompt|\n\s*-\s*\*\*(?:Text-to-Video|Texto a Video|T2V)|\n\s*5\.|\n\s*---\s*|$))/i);
    if (m && m[1]) return m[1].trim().replace(/^["'`“]|["'`”]$/g, '').trim();
    return '';
  };

  const extractT2v = (seg: string): string => {
    const m = seg.match(/(?:Prompt\s*(?:em|en|de)?\s*(?:Modo)?\s*(?:Text-to-Video|Texto a Video|T2V)|(?:Text-to-Video|Texto a Video|T2V)\s*(?:\([^)]*\))?\s*(?:Master|Maestro)?\s*(?:Mode|Modo)?\s*Prompt|Seedance\s*2\.5\s*(?:T2V|Text-to-Video)|Prompt\s*Seedance\s*2\.5\s*T2V|Text-to-Video Master Prompt|Prompt Text-to-Video|Text-to-Video Prompt|Prompt Modo T2V|Prompt T2V Master|Prompt T2V|Prompt Master de Clonagem|Master AI Video Cloning Prompt|Master Cloning Prompt|Prompt Maestro)[^\n]*:?\s*["'“]?([\s\S]*?)(?=(?:["'”]?\s*\n\s*---|\n\s*###|\n\s*---\s*|$))/i);
    if (m && m[1]) return m[1].trim().replace(/^["'`“]|["'`”]$/g, '').trim();
    return '';
  };

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

    const i2vItems = segments.map((s, i) => {
      const p = extractI2v(s);
      const title = language === 'estados_unidos' 
        ? `// SCENE ${i + 1} - SEEDANCE 2.5 IMAGE-TO-VIDEO PROMPT (@image1 - 100% IDENTICAL)`
        : language === 'mexico'
        ? `// ESCENA ${i + 1} - PROMPT SEEDANCE 2.5 IMAGE-TO-VIDEO (@image1 - 100% IDÉNTICO)`
        : `// CENA ${i + 1} - PROMPT SEEDANCE 2.5 IMAGE-TO-VIDEO (@image1 - 100% IDÊNTICO)`;
      return p ? `${title}\n${p}` : '';
    }).filter(Boolean);
    allI2vPrompts = i2vItems.join('\n\n---\n\n');

    const t2vItems = segments.map((s, i) => {
      const p = extractT2v(s);
      const title = language === 'estados_unidos'
        ? `// SCENE ${i + 1} - SEEDANCE 2.5 MASTER TEXT-TO-VIDEO PROMPT (6-PART FORMULA)`
        : language === 'mexico'
        ? `// ESCENA ${i + 1} - PROMPT MAESTRO SEEDANCE 2.5 TEXT-TO-VIDEO (FÓRMULA DE 6 PARTES)`
        : `// CENA ${i + 1} - MASTER PROMPT SEEDANCE 2.5 TEXT-TO-VIDEO (FÓRMULA DE 6 PARTES)`;
      return p ? `${title}\n${p}` : '';
    }).filter(Boolean);
    allT2vPrompts = t2vItems.join('\n\n---\n\n');
  }

  return (
    <div id="app-root" className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header id="app-header" className="border-b border-zinc-200 bg-white sticky top-0 z-10">
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
                    onClick={() => handleLanguageChange(lang.id)}
                    disabled={isAnalyzing || isOptimizing || isTranslating}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left cursor-pointer active:scale-[0.98]
                      ${isSelected 
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-md ring-2 ring-zinc-900/10' 
                        : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 text-zinc-700'}
                      ${isAnalyzing || isOptimizing || isTranslating ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="text-2xl" role="img" aria-label={lang.label}>{lang.flag}</span>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold tracking-tight ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{lang.label}</span>
                        {isSelected && isTranslating && <Loader2 className="animate-spin text-amber-400 shrink-0" size={14} />}
                      </div>
                      <span className={`text-xs ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>{lang.subtitle}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Translation in Progress Banner */}
            {isTranslating && (
              <div className="mt-3 py-2 px-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center gap-2 text-xs font-medium animate-pulse">
                <Loader2 className="animate-spin text-amber-600 shrink-0" size={14} />
                <span>Adaptando e traduzindo análise para {LANGUAGES.find((l) => l.id === language)?.label}... Mantendo 100% da continuidade e minutagem intactas.</span>
              </div>
            )}

            {/* High-Fidelity Forensic Mode Indicator */}
            <div id="fidelity-mode-badge" className="mt-4 pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Ajuste Fino de Clonagem 100% Idêntica Ativado</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-medium">
                ⭐ Modo I2V (Quadro Zero) + T2V Master • Óptica 50mm • Anti-Morphing
              </span>
            </div>
          </div>

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
                {/* Unified Prompt Copy Header Panel with Interactive Language Switcher */}
                <motion.div
                  id="unified-copy-header-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800 text-white p-6 rounded-3xl shadow-md border border-zinc-800 flex flex-col gap-5"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-zinc-800/80 border border-zinc-700/60 rounded-2xl flex items-center justify-center shrink-0">
                        <Sparkles size={24} className="text-amber-400" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base">
                            {language === 'estados_unidos'
                              ? 'Prompts Ready for Seedance 2.5 (ByteDance) - 100% Identical Cloning!'
                              : language === 'mexico'
                              ? '¡Prompts Listos para Seedance 2.5 (ByteDance) - Clonación 100% Idéntica!'
                              : 'Prompts Prontos para Seedance 2.5 (ByteDance) - Clonagem 100% Idêntica!'}
                          </h3>
                          <span className="text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            ⭐ Seedance 2.5 (ByteDance)
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 max-w-xl">
                          {language === 'estados_unidos'
                            ? 'Prompts strictly adapted for ByteDance Seedance 2.5: use Image-to-Video Mode (@image1 Frame Zero) for 100% identical facial replication, or Text-to-Video Master Mode with the official 6-part formula and time-coded beats.'
                            : language === 'mexico'
                            ? 'Prompts adaptados rigurosamente para ByteDance Seedance 2.5: usa el Modo Imagen a Video (@image1 Cuadro Cero) para réplica facial 100% idéntica, o el Modo Maestro Texto a Video con la fórmula oficial de 6 partes y beats temporales.'
                            : 'Prompts calibrados especificamente para o Seedance 2.5 da ByteDance: use o Modo Image-to-Video (@image1 Quadro Zero) para réplica facial 100% idêntica sem morphing, ou o Modo T2V Master com a fórmula oficial de 6 partes e beats temporais.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                      {allI2vPrompts && (
                        <CopyButton
                          id="btn-copy-all-i2v"
                          text={allI2vPrompts}
                          label={
                            language === 'estados_unidos'
                              ? '⭐ Copy All I2V Prompts (Seedance 2.5)'
                              : language === 'mexico'
                              ? '⭐ Copiar Todos los Prompts I2V (Seedance 2.5)'
                              : '⭐ Copiar Todos os Prompts I2V (Seedance 2.5)'
                          }
                          variant="primary"
                        />
                      )}
                      {allT2vPrompts && (
                        <CopyButton
                          id="btn-copy-all-t2v"
                          text={allT2vPrompts}
                          label={
                            language === 'estados_unidos'
                              ? 'Copy All T2V Prompts (Seedance 2.5)'
                              : language === 'mexico'
                              ? 'Copiar Todos los Prompts T2V (Seedance 2.5)'
                              : 'Copiar Todos os Prompts T2V (Seedance 2.5)'
                          }
                          variant="outline"
                        />
                      )}
                      <CopyButton
                        id="btn-copy-total-prompt"
                        text={result}
                        label={
                          language === 'estados_unidos'
                            ? 'Copy Full Analysis'
                            : language === 'mexico'
                            ? 'Copiar Análisis Completo'
                            : 'Copiar Análise Completa'
                        }
                        variant="outline"
                      />
                    </div>
                  </div>

                  {/* Interactive Result Language Bar */}
                  <div id="results-language-bar" className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                        <Globe size={14} className="text-amber-400" />
                        {language === 'estados_unidos'
                          ? 'Prompt & Script Language:'
                          : language === 'mexico'
                          ? 'Idioma de Prompts y Guion:'
                          : 'Idioma dos Prompts & Roteiro:'}
                      </span>
                      <div className="inline-flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl gap-1">
                        {LANGUAGES.map((l) => {
                          const isActive = language === l.id;
                          return (
                            <button
                              key={`results-lang-${l.id}`}
                              id={`results-lang-btn-${l.id}`}
                              onClick={() => handleLanguageChange(l.id)}
                              disabled={isTranslating || isAnalyzing}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-amber-400 text-zinc-950 shadow-md font-bold'
                                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                              } ${isTranslating ? 'opacity-70 cursor-wait' : ''}`}
                              title={`Alternar para ${l.label}`}
                            >
                              <span>{l.flag}</span>
                              <span>{l.label}</span>
                              {isActive && isTranslating && <Loader2 className="animate-spin text-zinc-950" size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {file && (
                      <button
                        id="btn-reanalyze-in-language"
                        onClick={() => handleAnalyze()}
                        disabled={isAnalyzing || isOptimizing || isTranslating}
                        className="text-xs text-zinc-400 hover:text-zinc-200 underline font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                        title={
                          language === 'estados_unidos'
                            ? `Re-analyze original video from scratch in ${LANGUAGES.find((l) => l.id === language)?.label}`
                            : language === 'mexico'
                            ? `Re-analizar video original desde cero en ${LANGUAGES.find((l) => l.id === language)?.label}`
                            : `Re-analisar vídeo original do zero em ${LANGUAGES.find((l) => l.id === language)?.label}`
                        }
                      >
                        <RotateCcw size={12} />
                        {language === 'estados_unidos'
                          ? `Re-analyze original video in ${LANGUAGES.find((l) => l.id === language)?.label}`
                          : language === 'mexico'
                          ? `Re-analizar video original en ${LANGUAGES.find((l) => l.id === language)?.label}`
                          : `Re-analisar vídeo original em ${LANGUAGES.find((l) => l.id === language)?.label}`}
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Translation notification banner in results view */}
                {isTranslating && (
                  <motion.div
                    id="translating-indicator"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium"
                  >
                    <Loader2 className="animate-spin text-amber-400 shrink-0" size={18} />
                    <div className="flex-1">
                      <div className="text-white font-semibold">
                        {language === 'estados_unidos'
                          ? `Adapting and translating complete analysis into ${LANGUAGES.find((l) => l.id === language)?.label}...`
                          : language === 'mexico'
                          ? `Adaptando y traduciendo todo el análisis al ${LANGUAGES.find((l) => l.id === language)?.label}...`
                          : `Adaptando e traduzindo toda a análise para ${LANGUAGES.find((l) => l.id === language)?.label}...`}
                      </div>
                      <div className="text-xs text-zinc-300">
                        {language === 'estados_unidos'
                          ? 'Preserving 100% forensic timeline (0s-8s), speech attribution, 50mm optical parameters, and Seedance 2.5 I2V / T2V Prompts.'
                          : language === 'mexico'
                          ? 'Preservando el 100% del cronograma forense (0s-8s), atribución de voz, parámetros ópticos de 50mm y Prompts I2V / T2V de Seedance 2.5.'
                          : 'Preservando 100% da minutagem forense (0s-8s), marcas de fala, parâmetros ópticos e Prompts Seedance 2.5 I2V / T2V.'}
                      </div>
                    </div>
                  </motion.div>
                )}

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
                      {language === 'estados_unidos'
                        ? 'Full Video Cloning Timeline & Plan (Seedance 2.5)'
                        : language === 'mexico'
                        ? 'Plan y Cronograma de Clonación Total (Seedance 2.5)'
                        : 'Planejamento de Clonagem do Vídeo Inteiro (Seedance 2.5)'}
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
                        {language === 'estados_unidos'
                          ? 'Forensic Continuity & Character DNA'
                          : language === 'mexico'
                          ? 'Biblia de Continuidad y ADN de Personajes'
                          : 'Bíblia de Continuidade e Clonagem de Personagens'}
                      </div>
                      <CopyButton id="btn-copy-bible-segment" text={bibleContent} label={language === 'estados_unidos' ? 'Copy Bible' : language === 'mexico' ? 'Copiar Biblia' : 'Copiar Bíblia'} variant="outline" />
                    </div>
                    <div className="p-6 text-sm markdown-body prose-sm">
                      <Markdown>{bibleContent}</Markdown>
                    </div>
                  </motion.div>
                )}

                {/* Forensic Fine-Tuning Guide for 100% Identical Video Cloning in Seedance 2.5 */}
                <motion.div
                  id="fine-tuning-guide-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-100">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
                      <Camera size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                        {language === 'estados_unidos'
                          ? 'Fine-Tuning Guide: How to Achieve 100% Identical Video Cloning in Seedance 2.5'
                          : language === 'mexico'
                          ? 'Guía de Ajuste Fino: Cómo Lograr una Clonación 100% Idéntica en Seedance 2.5'
                          : 'Guia de Ajuste Fino: Como Fazer o Vídeo Sair 100% Idêntico no Seedance 2.5'}
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Seedance 2.5 (ByteDance)
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {language === 'estados_unidos'
                          ? 'Follow these 4 steps in ByteDance Seedance 2.5 (also fully compatible with Kling, Runway, Wan 2.1):'
                          : language === 'mexico'
                          ? 'Sigue estos 4 pasos en ByteDance Seedance 2.5 (también compatible con Kling, Runway, Wan 2.1):'
                          : 'Siga estes 4 passos no Seedance 2.5 da ByteDance (também compatível com Kling, Runway, Wan 2.1):'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/70 flex flex-col gap-1.5">
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                        <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                        <span>{language === 'estados_unidos' ? 'Identity Anchor' : language === 'mexico' ? 'Anclaje de Identidad' : 'O Segredo da Identidade'}</span>
                      </div>
                      <p className="text-zinc-600 leading-relaxed text-[11px]">
                        {language === 'estados_unidos'
                          ? 'AI video models alter faces when generating from pure text. For 100% identical face and body, Seedance 2.5 needs a starting keyframe anchor (@image1).'
                          : language === 'mexico'
                          ? 'Los modelos de IA cambian rostros cuando generan solo con texto. Para cara y cuerpo 100% idénticos, Seedance 2.5 necesita un fotograma clave como anclaje (@image1).'
                          : 'Vídeos de IA mudam de rosto quando gerados apenas por texto. Para rosto e corpo 100% idênticos, o Seedance 2.5 precisa do primeiro quadro como âncora (@image1).'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/70 flex flex-col gap-1.5">
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                        <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                        <span>{language === 'estados_unidos' ? 'Extract Frame Zero' : language === 'mexico' ? 'Extrae el Cuadro Cero' : 'Extraia o Quadro Zero'}</span>
                      </div>
                      <p className="text-zinc-600 leading-relaxed text-[11px]">
                        {language === 'estados_unidos'
                          ? 'Save or take a screenshot of Frame Zero (00:00:00 or scene start) from your original video to use as @image1.'
                          : language === 'mexico'
                          ? 'Guarda o toma captura del primer fotograma (Cuadro Cero en 00:00:00 o inicio de escena) de tu video original para usar como @image1.'
                          : 'Tire um print ou salve o primeiro quadro (Quadro Zero no tempo 00:00:00 ou início da cena) do seu vídeo original para usar como @image1.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex flex-col gap-1.5">
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                        <span>{language === 'estados_unidos' ? 'Use Seedance 2.5 I2V' : language === 'mexico' ? 'Usa Prompt I2V Seedance 2.5' : 'Use o Prompt I2V Seedance 2.5'}</span>
                      </div>
                      <p className="text-emerald-900/90 leading-relaxed text-[11px]">
                        {language === 'estados_unidos'
                          ? 'In Seedance 2.5, select Image-to-Video (I2V), upload Frame Zero as @image1, and paste the I2V Prompt. It locks the biometric facial DNA and applies exact time-coded beats.'
                          : language === 'mexico'
                          ? 'En Seedance 2.5, selecciona Imagen a Video (I2V), sube el Cuadro Cero como @image1 y pega el Prompt I2V. Bloquea el ADN biométrico facial y aplica beats temporales con sincronía labial nativa.'
                          : 'No Seedance 2.5, selecione Image-to-Video (I2V), suba o Quadro Zero como @image1 e cole o Prompt I2V. Ele ativa a trava biométrica do @image1 e executa os beats temporais com sincronia labial nativa.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/70 flex flex-col gap-1.5">
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                        <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                        <span>{language === 'estados_unidos' ? 'Or Seedance 2.5 T2V (6 Parts)' : language === 'mexico' ? 'O T2V Master (6 Partes)' : 'Ou Prompt T2V (6 Partes)'}</span>
                      </div>
                      <p className="text-zinc-600 leading-relaxed text-[11px]">
                        {language === 'estados_unidos'
                          ? 'For pure text-to-video, use the T2V Master Prompt, structured in Seedance 2.5 official 6-part formula with locked 50mm optics and native audio.'
                          : language === 'mexico'
                          ? 'Para texto puro, usa el Prompt Maestro T2V, estructurado en la fórmula oficial de 6 partes de Seedance 2.5 con óptica fija de 50mm y audio nativo.'
                          : 'Se preferir gerar por texto puro sem imagem, use o Prompt T2V Master, formatado na fórmula oficial de 6 partes do Seedance 2.5 com beats temporais e áudio nativo.'}
                      </p>
                    </div>
                  </div>
                </motion.div>

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
                        
                        // Extract I2V Prompt (Image-to-Video / Quadro Zero / Start Frame)
                        const i2vPrompt = extractI2v(segment);

                        // Extract T2V Prompt (Text-to-Video Master Prompt)
                        const t2vPrompt = extractT2v(segment);

                        // Fallback generic prompt extraction if dual prompts were not separated
                        let fallbackPrompt = '';
                        if (!i2vPrompt && !t2vPrompt) {
                          const aiPromptMatch = segment.match(/(?:Prompt de Clonagem|Prompt Master|Hyper-Descriptive AI Video Cloning Prompt|Optimized AI Video Cloning Prompt|Optimized AI Prompt|Prompt de Clonación|Prompt IA Otimizado|3\.\s*\*\*Prompt|Prompt|Versão "Prompt"|4\.|5\.|[Pp]rompt de IA):?\s*([\s\S]+)$/i);
                          fallbackPrompt = aiPromptMatch ? aiPromptMatch[1].trim().replace(/^["'`“]|["'`”]$/g, '').trim() : segment.trim();
                        }

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
                                  {i2vPrompt && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full">
                                      ⭐ Modo I2V + T2V Duplo
                                    </span>
                                  )}
                                </div>
                                {uniqueChars.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <span className="text-[11px] text-zinc-500 font-medium">
                                      {language === 'estados_unidos' ? 'Characters in scene:' : language === 'mexico' ? 'Personajes en escena:' : 'Personagens na cena:'}
                                    </span>
                                    {uniqueChars.map((c, ci) => (
                                      <span key={ci} className="text-[11px] font-mono font-medium bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">
                                        [{c}]
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {i2vPrompt ? (
                                  <>
                                    <CopyButton 
                                      id={`btn-copy-i2v-${index}`} 
                                      text={i2vPrompt} 
                                      label={language === 'estados_unidos' ? "⭐ Copy I2V Prompt (Seedance 2.5)" : language === 'mexico' ? "⭐ Copiar Prompt I2V (Seedance 2.5)" : "⭐ Copiar Prompt I2V (Seedance 2.5)"} 
                                      variant="primary" 
                                    />
                                    {t2vPrompt && (
                                      <CopyButton 
                                        id={`btn-copy-t2v-${index}`} 
                                        text={t2vPrompt} 
                                        label={language === 'estados_unidos' ? "Copy T2V Master (Seedance 2.5)" : language === 'mexico' ? "Copiar Prompt T2V (Seedance 2.5)" : "Copiar Prompt T2V (Seedance 2.5)"} 
                                        variant="outline" 
                                      />
                                    )}
                                  </>
                                ) : t2vPrompt ? (
                                  <CopyButton 
                                    id={`btn-copy-t2v-${index}`} 
                                    text={t2vPrompt} 
                                    label={language === 'estados_unidos' ? "Copy T2V Master (Seedance 2.5)" : language === 'mexico' ? "Copiar Prompt Maestro (Seedance 2.5)" : "Copiar Master Prompt (Seedance 2.5)"} 
                                    variant="primary" 
                                  />
                                ) : (
                                  <CopyButton 
                                    id={`btn-copy-ai-prompt-${index}`} 
                                    text={fallbackPrompt} 
                                    label={language === 'estados_unidos' ? "Copy Seedance Prompt" : language === 'mexico' ? "Copiar Prompt Seedance" : "Copiar Prompt Seedance"} 
                                    variant="primary" 
                                  />
                                )}
                                <CopyButton 
                                  id={`btn-copy-segment-${index}`} 
                                  text={segment.trim()} 
                                  label={language === 'estados_unidos' ? "Copy Full Scene" : language === 'mexico' ? "Copiar Escena Completa" : "Copiar Cena Completa"} 
                                  variant="outline" 
                                />
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
