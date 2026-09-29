import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileText, 
  Layers, 
  HelpCircle, 
  Zap,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  Camera,
  CheckCircle2,
  BookOpen,
  Pill,
  RefreshCw,
  Shuffle,
  Lightbulb,
  Check,
  Video,
  Film,
  AlertCircle
} from 'lucide-react';
import { PromptGenerationRequest, HookActionType, ThemeSuggestion } from '../types';
import { QUICK_STARTER_THEMES, ALL_CURATED_THEME_SUGGESTIONS, getRandomThemeSuggestions } from '../data/presets';
import { supabase } from '../../../lib/supabase';
import { compressImageFile } from '../utils/imageCompressor';

interface PromptStudioFormProps {
  onGenerate: (data: PromptGenerationRequest) => void;
  isLoading: boolean;
  onSelectPreset: (presetId: string) => void;
}

export const PromptStudioForm: React.FC<PromptStudioFormProps> = ({
  onGenerate,
  isLoading,
  onSelectPreset,
}) => {
  const [theme, setTheme] = useState<string>('');
  const [giantModelPreference, setGiantModelPreference] = useState<string>('');
  const [hookStyle, setHookStyle] = useState<'curiosidade' | 'segredo' | 'problema_visivel' | 'descoberta'>('curiosidade');
  const [solutionIngredients, setSolutionIngredients] = useState<string>('');
  const [objectScale, setObjectScale] = useState<'colossal_60' | 'large_45'>('colossal_60');
  const [hookActionType, setHookActionType] = useState<HookActionType>('varied_dynamic');
  
  // Custom Character (Personagem) State
  const [characterImageBase64, setCharacterImageBase64] = useState<string>('');
  const [characterImageMimeType, setCharacterImageMimeType] = useState<string>('');
  const [characterImageFileName, setCharacterImageFileName] = useState<string>('');
  const [customCharacterDescription, setCustomCharacterDescription] = useState<string>('');

  // Custom Scenario (Cenário) State
  const [settingImageBase64, setSettingImageBase64] = useState<string>('');
  const [settingImageMimeType, setSettingImageMimeType] = useState<string>('');
  const [settingImageFileName, setSettingImageFileName] = useState<string>('');
  const [customSettingDescription, setCustomSettingDescription] = useState<string>('');

  // Custom Encapsulated Product (Prompts 8 & 9 - CTA) State
  const [customProductTitle, setCustomProductTitle] = useState<string>('');
  const [productImageBase64, setProductImageBase64] = useState<string>('');
  const [productImageMimeType, setProductImageMimeType] = useState<string>('');
  const [productImageFileName, setProductImageFileName] = useState<string>('');

  // Custom Book (Legacy fallback) State
  const [includePrompt5, setIncludePrompt5] = useState<boolean>(true);
  const [customBookTitle, setCustomBookTitle] = useState<string>('');
  const [bookImageBase64, setBookImageBase64] = useState<string>('');
  const [bookImageMimeType, setBookImageMimeType] = useState<string>('');
  const [bookImageFileName, setBookImageFileName] = useState<string>('');

  // Reference (Video / Screenshot / Transcript) State
  const [referenceText, setReferenceText] = useState<string>('');
  const [referenceImageBase64, setReferenceImageBase64] = useState<string>('');
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  
  // Reference Viral Video State
  const [referenceVideoBase64, setReferenceVideoBase64] = useState<string>('');
  const [videoMimeType, setVideoMimeType] = useState<string>('');
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [videoFileSizeMB, setVideoFileSizeMB] = useState<number>(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [videoLoading, setVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  const [showAdvancedReference, setShowAdvancedReference] = useState<boolean>(false);

  // Dynamic Theme Suggestions State
  const [currentSuggestions, setCurrentSuggestions] = useState<ThemeSuggestion[]>(QUICK_STARTER_THEMES);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [suggestionSource, setSuggestionSource] = useState<'curated' | 'ai' | null>(null);
  const [selectedSuggestionTheme, setSelectedSuggestionTheme] = useState<string>('');

  const handleRecommendMoreSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const currentThemes = currentSuggestions.map((s) => s.theme);
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const res = await fetch('/api/agents/encapsulados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ action: 'recommend-suggestions', exclude: currentThemes }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setCurrentSuggestions(data.suggestions);
          setSuggestionSource(data.source === 'ai' ? 'ai' : 'curated');
          return;
        }
      }
      // Fallback to offline curated random pool
      const nextBatch = getRandomThemeSuggestions(6, currentThemes);
      setCurrentSuggestions(nextBatch);
      setSuggestionSource('curated');
    } catch {
      const nextBatch = getRandomThemeSuggestions(6, currentSuggestions.map((s) => s.theme));
      setCurrentSuggestions(nextBatch);
      setSuggestionSource('curated');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleApplySuggestion = (item: ThemeSuggestion) => {
    setTheme(item.theme);
    setGiantModelPreference(item.model);
    setHookStyle(item.hookType);
    if (item.solutionIngredients) {
      setSolutionIngredients(item.solutionIngredients);
    }
    if (item.hookActionType) {
      setHookActionType(item.hookActionType);
    }
    setSelectedSuggestionTheme(item.theme);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const characterFileInputRef = useRef<HTMLInputElement>(null);
  const settingFileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const bookFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when component unmounts or video changes
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  // Handlers for Reference Viral Video
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoError(null);
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 25) {
      setVideoError(`O vídeo selecionado tem ${sizeMB.toFixed(1)}MB. Para garantir velocidade máxima e evitar quedas de conexão, o limite recomendado é de 25MB. Envie um corte rápido com os primeiros 8 a 15 segundos do vídeo viral.`);
      return;
    }

    setVideoFileName(file.name);
    setVideoMimeType(file.type || 'video/mp4');
    setVideoFileSizeMB(parseFloat(sizeMB.toFixed(1)));
    setVideoLoading(true);

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setVideoPreviewUrl(preview);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      setReferenceVideoBase64(base64Data);
      setVideoLoading(false);
    };
    reader.onerror = () => {
      setVideoError('Erro ao ler arquivo de vídeo.');
      setVideoLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setReferenceVideoBase64('');
    setVideoMimeType('');
    setVideoFileName('');
    setVideoFileSizeMB(0);
    setVideoPreviewUrl('');
    setVideoError(null);
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
  };

  // Handlers for Reference Image
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    try {
      const compressed = await compressImageFile(file);
      setImageMimeType(compressed.mimeType);
      setReferenceImageBase64(compressed.base64);
    } catch {
      setImageMimeType(file.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setReferenceImageBase64(result.split(',')[1] || result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReferenceImageBase64('');
    setImageMimeType('');
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handlers for Custom Character Image
  const handleCharacterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCharacterImageFileName(file.name);
    try {
      const compressed = await compressImageFile(file);
      setCharacterImageMimeType(compressed.mimeType);
      setCharacterImageBase64(compressed.base64);
    } catch {
      setCharacterImageMimeType(file.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCharacterImageBase64(result.split(',')[1] || result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCharacterImage = () => {
    setCharacterImageBase64('');
    setCharacterImageMimeType('');
    setCharacterImageFileName('');
    if (characterFileInputRef.current) {
      characterFileInputRef.current.value = '';
    }
  };

  // Handlers for Custom Scenario Image
  const handleSettingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSettingImageFileName(file.name);
    try {
      const compressed = await compressImageFile(file);
      setSettingImageMimeType(compressed.mimeType);
      setSettingImageBase64(compressed.base64);
    } catch {
      setSettingImageMimeType(file.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSettingImageBase64(result.split(',')[1] || result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSettingImage = () => {
    setSettingImageBase64('');
    setSettingImageMimeType('');
    setSettingImageFileName('');
    if (settingFileInputRef.current) {
      settingFileInputRef.current.value = '';
    }
  };

  // Handlers for Custom Encapsulated Product Image
  const handleProductFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProductImageFileName(file.name);
    try {
      const compressed = await compressImageFile(file);
      setProductImageMimeType(compressed.mimeType);
      setProductImageBase64(compressed.base64);
    } catch {
      setProductImageMimeType(file.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setProductImageBase64(result.split(',')[1] || result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProductImage = () => {
    setProductImageBase64('');
    setProductImageMimeType('');
    setProductImageFileName('');
    if (productFileInputRef.current) {
      productFileInputRef.current.value = '';
    }
  };

  // Handlers for Custom Book Image (Legacy)
  const handleBookFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBookImageFileName(file.name);
    try {
      const compressed = await compressImageFile(file);
      setBookImageMimeType(compressed.mimeType);
      setBookImageBase64(compressed.base64);
    } catch {
      setBookImageMimeType(file.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setBookImageBase64(result.split(',')[1] || result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBookImage = () => {
    setBookImageBase64('');
    setBookImageMimeType('');
    setBookImageFileName('');
    if (bookFileInputRef.current) {
      bookFileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim() && !referenceText.trim() && !referenceImageBase64 && !referenceVideoBase64 && !characterImageBase64 && !settingImageBase64 && !customProductTitle.trim() && !productImageBase64 && !customBookTitle.trim() && !bookImageBase64) return;

    onGenerate({
      theme: theme.trim(),
      giantModelPreference: giantModelPreference.trim(),
      hookStyle,
      solutionIngredients: solutionIngredients.trim() || undefined,
      objectScale,
      hookActionType,
      // Custom Character
      characterMode: characterImageBase64 || customCharacterDescription.trim() ? 'custom' : 'default_bjj_master',
      customCharacterDescription: customCharacterDescription.trim() || undefined,
      characterImageBase64: characterImageBase64 || undefined,
      characterImageMimeType: characterImageMimeType || undefined,
      characterImageName: characterImageFileName || undefined,
      // Custom Scenario
      settingMode: settingImageBase64 || customSettingDescription.trim() ? 'custom' : 'default_dojo_flags',
      customSettingDescription: customSettingDescription.trim() || undefined,
      settingImageBase64: settingImageBase64 || undefined,
      settingImageMimeType: settingImageMimeType || undefined,
      settingImageName: settingImageFileName || undefined,
      // Custom Encapsulated Product (Prompts 8 & 9 - CTA)
      customProductTitle: customProductTitle.trim() || undefined,
      productImageBase64: productImageBase64 || undefined,
      productImageMimeType: productImageMimeType || undefined,
      productImageName: productImageFileName || undefined,
      // Custom Book (Legacy)
      customBookTitle: customBookTitle.trim() || undefined,
      bookImageBase64: bookImageBase64 || undefined,
      bookImageMimeType: bookImageMimeType || undefined,
      bookImageName: bookImageFileName || undefined,
      // Reference
      referenceText: referenceText.trim(),
      referenceImageBase64: referenceImageBase64 || undefined,
      imageMimeType: imageMimeType || undefined,
      referenceVideoBase64: referenceVideoBase64 || undefined,
      videoMimeType: videoMimeType || undefined,
      videoFileName: videoFileName || undefined,
      videoFileSizeMB: videoFileSizeMB || undefined,
    });
  };

  return (
    <div id="prompt-studio-form-container" className="rounded-xl border border-emerald-900/50 bg-[#101b15] p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-emerald-900/30 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span>Gerador Oficial de Prompts Virais (72s)</span>
          </h2>
          <p className="text-xs text-emerald-300/70 mt-0.5">
            Insira um tema ou referência. O agente gera os 9 prompts conectados de 8s cada com modelo colossal, preparo e CTA duplo para encapsulado.
          </p>
        </div>

        {/* Quick starter presets dropdown / buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-emerald-400/80">Exemplos Prontos:</span>
          <button
            type="button"
            onClick={() => onSelectPreset('script-tartaro-dental')}
            className="rounded-md border border-emerald-800 bg-[#16271e] px-2 py-1 text-[10px] font-medium text-emerald-200 hover:bg-emerald-900/50 transition-colors"
          >
            Tártaro Dental
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset('script-figado-gordura')}
            className="rounded-md border border-emerald-800 bg-[#16271e] px-2 py-1 text-[10px] font-medium text-emerald-200 hover:bg-emerald-900/50 transition-colors"
          >
            Fígado & Gordura
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Theme Input */}
        <div>
          <label htmlFor="input-video-theme" className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1">
            Tema, Alimento, Hábito ou Problema Visual *
          </label>
          <div className="relative">
            <input
              id="input-video-theme"
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Pulmão de fumante vs vaporizador, Pedra na vesícula, Água com limão e glicose..."
              className="w-full rounded-lg border border-emerald-900/70 bg-[#0c1410] pl-3.5 pr-9 py-2.5 text-sm text-white placeholder:text-emerald-500/40 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required={!referenceText && !referenceImageBase64 && !referenceVideoBase64}
            />
            {theme && (
              <button
                type="button"
                onClick={() => setTheme('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400/60 hover:text-emerald-200 transition-colors p-1"
                title="Limpar campo de tema"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Starter Chips & Recomendar Mais Sugestões Button */}
        <div className="rounded-xl border border-emerald-900/60 bg-[#0c1611]/90 p-3.5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Sugestões Virais de Alta Retenção</span>
              </span>
              {suggestionSource === 'ai' ? (
                <span className="rounded bg-teal-950/90 border border-teal-700/60 px-1.5 py-0.5 text-[9px] font-semibold text-teal-300 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-teal-400" />
                  Gerado por IA
                </span>
              ) : (
                <span className="rounded bg-emerald-950/70 border border-emerald-800/50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400/80">
                  {ALL_CURATED_THEME_SUGGESTIONS.length}+ ideias
                </span>
              )}
            </div>

            {/* Dedicated Button requested by user */}
            <button
              id="btn-recommend-more-suggestions"
              type="button"
              onClick={handleRecommendMoreSuggestions}
              disabled={isLoadingSuggestions}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/60 bg-gradient-to-r from-amber-950/90 via-emerald-950/90 to-amber-950/90 hover:from-amber-900 hover:via-emerald-900 hover:to-amber-900 px-3 py-1.5 text-xs font-bold text-amber-200 hover:text-white shadow-md shadow-emerald-950/60 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
              title="Alternar ou buscar 6 novas sugestões virais para o canal"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-500 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
              <span>{isLoadingSuggestions ? 'Gerando Novas Ideias...' : 'Recomendar Mais Sugestões'}</span>
            </button>
          </div>

          <p className="text-[11px] text-emerald-300/70 mb-2.5 leading-relaxed">
            Clique em qualquer sugestão abaixo para preencher automaticamente o tema, o modelo anatômico de 60% e os ingredientes curativos:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {currentSuggestions.map((item, idx) => {
              const isSelected = selectedSuggestionTheme === item.theme || theme === item.theme;
              return (
                <button
                  key={`${item.theme}-${idx}`}
                  type="button"
                  onClick={() => handleApplySuggestion(item)}
                  className={`flex flex-col justify-between rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-400 bg-[#14281e] shadow-md shadow-emerald-950 ring-1 ring-emerald-500/50'
                      : 'border-emerald-900/60 bg-[#0e1b15] hover:border-emerald-600 hover:bg-[#13231c]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="rounded bg-emerald-950/90 border border-emerald-800/70 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                        {item.tag}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400">
                          <Check className="h-3 w-3" />
                          Preenchido
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-400/50 group-hover:text-emerald-300">
                          Usar Tema →
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-emerald-100 line-clamp-2 leading-snug">
                      {item.theme}
                    </span>
                  </div>
                  {item.solutionIngredients && (
                    <span className="text-[9px] text-emerald-400/70 mt-1.5 truncate block border-t border-emerald-900/40 pt-1">
                      🌿 {item.solutionIngredients}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Giant Model & Hook Style Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label htmlFor="select-hook-style" className="block text-xs font-semibold text-emerald-300 mb-1">
              Estilo do Gancho do Primeiro Segundo:
            </label>
            <select
              id="select-hook-style"
              value={hookStyle}
              onChange={(e) => setHookStyle(e.target.value as any)}
              className="w-full rounded-lg border border-emerald-900/70 bg-[#0c1410] px-3 py-2 text-xs text-emerald-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="curiosidade">Curiosidade ("Quase ninguém te mostra isso quando...")</option>
              <option value="problema_visivel">Problema Visível ("Se você faz isso todo dia, olha o que acontece...")</option>
              <option value="segredo">Segredo ("Tem uma coisa sobre esse assunto que ninguém te conta...")</option>
              <option value="descoberta">Descoberta ("Olha bem o que acontece com a física aqui...")</option>
            </select>
          </div>

          <div>
            <label htmlFor="input-giant-model" className="block text-xs font-semibold text-emerald-300 mb-1">
              Modelo Educacional Gigante Preferido (Opcional):
            </label>
            <input
              id="input-giant-model"
              type="text"
              value={giantModelPreference}
              onChange={(e) => setGiantModelPreference(e.target.value)}
              placeholder="Ex: Boca com dentes apodrecidos 60%, Fígado com gordura..."
              className="w-full rounded-lg border border-emerald-900/70 bg-[#0c1410] px-3 py-2 text-xs text-white placeholder:text-emerald-600/50 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Prompt 3 Homemade Ingredients and Preparation Display Setting */}
        <div className="pt-1 p-3 rounded-lg border border-emerald-800/40 bg-[#0e1d15]/80">
          <label htmlFor="input-solution-ingredients" className="block text-xs font-bold text-emerald-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🌿 Ingredientes Caseiros da Cura (Prompt 3):</span>
            </span>
            <span className="text-[10px] text-emerald-400/70 font-normal">Opcional — IA deduz ingredientes caseiros se vazio</span>
          </label>
          <input
            id="input-solution-ingredients"
            type="text"
            value={solutionIngredients}
            onChange={(e) => setSolutionIngredients(e.target.value)}
            placeholder="Ex: Bicarbonato de sódio + Limão + Óleo de coco (ou Vinagre de maçã cru + Cúrcuma)..."
            className="w-full rounded-lg border border-emerald-900/70 bg-[#07120a] px-3 py-2 text-xs text-emerald-100 placeholder:text-emerald-700/60 focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-[10px] text-emerald-400/80 mt-1.5 block leading-relaxed">
            • <strong>PROMPT 2 (00:08 - 00:16):</strong> Explicação do problema por dentro (órgão/tecido afetado e sintomas).<br />
            • <strong>PROMPT 3 (00:16 - 00:24):</strong> Mostra e fala quais são os ingredientes caseiros que combatem a raiz.<br />
            • <strong>PROMPTS 4, 5 e 6:</strong> Preparo na panela com os ingredientes e tempo de infusão.<br />
            • <strong>PROMPT 7:</strong> Degustação do preparo caseiro e relato de cura.<br />
            • <strong>PROMPTS 8 e 9:</strong> Apresentação do Encapsulado + CTA final de venda ("EU QUERO" / Bio).
          </span>
        </div>

        {/* Enhanced Hook Visual Settings (Object scale & opening 00:00 liquid action) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 p-3 rounded-lg border border-emerald-800/40 bg-[#122219]/60">
          <div>
            <label htmlFor="select-object-scale" className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
              <span>🔥 Escala do Objeto no Gancho:</span>
            </label>
            <select
              id="select-object-scale"
              value={objectScale}
              onChange={(e) => setObjectScale(e.target.value as any)}
              className="w-full rounded-lg border border-amber-800/50 bg-[#0a150e] px-3 py-2 text-xs text-amber-200 font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="colossal_60">🔥 Colossal 60% do Quadro (Recomendado • Perspectiva Forçada 20mm)</option>
              <option value="large_45">Grande 45% do Quadro (Perspectiva 28mm)</option>
            </select>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">
              O modelo ocupa mais da metade da tela 9:16, colado na lente, igual às referências do canal.
            </span>
          </div>

          <div>
            <label htmlFor="select-hook-action" className="block text-xs font-bold text-cyan-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Ação do Gancho (00:00):</span>
              </span>
              <span className="text-[10px] text-amber-300/80 font-semibold">Sempre diferente a cada tema</span>
            </label>
            <select
              id="select-hook-action"
              value={hookActionType}
              onChange={(e) => setHookActionType(e.target.value as any)}
              className="w-full rounded-lg border border-cyan-800/50 bg-[#0a150e] px-3 py-2 text-xs text-cyan-200 font-medium focus:border-cyan-500 focus:outline-none"
            >
              <option value="varied_dynamic">🎲 Ganchos Variados & Inovadores (IA varia a cada vídeo: corte, pinça, raspagem, compressão, UV...)</option>
              <option value="surgical_slice">🔪 Corte / Dissecção com Bisturi (Fatia o modelo gigante revelando interior apodrecido)</option>
              <option value="pinch_extraction">🪱 Extração com Pinça Cirúrgica (Puxa verme, parasita, cálculo ou tampão preto do modelo)</option>
              <option value="pressure_squeeze">🤏 Compressão / Espremer com Força (Duas mãos apertam tecido inchado expelindo secreção)</option>
              <option value="scraping_abrasion">🪚 Raspagem / Fricção Abrasiva (Lâmina metálica arranca lascas de tártaro/placa)</option>
              <option value="catheter_unclog">🪠 Desobstrução Mecânica / Sonda (Empurra massa de gordura/coágulo para fora do canal)</option>
              <option value="uv_reveal">🔦 Revelação Fluorescente UV (Luz ultravioleta acende bactérias brilhantes no escuro)</option>
              <option value="needle_injection">💉 Injeção sob Pressão (Seringa injeta reagente que incha vasos do modelo enorme)</option>
              <option value="liquid_pouring">💧 Despejo de Líquido Ativo (Água, mel, vinagre ou reagente borbulhando sobre o modelo)</option>
            </select>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">
              O <strong>objeto enorme demonstrando</strong> é a única constante fixa (60%). O gancho visual varia a cada vídeo para surpreender o público.
            </span>
          </div>
        </div>

        {/* CUSTOM CHARACTER & CUSTOM SCENARIO UPLOADS SECTION */}
        <div className="pt-2 p-3.5 rounded-xl border border-teal-800/50 bg-[#0d1a15] space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-teal-900/40 pb-2">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                Personalização Visual: Subir Imagem do Personagem & Cenário
              </span>
            </div>
            <span className="text-[10px] text-teal-400/80 font-medium">Opcional • Substitui os padrões oficiais</span>
          </div>

          <p className="text-[11px] text-teal-300/70 leading-relaxed">
            Se você deseja usar <strong>seu próprio rosto/personagem</strong> ou <strong>seu próprio ambiente/cenário</strong>, faça o upload das imagens abaixo. A IA manterá perfeita continuidade e identidade fotográfica em todos os 8 prompts de 8s.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Character Upload Card */}
            <div className="rounded-lg border border-teal-900/60 bg-[#09140f] p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Foto do seu Personagem:</span>
                  </label>
                  {characterImageBase64 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Ativo nos 8 prompts
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={characterFileInputRef}
                  onChange={handleCharacterFileChange}
                  accept="image/*"
                  className="hidden"
                  id="input-file-character"
                />

                {!characterImageBase64 ? (
                  <button
                    type="button"
                    onClick={() => characterFileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full gap-1.5 rounded-lg border border-dashed border-teal-800/80 bg-[#0c1813] py-4 px-3 text-center hover:border-emerald-500 hover:bg-[#102019] transition-all group"
                  >
                    <div className="h-8 w-8 rounded-full bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <Upload className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-200">
                      Subir foto do seu Personagem
                    </span>
                    <span className="text-[10px] text-teal-400/60">
                      PNG, JPG ou WEBP (rosto e corpo bem visíveis)
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-700/60 bg-[#122219] p-2 text-xs">
                      <img 
                        src={`data:${characterImageMimeType || 'image/jpeg'};base64,${characterImageBase64}`} 
                        alt="Personagem enviado" 
                        className="h-12 w-12 rounded object-cover border border-emerald-600/60 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white truncate block text-xs">
                          {characterImageFileName || 'Foto do Personagem'}
                        </span>
                        <span className="text-[10px] text-emerald-300/80 block">
                          Identidade visual mantida nas 8 cenas
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCharacterImage}
                        className="rounded-md p-1.5 text-emerald-400 hover:text-red-400 hover:bg-emerald-900/60 transition-colors shrink-0"
                        title="Remover foto do personagem"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-2.5">
                  <input
                    type="text"
                    value={customCharacterDescription}
                    onChange={(e) => setCustomCharacterDescription(e.target.value)}
                    placeholder="Descrição opcional (Ex: Mulher 30 anos com jaleco branco, Homem jovem de regata...)"
                    className="w-full rounded-md border border-teal-900/70 bg-[#07110c] px-2.5 py-1.5 text-[11px] text-emerald-100 placeholder:text-teal-700/60 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <span className="text-[10px] text-teal-400/70 mt-2 block leading-relaxed border-t border-teal-950/80 pt-1.5">
                • <strong>Efeito:</strong> Substitui o Mestre de BJJ padrão pela foto enviada, preservando formato facial, idade, cabelo e roupas.
              </span>
            </div>

            {/* 2. Scenario Upload Card */}
            <div className="rounded-lg border border-teal-900/60 bg-[#09140f] p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-teal-400" />
                    <span>Foto do seu Cenário:</span>
                  </label>
                  {settingImageBase64 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-teal-300 bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Ativo nos 8 prompts
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={settingFileInputRef}
                  onChange={handleSettingFileChange}
                  accept="image/*"
                  className="hidden"
                  id="input-file-setting"
                />

                {!settingImageBase64 ? (
                  <button
                    type="button"
                    onClick={() => settingFileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full gap-1.5 rounded-lg border border-dashed border-teal-800/80 bg-[#0c1813] py-4 px-3 text-center hover:border-teal-400 hover:bg-[#102019] transition-all group"
                  >
                    <div className="h-8 w-8 rounded-full bg-teal-950/60 border border-teal-800 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                      <Upload className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-teal-200">
                      Subir foto do seu Cenário
                    </span>
                    <span className="text-[10px] text-teal-400/60">
                      PNG, JPG ou WEBP (ambiente, parede e bancada)
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-lg border border-teal-700/60 bg-[#122219] p-2 text-xs">
                      <img 
                        src={`data:${settingImageMimeType || 'image/jpeg'};base64,${settingImageBase64}`} 
                        alt="Cenário enviado" 
                        className="h-12 w-12 rounded object-cover border border-teal-600/60 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white truncate block text-xs">
                          {settingImageFileName || 'Foto do Cenário'}
                        </span>
                        <span className="text-[10px] text-teal-300/80 block">
                          Arquitetura e iluminação mantidas
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeSettingImage}
                        className="rounded-md p-1.5 text-teal-400 hover:text-red-400 hover:bg-teal-900/60 transition-colors shrink-0"
                        title="Remover foto do cenário"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-2.5">
                  <input
                    type="text"
                    value={customSettingDescription}
                    onChange={(e) => setCustomSettingDescription(e.target.value)}
                    placeholder="Descrição opcional (Ex: Consultório moderno iluminado, Cozinha com balcão preto...)"
                    className="w-full rounded-md border border-teal-900/70 bg-[#07110c] px-2.5 py-1.5 text-[11px] text-teal-100 placeholder:text-teal-700/60 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <span className="text-[10px] text-teal-400/70 mt-2 block leading-relaxed border-t border-teal-950/80 pt-1.5">
                • <strong>Efeito:</strong> Substitui o Dojo de BJJ e as 3 bandeiras pelo ambiente desta foto, mantendo o balcão frontal para as ações.
              </span>
            </div>
          </div>

          {/* 3. Custom Encapsulated Product (Prompts 8 & 9 — Duplo CTA de Venda) Card */}
          <div className="rounded-lg border border-lime-900/60 bg-[#0d1c14] p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-lime-900/40 pb-2">
              <label className="text-xs font-bold text-lime-200 flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-lime-400" />
                <span>Produto Encapsulado (Prompts 8 & 9 — Duplo CTA de Venda):</span>
              </label>
              {(productImageBase64 || customProductTitle) ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-lime-300 bg-lime-950/80 px-1.5 py-0.5 rounded border border-lime-800">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativo nos Prompts 8 e 9
                </span>
              ) : (
                <span className="text-[10px] text-lime-400/80">
                  Fórmula concentrada em cápsulas
                </span>
              )}
            </div>

            <p className="text-[11px] text-lime-300/80 leading-relaxed">
              Configure o <strong>produto encapsulado</strong> vendido no clímax do vídeo. O <strong>Prompt 8</strong> apresenta a fórmula pura e o frasco âmbar nas mãos do apresentador; o <strong>Prompt 9</strong> fecha a venda com escassez, lote de fábrica e chamada "comente EU QUERO".
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              {/* Product bottle image upload */}
              <div>
                <input
                  type="file"
                  ref={productFileInputRef}
                  onChange={handleProductFileChange}
                  accept="image/*"
                  className="hidden"
                  id="input-file-product"
                />

                {!productImageBase64 ? (
                  <button
                    type="button"
                    onClick={() => productFileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full gap-1.5 rounded-lg border border-dashed border-lime-800/80 bg-[#0b1811] py-3 px-3 text-center hover:border-lime-400 hover:bg-[#102419] transition-all group"
                  >
                    <div className="h-7 w-7 rounded-full bg-lime-950/60 border border-lime-800 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform">
                      <Upload className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-lime-200">
                      Subir foto do Frasco / Encapsulado
                    </span>
                    <span className="text-[10px] text-lime-400/60">
                      PNG, JPG ou WEBP (rótulo/frasco do suplemento)
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-lime-700/60 bg-[#14281c] p-2 text-xs">
                    <img 
                      src={`data:${productImageMimeType || 'image/jpeg'};base64,${productImageBase64}`} 
                      alt="Frasco do Produto Encapsulado" 
                      className="h-12 w-9 rounded object-cover border border-lime-600/60 shrink-0 shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-white truncate block text-xs">
                        {productImageFileName || 'Frasco do Encapsulado'}
                      </span>
                      <span className="text-[10px] text-lime-300/80 block">
                        Exibido nos Prompts 8 e 9 (CTA)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeProductImage}
                      className="rounded-md p-1.5 text-lime-400 hover:text-red-400 hover:bg-lime-900/60 transition-colors shrink-0"
                      title="Remover foto do produto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Product formula / title input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-lime-200 block">
                  Nome / Fórmula do Produto Encapsulado:
                </label>
                <input
                  type="text"
                  value={customProductTitle}
                  onChange={(e) => setCustomProductTitle(e.target.value)}
                  placeholder='Ex: "Curcumina Pura 500mg", "Colágeno Peptídeo Ultra", "Fórmula Fígado Limpo"...'
                  className="w-full rounded-md border border-lime-900/70 bg-[#07130d] px-2.5 py-2 text-xs text-lime-100 placeholder:text-lime-800/60 focus:border-lime-500 focus:outline-none"
                />
                <span className="text-[10px] text-lime-400/60 block">
                  Padrão automático: IA cria o suplemento encapsulado perfeito para o tema (ex: cúrcuma concentrada para inflamação).
                </span>
              </div>
            </div>

            {/* Optional legacy book fallback input */}
            <div className="pt-2 border-t border-lime-950/80">
              <details className="text-[11px] text-lime-400/80">
                <summary className="cursor-pointer font-medium hover:text-lime-200 transition-colors">
                  Deseja vender Livro Físico / Guia em vez de Encapsulado? (Configuração Alternativa)
                </summary>
                <div className="mt-2 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customBookTitle}
                    onChange={(e) => setCustomBookTitle(e.target.value)}
                    placeholder='Título do livro alternativo (Ex: "Farmácia da Longevidade")...'
                    className="w-full rounded-md border border-lime-900/70 bg-[#07130d] px-2.5 py-1.5 text-xs text-lime-100 placeholder:text-lime-800/60 focus:border-lime-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-lime-500/70 flex items-center">
                    Se preenchido, a IA adapta a venda dos prompts finais para o livro físico indicado.
                  </span>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Toggle Reference Section (Video Viral, Image, Video Transcript, Notes) */}
        <div className="border-t border-emerald-900/30 pt-3">
          <button
            type="button"
            id="btn-toggle-reference"
            onClick={() => setShowAdvancedReference(!showAdvancedReference)}
            className="flex items-center justify-between w-full text-xs font-semibold text-emerald-300 hover:text-emerald-100 transition-colors"
          >
            <span className="flex items-center gap-1.5 flex-wrap">
              <Video className="h-3.5 w-3.5 text-emerald-400" />
              <span>Analisar Vídeo Viral, Imagem ou Transcrição de Referência (Opcional)</span>
              {referenceVideoBase64 && (
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  Vídeo Ativo ({videoFileSizeMB}MB)
                </span>
              )}
              {referenceImageBase64 && (
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  Foto Ativa
                </span>
              )}
              {referenceText && !referenceVideoBase64 && !referenceImageBase64 && (
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  Texto Ativo
                </span>
              )}
            </span>
            {showAdvancedReference ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvancedReference && (
            <div className="mt-3 space-y-4 rounded-lg bg-[#0c1410] p-3.5 border border-emerald-900/40">
              <div className="flex items-start gap-2 rounded-lg bg-emerald-950/40 p-2.5 border border-emerald-800/40">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                  Suba um <strong>vídeo viral de referência</strong> (TikTok, Reels, Shorts) para a IA decodificar a <strong>engenharia visual de retenção</strong>: objeto colossal do gancho inicial (00:00 a 00:08), ritmo, cortes, ordem de manipulação dos ingredientes e tom conversacional direto (anti-locutor).
                </p>
              </div>

              {/* Upload Viral Video Reference */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    1. Vídeo Viral de Referência (.mp4, .webm, .mov):
                  </label>
                  <span className="text-[10px] text-emerald-400/80">Recomendado até 60MB</span>
                </div>

                <input
                  type="file"
                  ref={videoFileInputRef}
                  onChange={handleVideoFileChange}
                  accept="video/mp4,video/webm,video/quicktime,video/mov,video/*"
                  className="hidden"
                  id="input-file-video-reference"
                />

                {!referenceVideoBase64 ? (
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={videoLoading}
                    className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-emerald-700/60 bg-[#101b15] py-4 px-3 text-xs text-emerald-300 hover:border-emerald-500 hover:bg-[#14231b] transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-emerald-900/60 p-2 text-emerald-400 group-hover:bg-emerald-800/80 transition-colors">
                        <Video className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-emerald-200 group-hover:text-emerald-100">
                          {videoLoading ? 'Processando vídeo...' : 'Clique para subir o Vídeo Viral de Referência'}
                        </p>
                        <p className="text-[10px] text-emerald-400/70">
                          Formatos aceitos: MP4, MOV, WebM. A IA analisará cada segundo do gancho e ritmo.
                        </p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-2 rounded-lg border border-emerald-700/60 bg-[#122018] p-3 text-xs text-emerald-200">
                    <div className="flex items-center justify-between gap-2 border-b border-emerald-900/40 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Film className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="font-medium text-emerald-100 truncate">{videoFileName || 'Vídeo de Referência'}</span>
                        <span className="rounded bg-emerald-900/70 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 shrink-0">
                          {videoFileSizeMB} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="rounded-md p-1 hover:bg-emerald-900 text-emerald-400 hover:text-red-400 transition-colors shrink-0"
                        title="Remover vídeo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {videoPreviewUrl && (
                      <div className="relative rounded-lg overflow-hidden border border-emerald-900/70 bg-black/60">
                        <video
                          src={videoPreviewUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-56 object-contain rounded-md"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-emerald-300/80 pt-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Vídeo carregado — pronto para decodificação viral
                      </span>
                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        className="text-[10px] text-emerald-400 underline hover:text-emerald-200"
                      >
                        Trocar vídeo
                      </button>
                    </div>
                  </div>
                )}

                {videoError && (
                  <div className="flex items-center gap-1.5 rounded-md bg-red-950/60 border border-red-800/50 p-2 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{videoError}</span>
                  </div>
                )}
              </div>

              {/* Divider between video and image/text options */}
              <div className="relative flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-emerald-900/40"></div>
                </div>
                <span className="relative bg-[#0c1410] px-2 text-[10px] font-semibold tracking-wider text-emerald-500/70 uppercase">
                  Ou materiais complementares
                </span>
              </div>

              {/* Upload Reference Image / Screenshot */}
              <div>
                <label className="block text-[11px] font-semibold text-emerald-300 mb-1">
                  2. Screenshot do Gancho ou Imagem de Apoio:
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="input-file-reference"
                />

                {!referenceImageBase64 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-800/80 bg-[#101b15] py-2.5 text-xs text-emerald-300 hover:border-emerald-600 hover:bg-[#132219] transition-colors"
                  >
                    <ImageIcon className="h-4 w-4 text-emerald-400" />
                    <span>Clique para enviar foto/print do gancho</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-700/60 bg-[#14231b] p-2.5 text-xs text-emerald-200">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{imageFileName || 'Imagem de Referência'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="rounded-md p-1 hover:bg-emerald-900 text-emerald-400 hover:text-red-400 transition-colors"
                      title="Remover imagem"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Reference Transcript or Notes */}
              <div>
                <label htmlFor="input-reference-text" className="block text-[11px] font-semibold text-emerald-300 mb-1">
                  3. Transcrição ou Descrição Textual do Vídeo de Referência:
                </label>
                <textarea
                  id="input-reference-text"
                  rows={3}
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                  placeholder="Cole aqui a transcrição do áudio de referência ou notas de como o criador executou as ações..."
                  className="w-full rounded-lg border border-emerald-900/70 bg-[#121c16] p-2.5 text-xs text-white placeholder:text-emerald-600/40 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            id="btn-generate-sequence"
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/80 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Engenheirando os 9 Prompts de 8s (72s)...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Gerar Sequência Completa (9 Prompts • 72s)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
