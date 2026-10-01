/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Maximize2, 
  Zap, 
  Layers, 
  Cpu, 
  Camera, 
  ChevronRight, 
  Sparkles, 
  Info,
  ArrowRight,
  Monitor,
  Smartphone,
  CheckCircle2,
  Upload,
  Loader2,
  X,
  Terminal,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fileToCompressedDataUrl } from '../../lib/image';

const ComparisonSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden cursor-ew-resize group shadow-2xl border border-white/10"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* After Image (Upscaled) */}
      <div className="absolute inset-0">
        <img 
          src="https://picsum.photos/seed/upscale-after/1920/1080" 
          alt="Upscaled" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border border-white/20">
          8K Enhanced
        </div>
      </div>

      {/* Before Image (Original) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src="https://picsum.photos/seed/upscale-after/1920/1080?blur=10" 
          alt="Original" 
          className="w-full h-full object-cover grayscale brightness-75"
          style={{ width: `${100 / (sliderPosition / 100)}%` }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border border-white/20">
          Original
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-brand-secondary">
          <Layers className="w-5 h-5 text-brand-secondary" />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="glass-panel p-8 rounded-3xl hover:bg-white/10 transition-colors group"
  >
    <div className="w-12 h-12 bg-brand-accent/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-brand-accent" />
    </div>
    <h3 className="text-xl font-display font-bold mb-3">{title}</h3>
    <p className="text-brand-primary/60 leading-relaxed text-sm">{description}</p>
  </motion.div>
);

export default function App() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<any>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [lastImage, setLastImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUpscalePrompt = async (base64Image: string) => {
    setIsGeneratingPrompt(true);
    setPromptError(null);
    setLastImage(base64Image);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';
      const response = await fetch('/api/agents/lumina8k', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'upscale-prompt', imageBase64: base64Image }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || `Falha ao gerar o prompt (HTTP ${response.status}).`);
      }
      if (!data?.copy_prompt) {
        throw new Error('A IA nao retornou o prompt. Tente novamente.');
      }

      setGeneratedPrompt({
        mode: data.mode || 'image_to_image',
        copy_prompt: data.copy_prompt || '',
        negative_prompt: data.negative_prompt || '',
      });
    } catch (error: any) {
      console.error('Error generating prompt:', error);
      setGeneratedPrompt(null);
      setPromptError(error?.message || 'Erro ao gerar o prompt. Tente novamente.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedPrompt?.copy_prompt) {
      navigator.clipboard.writeText(generatedPrompt.copy_prompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let base64 = '';
    try {
      base64 = await fileToCompressedDataUrl(file);
    } catch {
      base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(String(event.target?.result || ''));
        reader.onerror = () => reject(new Error('Falha ao ler a imagem.'));
        reader.readAsDataURL(file);
      });
    }

    setUploadedImage(base64);
    startProcessing();
    generateUpscalePrompt(base64);
  };

  const startProcessing = () => {
    setIsUploading(true);
    setUploadProgress(0);
    setIsProcessed(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setIsProcessed(true);
        }, 500);
      }
      setUploadProgress(progress);
    }, 300);
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setIsProcessed(false);
    setIsUploading(false);
    setGeneratedPrompt(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-brand-secondary selection:bg-brand-accent selection:text-white flex flex-col">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-panel px-6 py-3 rounded-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <Maximize2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">UPSCALE DE IMAGEM</span>
          </div>
          <div className="text-[10px] font-mono text-brand-primary/40 uppercase tracking-widest hidden sm:block">
            Strict Real Upscale Agent v2.0
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center pt-6 px-6">
        <section className="w-full max-w-4xl py-20 relative">
          <motion.div 
            style={{ opacity, scale }}
            className="text-center relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-full text-xs font-bold mb-8 border border-brand-accent/20"
            >
              <Sparkles className="w-3 h-3" />
              <span>FIDELIDADE ABSOLUTA GARANTIDA</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter mb-8 leading-[0.9]">
              REAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-blue-400 text-glow">UPSCALE</span> COPY
            </h1>
            
            <p className="max-w-xl mx-auto text-brand-primary/60 text-base md:text-lg mb-12 leading-relaxed">
              Melhoria técnica sem alterações. Preservação total de identidade, 
              composição e detalhes originais.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 mb-16">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              
              <AnimatePresence mode="wait">
                {!uploadedImage && !isUploading ? (
                  <motion.button 
                    key="upload-btn"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full md:w-auto bg-brand-accent text-white px-10 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-600 transition-all group shadow-xl shadow-brand-accent/20 text-lg"
                  >
                    <Upload className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                    Enviar Imagem para Análise
                  </motion.button>
                ) : isUploading ? (
                  <motion.div 
                    key="uploading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full md:w-auto glass-panel px-10 py-6 rounded-2xl flex flex-col items-center gap-4 min-w-[300px]"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
                      <span className="text-base font-bold tracking-tight">Processando Upscale...</span>
                      <span className="ml-auto text-sm font-mono text-brand-accent">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-brand-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </motion.div>
                ) : isProcessed ? (
                  <motion.div 
                    key="processed"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-6 w-full"
                  >
                    <div className="glass-panel px-8 py-5 rounded-2xl flex items-center gap-6 w-full max-w-lg">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                        <img src={uploadedImage!} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left flex-grow">
                        <div className={`text-xs font-bold flex items-center gap-1 mb-1 ${promptError ? 'text-red-400' : 'text-brand-accent'}`}>
                          {promptError ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {promptError ? 'FALHA NA ANÁLISE' : 'ANÁLISE CONCLUÍDA'}
                        </div>
                        <div className="text-base font-medium">{promptError ? 'Toque em Tentar novamente' : 'Prompt Técnico Gerado'}</div>
                      </div>
                      <button 
                        onClick={resetUpload}
                        className="p-3 hover:bg-white/10 rounded-full transition-colors"
                        title="Resetar"
                      >
                        <X className="w-5 h-5 text-brand-primary/40" />
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Prompt Showcase */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="w-full"
            >
              <div className="glass-panel p-1 rounded-3xl">
                <div className="bg-brand-secondary/50 rounded-[22px] p-8 text-left relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isGeneratingPrompt ? 'bg-yellow-400 animate-pulse' : 'bg-brand-accent'}`} />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-brand-primary/40">
                        {isGeneratingPrompt ? 'Gerando Prompt Técnico...' : 'Console de Prompt'}
                      </span>
                    </div>
                    {generatedPrompt && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-brand-accent">
                        <Terminal className="w-3 h-3" />
                        <span>STRICT_COPY_ENGINE_V2</span>
                      </div>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {isGeneratingPrompt ? (
                      <motion.div
                        key="loading-prompt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                      >
                        <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
                        <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
                        <div className="h-4 bg-white/5 rounded w-4/6 animate-pulse" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="prompt-text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        {!promptError && (
                          <div className="bg-black/40 rounded-xl p-6 border border-white/5 font-mono text-[13px] text-brand-primary/90 leading-relaxed overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(generatedPrompt || {
                              mode: "image_to_image",
                              copy_prompt: "Aguardando upload para gerar prompt de fidelidade absoluta...",
                              negative_prompt: "..."
                            }, null, 2)}</pre>
                          </div>
                        )}

                        {promptError && (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                              <div className="flex items-center gap-2 font-bold mb-1">
                                <AlertCircle className="w-4 h-4" /> Nao consegui gerar o prompt
                              </div>
                              <div className="text-red-200/90 break-words">{promptError}</div>
                            </div>
                            <button
                              onClick={() => lastImage && generateUpscalePrompt(lastImage)}
                              disabled={isGeneratingPrompt || !lastImage}
                              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-brand-accent text-white px-8 py-4 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-brand-accent/20 disabled:opacity-50"
                            >
                              <RefreshCw className="w-5 h-5" />
                              TENTAR NOVAMENTE
                            </button>
                          </div>
                        )}
                        
                        {generatedPrompt && (
                          <button 
                            onClick={copyToClipboard}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-brand-accent text-white px-8 py-4 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-brand-accent/20"
                          >
                            {copySuccess ? (
                              <>
                                <CheckCircle2 className="w-5 h-5" />
                                COPIADO COM SUCESSO!
                              </>
                            ) : (
                              <>
                                <Upload className="w-5 h-5 rotate-90" />
                                COPIAR CAMPO COPY_PROMPT
                              </>
                            )}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isGeneratingPrompt && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/5 blur-[120px] rounded-full -z-10" />
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-brand-accent rounded flex items-center justify-center">
              <Maximize2 className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight">UPSCALE DE IMAGEM</span>
          </div>
          <div className="text-[10px] text-brand-primary/20 font-mono">
            © 2026 STRICT REAL UPSCALE AGENT. FIDELIDADE ABSOLUTA.
          </div>
        </div>
      </footer>
    </div>
  );
}