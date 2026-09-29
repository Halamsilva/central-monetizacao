import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  X,
  Check,
  Search,
  Cpu,
  Layers,
  CheckCircle2,
  RefreshCw,
  Eye,
  Box,
  Compass
} from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { SampleProduct, ProductDiagnostic } from '../types';
import { supabase } from '../../../lib/supabase';
import { describeHttpError } from '../../../lib/httpError';

interface ImageUploaderProps {
  onGenerate: (data: {
    imageBase64: string;
    mimeType: string;
    brandName?: string;
    visualFocus?: string;
    ctaType?: string;
  }) => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onGenerate,
  isLoading,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [brandName, setBrandName] = useState<string>('');
  const [visualFocus, setVisualFocus] = useState<string>('');
  const [ctaType, setCtaType] = useState<string>('TikTok Shop ("carrinho laranja")');
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');

  // Dedicated AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diagnostic, setDiagnostic] = useState<ProductDiagnostic | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycle loading step messages during processing
  useEffect(() => {
    if (!isLoading) {
      setLoadingStep('');
      return;
    }
    const steps = [
      'Examinando estrutura física e contornos reais do produto...',
      'Calculando perspectiva de câmera de ação 14–16mm...',
      'Estruturando Cena 1: Caminhando com o Produto na Mão (0-9s)...',
      'Estruturando Cena 2: Detalhes Táteis & Textura Real (9-18s)...',
      'Estruturando Cena 3: Fechamento com CTA Natural (18-27s)...',
      'Sincronizando falas em PT-BR com gestos da mão...',
    ];
    let index = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      index = (index + 1) % steps.length;
      setLoadingStep(steps[index]);
    }, 2200);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie um arquivo de imagem (JPEG, PNG, WebP).');
      return;
    }
    setMimeType(file.type);
    setDiagnostic(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  };

  const selectSample = async (sample: SampleProduct) => {
    setBrandName(sample.name);
    setDiagnostic(null);
    if (sample.defaultNotes) {
      setVisualFocus(sample.defaultNotes);
    }
    try {
      const res = await fetch(sample.imageUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setMimeType(blob.type || 'image/jpeg');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setSelectedImage(sample.imageUrl);
    }
  };

  // Dedicated AI Product Analyzer
  const handleAnalyzeWithAI = async () => {
    if (!selectedImage || isAnalyzing) return;

    setIsAnalyzing(true);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const res = await fetch('/api/agents/povProduto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          action: 'analyze-product',
          imageBase64: selectedImage,
          brandName: brandName.trim(),
          visualFocus: visualFocus.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error(await describeHttpError(res));
      }

      const data: ProductDiagnostic = await res.json();
      setDiagnostic(data);

      if (!brandName && data.productName) {
        setBrandName(data.productName);
      }
      if (!visualFocus && data.detectedFeatures.length > 0) {
        setVisualFocus(data.detectedFeatures.join(', '));
      }
    } catch (err) {
      console.error('Erro ao analisar produto com IA:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    onGenerate({
      imageBase64: selectedImage,
      mimeType,
      brandName: brandName.trim() || undefined,
      visualFocus: visualFocus.trim() || undefined,
      ctaType,
    });
  };

  return (
    <div
      onPaste={handlePaste}
      className="bg-neutral-900/80 rounded-3xl border border-neutral-800 p-5 sm:p-7 shadow-2xl backdrop-blur-md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Dropzone */}
        <div>
          <label className="block text-sm font-bold text-white mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange-400" />
              1. Imagem do Produto (Referência Visual Estrita)
            </span>
            <span className="text-xs font-normal text-neutral-400">
              JPEG, PNG, WebP
            </span>
          </label>

          {!selectedImage ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-orange-500/70 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-neutral-950/40 hover:bg-neutral-950/80 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 group-hover:border-orange-500/50 transition">
                <ImageIcon className="w-7 h-7 text-neutral-400 group-hover:text-orange-400 transition" />
              </div>
              <p className="text-sm font-semibold text-neutral-200 mb-1">
                Clique para selecionar ou arraste uma foto aqui
              </p>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Calçados, roupas, eletrônicos, utensílios, cosméticos, garrafas, ferramentas ou qualquer produto.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-neutral-500 bg-neutral-900/90 px-3 py-1 rounded-full border border-neutral-800">
                <span>Dica: você também pode colar com Ctrl+V</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 p-3 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-36 h-36 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex-shrink-0 flex items-center justify-center relative">
                  <img
                    src={selectedImage}
                    alt="Produto selecionado"
                    className="w-full h-full object-contain p-1"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-orange-500/20 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="w-full h-1 bg-orange-400 absolute top-0 animate-[bounce_1.5s_infinite]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Imagem pronta para análise
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setDiagnostic(null);
                      }}
                      className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                      title="Remover imagem"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400">
                    A IA examinará formato, acabamento, textura tátil, costuras e detalhes de construção para montar falas condizentes.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-orange-400 hover:text-orange-300 font-medium underline underline-offset-2"
                  >
                    Trocar imagem
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>
              </div>

              {/* DEDICATED BUTTON TO ANALYZE PRODUCT WITH AI */}
              <div className="bg-neutral-950/70 rounded-2xl p-4 border border-orange-500/30 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-orange-400">
                      <Cpu className="w-4 h-4" />
                      <span>Análise de Estrutura Física por IA</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Escanear o formato, linhas de design, textura e encaixes para falas autênticas de bancada.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeWithAI}
                    disabled={isAnalyzing || isLoading}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-md ${
                      isAnalyzing
                        ? 'bg-neutral-800 text-neutral-400 cursor-wait'
                        : 'bg-orange-500 hover:bg-orange-400 text-neutral-950 shadow-orange-500/20 active:scale-95'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                        <span>A IA está analisando a estrutura...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>{diagnostic ? 'Reanalisar Estrutura' : '🔍 Analisar Produto com IA'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Diagnostic Results Panel */}
                {diagnostic && (
                  <div className="mt-3 pt-3 border-t border-neutral-800 space-y-3 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">
                          {diagnostic.productName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {diagnostic.category} ({diagnostic.confidenceScore}% precisão)
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {diagnostic.aspectRatioLabel}
                      </span>
                    </div>

                    {/* Detected visual structure elements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-neutral-900/90 rounded-xl p-2.5 border border-neutral-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-neutral-400 font-semibold text-[11px]">
                          <Box className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Formato & Geometria Observada:</span>
                        </div>
                        <p className="text-neutral-200 text-[11px] font-medium leading-tight">
                          {diagnostic.shapeDescription} ({diagnostic.aspectRatioLabel})
                        </p>
                      </div>

                      <div className="bg-neutral-900/90 rounded-xl p-2.5 border border-neutral-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-neutral-400 font-semibold text-[11px]">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>Superfície & Textura Tátil:</span>
                        </div>
                        <p className="text-neutral-300 text-[11px] leading-tight">
                          {diagnostic.finishType} • {diagnostic.textureDensity}
                        </p>
                      </div>
                    </div>

                    {/* Speech Outline generated strictly around build & physical features */}
                    <div className="bg-neutral-900/80 rounded-xl p-3 border border-neutral-800/90 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-orange-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Foco Exclusivo das Falas que Serão Geradas:</span>
                      </div>
                      <div className="space-y-1 text-neutral-300 text-[11px]">
                        <p><strong>Cena 1 (Gancho):</strong> {diagnostic.suggestedSpeechThemes.hook}</p>
                        <p><strong>Cena 2 (Detalhes):</strong> {diagnostic.suggestedSpeechThemes.demo}</p>
                        <p><strong>Cena 3 (CTA):</strong> {diagnostic.suggestedSpeechThemes.cta}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sample Products Quick Select */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-400">
              Ou selecione um produto de exemplo para testar agora:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {SAMPLE_PRODUCTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => selectSample(sample)}
                className="flex flex-col items-center p-2 rounded-xl bg-neutral-950/50 hover:bg-neutral-950 border border-neutral-800/90 hover:border-orange-500/50 transition text-left group"
              >
                <div className="w-full h-16 rounded-lg bg-neutral-900 mb-1.5 overflow-hidden flex items-center justify-center">
                  <img
                    src={sample.imageUrl}
                    alt={sample.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                </div>
                <span className="text-[11px] font-semibold text-neutral-300 line-clamp-1 group-hover:text-white">
                  {sample.name}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {sample.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Customizations (Accordion) */}
        <div className="rounded-2xl bg-neutral-950/60 border border-neutral-800/80 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white transition"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-orange-400" />
              <span>Ajustes Opcionais (Nome/Marca & Tipo de CTA)</span>
            </div>
            {showOptions ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          {showOptions && (
            <div className="p-4 pt-2 border-t border-neutral-800/80 space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Nome ou Marca do Produto <span className="text-neutral-500 font-normal">(Opcional)</span>:
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: Tênis Runner Pro, Fone Aurora Bass..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Destaque Visual a Enfatizar <span className="text-neutral-500 font-normal">(Opcional - ex: costura reforçada, textura fosca, fecho)</span>:
                </label>
                <input
                  type="text"
                  value={visualFocus}
                  onChange={(e) => setVisualFocus(e.target.value)}
                  placeholder="Ex: Focar na borracha do solado ou no acabamento das costuras"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Estilo de Call To Action (Cena 3):
                </label>
                <select
                  value={ctaType}
                  onChange={(e) => setCtaType(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition"
                >
                  <option value='TikTok Shop ("carrinho laranja")'>
                    TikTok Shop: "Se você gostou, dá uma olhada no carrinho laranja." (Padrão)
                  </option>
                  <option value="Link na Bio / Perfil">
                    Link na Bio: "Se você gostou, o link tá direto na minha bio."
                  </option>
                  <option value='Comente "EU QUERO"'>
                    Comentário: "Se você curtiu, comenta 'EU QUERO' aqui embaixo."
                  </option>
                  <option value="Site Oficial / Loja Virtual">
                    Loja / Site: "Se você gostou, dá uma conferida no site oficial."
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div>
          <button
            type="submit"
            disabled={!selectedImage || isLoading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-xl ${
              !selectedImage || isLoading
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
                : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-[length:200%_auto] hover:bg-right text-neutral-950 shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] cursor-pointer'
            }`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span className="font-extrabold text-neutral-950">Processando Análise & Gerando Prompts POV...</span>
                </div>
                {loadingStep && (
                  <span className="text-xs text-neutral-900 font-medium animate-pulse">
                    {loadingStep}
                  </span>
                )}
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-current" />
                <span>Gerar 3 Prompts POV (Sequência Completa de 27 Segundos)</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-neutral-500 mt-2">
            Gera os 3 prompts em inglês para IAs de vídeo + falas de 9s sincronizadas em Português do Brasil baseadas nos detalhes da imagem.
          </p>
        </div>
      </form>
    </div>
  );
};
