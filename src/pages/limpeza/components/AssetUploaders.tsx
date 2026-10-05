import React, { useState, useRef } from 'react';
import { Upload, User, Package, Sparkles, CheckCircle2, AlertCircle, RefreshCw, X, RotateCcw } from 'lucide-react';
import { callLimpezaAgent } from '../api';

interface AssetUploadersProps {
  characterDescription: string;
  setCharacterDescription: (val: string) => void;
  characterEnglishDescription?: string;
  setCharacterEnglishDescription?: (val: string) => void;
  supplementDescription: string;
  setSupplementDescription: (val: string) => void;
  characterImagePreview: string | null;
  setCharacterImagePreview: (val: string | null) => void;
  supplementImagePreview: string | null;
  setSupplementImagePreview: (val: string | null) => void;
}

// Client-side image compressor: downsizes photos to max 1000px to ensure ultra-fast AI processing and prevent 503s
function compressImageClientSide(file: File, maxDim = 1000, quality = 0.85): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64: readerEvent.target?.result as string, mimeType: file.type });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl, mimeType: 'image/jpeg' });
      };
      img.onerror = () => {
        resolve({ base64: readerEvent.target?.result as string, mimeType: file.type });
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => {
      resolve({ base64: '', mimeType: file.type });
    };
    reader.readAsDataURL(file);
  });
}

export const AssetUploaders: React.FC<AssetUploadersProps> = ({
  characterDescription,
  setCharacterDescription,
  supplementDescription,
  setSupplementDescription,
  characterImagePreview,
  setCharacterImagePreview,
  supplementImagePreview,
  setSupplementImagePreview,
}) => {
  const [analyzingCharacter, setAnalyzingCharacter] = useState(false);
  const [analyzingSupplement, setAnalyzingSupplement] = useState(false);
  const [characterError, setCharacterError] = useState<string | null>(null);
  const [supplementError, setSupplementError] = useState<string | null>(null);
  const [characterNotice, setCharacterNotice] = useState<string | null>(null);
  const [supplementNotice, setSupplementNotice] = useState<string | null>(null);

  const characterInputRef = useRef<HTMLInputElement>(null);
  const supplementInputRef = useRef<HTMLInputElement>(null);

  const handleCharacterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCharacterError('Selecione um arquivo de imagem válido (JPG, PNG ou WEBP).');
      return;
    }

    setCharacterError(null);
    setCharacterNotice(null);

    const { base64, mimeType } = await compressImageClientSide(file);
    if (!base64) {
      setCharacterError('Não foi possível ler o arquivo de imagem.');
      return;
    }

    setCharacterImagePreview(base64);
    analyzeCharacterWithAI(base64, mimeType);
  };

  const analyzeCharacterWithAI = async (base64Data: string, mimeType = 'image/jpeg') => {
    setAnalyzingCharacter(true);
    setCharacterError(null);
    setCharacterNotice(null);

    try {
      const data = await callLimpezaAgent('analyze-character', { imageBase64: base64Data, mimeType });

      if (data.detailedPromptDescription) {
        setCharacterDescription(data.detailedPromptDescription);
      }
      if (data.isFallbackNotice) {
        setCharacterNotice(data.isFallbackNotice);
      }
    } catch (err: any) {
      console.error(err);
      setCharacterError(err.message || 'Falha temporária na análise de IA. Você pode tentar novamente ou editar a descrição manualmente.');
    } finally {
      setAnalyzingCharacter(false);
    }
  };

  const handleSupplementFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSupplementError('Selecione um arquivo de imagem válido (JPG, PNG ou WEBP).');
      return;
    }

    setSupplementError(null);
    setSupplementNotice(null);

    const { base64, mimeType } = await compressImageClientSide(file);
    if (!base64) {
      setSupplementError('Não foi possível ler o arquivo de imagem.');
      return;
    }

    setSupplementImagePreview(base64);
    analyzeSupplementWithAI(base64, mimeType);
  };

  const analyzeSupplementWithAI = async (base64Data: string, mimeType = 'image/jpeg') => {
    setAnalyzingSupplement(true);
    setSupplementError(null);
    setSupplementNotice(null);

    try {
      const data = await callLimpezaAgent('analyze-supplement', { imageBase64: base64Data, mimeType });

      if (data.detailedBottleDescription) {
        setSupplementDescription(data.detailedBottleDescription);
      }
      if (data.isFallbackNotice) {
        setSupplementNotice(data.isFallbackNotice);
      }
    } catch (err: any) {
      console.error(err);
      setSupplementError(err.message || 'Falha temporária na análise de IA. Você pode tentar novamente ou editar a embalagem manualmente.');
    } finally {
      setAnalyzingSupplement(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
      {/* 1. Character Image Uploader & Consistency Profile */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                1. Foto da Especialista / Dona de Casa
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  Mesma Personagem em Todas as Cenas
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Suba a foto da dona de casa para a IA clonar feições faciais, expressão amigável e avental de linho
              </p>
            </div>
          </div>
          {characterImagePreview && (
            <button
              onClick={() => {
                setCharacterImagePreview(null);
                setCharacterError(null);
                setCharacterNotice(null);
                if (characterInputRef.current) characterInputRef.current.value = '';
              }}
              className="text-slate-400 hover:text-emerald-400 p-1 rounded-md transition-colors"
              title="Remover imagem"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <input
          ref={characterInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCharacterFileChange}
        />

        {!characterImagePreview ? (
          <div
            onClick={() => characterInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-300 flex items-center justify-center mb-2 transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-200">
              Clique para subir a foto da especialista em limpeza
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              JPG, PNG ou WebP (A IA extrai etnia, cabelo, expressão autêntica e avental de linho)
            </span>
          </div>
        ) : (
          <div className="flex gap-4 items-start p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <div className="relative w-20 h-24 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-900 group">
              <img
                src={characterImagePreview}
                alt="Especialista Carregada"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => characterInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-medium transition-opacity"
              >
                Trocar
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Imagem Ativa
                </span>
                <button
                  disabled={analyzingCharacter}
                  onClick={() => analyzeCharacterWithAI(characterImagePreview, 'image/jpeg')}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${analyzingCharacter ? 'animate-spin' : ''}`} />
                  {analyzingCharacter ? 'Analisando...' : 'Reanalisar com IA'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-3">
                {analyzingCharacter ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    Analisando feições acolhedoras e vestimenta com IA...
                  </span>
                ) : (
                  characterDescription || 'Descrição da especialista fixada para manter a mesma identidade nas cenas.'
                )}
              </p>
              {characterNotice && (
                <div className="mt-1 text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block">
                  {characterNotice}
                </div>
              )}
            </div>
          </div>
        )}

        {characterError && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="truncate">{characterError}</span>
            </div>
            {characterImagePreview && (
              <button
                onClick={() => analyzeCharacterWithAI(characterImagePreview, 'image/jpeg')}
                className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-500/20 px-2 py-1 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Tentar Novamente
              </button>
            )}
          </div>
        )}

        {/* Character Description Field */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Descrição Canônica da Especialista (reproduzida em todos os prompts):
          </label>
          <textarea
            rows={3}
            value={characterDescription}
            onChange={(e) => setCharacterDescription(e.target.value)}
            placeholder="Ex: Dona Clara Menezes, especialista em organização doméstica e técnicas de limpeza pesada de 42 anos, camiseta de algodão cru e avental de linho cinza elegante (sem jaleco), olhar amigável de cumplicidade de dona de casa para dona de casa..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
          />
        </div>
      </div>

      {/* 2. Cleaning Product Image Uploader & Prompts Integration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                2. Imagem do Produto de Limpeza (Spray/Frasco)
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30 font-semibold">
                  Segurado nos Prompts Finais
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Suba o frasco spray borrifador, refil concentrado ou frasco dosador para ser segurado na tela
              </p>
            </div>
          </div>
          {supplementImagePreview && (
            <button
              onClick={() => {
                setSupplementImagePreview(null);
                setSupplementError(null);
                setSupplementNotice(null);
                if (supplementInputRef.current) supplementInputRef.current.value = '';
              }}
              className="text-slate-400 hover:text-teal-400 p-1 rounded-md transition-colors"
              title="Remover imagem"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <input
          ref={supplementInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSupplementFileChange}
        />

        {!supplementImagePreview ? (
          <div
            onClick={() => supplementInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700/80 hover:border-teal-500/50 hover:bg-teal-500/5 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-teal-500/20 text-slate-400 group-hover:text-teal-300 flex items-center justify-center mb-2 transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-teal-200">
              Clique para subir a foto do produto de limpeza
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Frasco spray âmbar, gatilho fosco, refil concentrado ou dosador (A IA extrai rótulo e gatilho)
            </span>
          </div>
        ) : (
          <div className="flex gap-4 items-start p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <div className="relative w-20 h-24 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-900 group">
              <img
                src={supplementImagePreview}
                alt="Produto Carregado"
                className="w-full h-full object-contain p-1"
              />
              <button
                onClick={() => supplementInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-medium transition-opacity"
              >
                Trocar
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-teal-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Produto Ativo
                </span>
                <button
                  disabled={analyzingSupplement}
                  onClick={() => analyzeSupplementWithAI(supplementImagePreview, 'image/jpeg')}
                  className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${analyzingSupplement ? 'animate-spin' : ''}`} />
                  {analyzingSupplement ? 'Analisando...' : 'Reanalisar com IA'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-3">
                {analyzingSupplement ? (
                  <span className="text-teal-400 flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    Analisando frasco spray, gatilho ergonômico e rótulo com IA...
                  </span>
                ) : (
                  supplementDescription || 'Descrição da embalagem fixada para ser exibida e segurada pela especialista nos prompts finais.'
                )}
              </p>
              {supplementNotice && (
                <div className="mt-1 text-[10px] text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20 inline-block">
                  {supplementNotice}
                </div>
              )}
            </div>
          </div>
        )}

        {supplementError && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="truncate">{supplementError}</span>
            </div>
            {supplementImagePreview && (
              <button
                onClick={() => analyzeSupplementWithAI(supplementImagePreview, 'image/jpeg')}
                className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-500/20 px-2 py-1 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Tentar Novamente
              </button>
            )}
          </div>
        )}

        {/* Supplement Description Field */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Descrição do Frasco / Produto (segurado pela especialista nos prompts finais):
          </label>
          <textarea
            rows={3}
            value={supplementDescription}
            onChange={(e) => setSupplementDescription(e.target.value)}
            placeholder="Ex: Frasco borrifador spray âmbar escuro de 500ml com gatilho ergonômico preto fosco, bico dosador spray/stream e rótulo fosco minimalista 'DesengorduraMax Pro'..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors font-mono"
          />
        </div>
      </div>
    </div>
  );
};
