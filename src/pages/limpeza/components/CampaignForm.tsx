import React, { useState } from 'react';
import { callLimpezaAgent } from '../api';
import {
  Sparkles,
  Sliders,
  Shield,
  Wand2,
  Eye,
  Zap,
  Flame,
  Activity,
  Droplets,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Layers,
  Megaphone,
  Heart,
  ChefHat,
  Clock,
} from 'lucide-react';
import { NUTRACEUTICAL_PRESETS } from '../data/presets';
import { PresetNiche } from '../types';

interface CampaignFormProps {
  productName: string;
  setProductName: (val: string) => void;
  niche: string;
  setNiche: (val: string) => void;
  bodyPartModel: string;
  setBodyPartModel: (val: string) => void;
  ingredients: string;
  setIngredients: (val: string) => void;
  settingDescription: string;
  setSettingDescription: (val: string) => void;
  characterDescription: string;
  setCharacterDescription: (val: string) => void;
  supplementDescription: string;
  setSupplementDescription: (val: string) => void;
  targetPlatform: string;
  setTargetPlatform: (val: string) => void;
  aspectRatio: string;
  setAspectRatio: (val: string) => void;
  resolution: string;
  setResolution: (val: string) => void;
  narratorTone: string;
  setNarratorTone: (val: string) => void;
  promptCount: number;
  setPromptCount: (val: number) => void;
  includeCTA: boolean;
  setIncludeCTA: (val: boolean) => void;
  onGenerate: () => void;
  isLoading: boolean;
  onSelectPreset: (preset: PresetNiche) => void;
}

const SUGGESTED_THEMES = [
  { label: '🍳 Gordura de Fogão & Fundo de Panela Queimado', theme: 'Crosta preta de gordura vegetal carbonizada no fundo da panela e trempes do fogão' },
  { label: '🚿 Rejunte Encardido & Mofo no Box do Banheiro', theme: 'Rejuntes de azulejo encardidos de preto, mofo impregnado pela umidade e limo persistente' },
  { label: '🪟 Box de Vidro com Mancha de Gordura e Calcário', theme: 'Vidro do box esbranquiçado e opaco por acúmulo de gordura corporal, restos de sabonete e calcário' },
  { label: '🛋️ Sofá e Colchão: Manchas de Suor, Urina e Ácaros', theme: 'Manchas amareladas de suor no colchão, urina de pet no sofá de tecido e proliferação de ácaros' },
  { label: '🚰 Ralo com Mau Cheiro, Gordura e Sifão Lento', theme: 'Água da pia da cozinha descendo devagar, borbulhas com cheiro fétido de esgoto e gordura no sifão' },
  { label: '🪞 Inox Espelhado & Remoção de Ferrugem Sem Riscar', theme: 'Eletrodomésticos de inox manchados por marcas de dedos, pontos de ferrugem na pia e queimaduras' },
  { label: '🧹 Piso Cerâmico Encardido & Chão Gorduroso', theme: 'Chão de cerâmica ou porcelanato que fica embaçado, gordura grudando na sola do pé e sem brilho' },
  { label: '❄️ Ventilador e Ar-Condicionado com Poeira Preta', theme: 'Hélices de ventilador pretas de gordura e poeira, aletas de ar-condicionado cheias de ácaros e rinite' },
];

export const CampaignForm: React.FC<CampaignFormProps> = ({
  productName,
  setProductName,
  niche,
  setNiche,
  bodyPartModel,
  setBodyPartModel,
  ingredients,
  setIngredients,
  settingDescription,
  setSettingDescription,
  characterDescription,
  setCharacterDescription,
  supplementDescription,
  setSupplementDescription,
  targetPlatform,
  setTargetPlatform,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  narratorTone,
  setNarratorTone,
  promptCount,
  setPromptCount,
  includeCTA,
  setIncludeCTA,
  onGenerate,
  isLoading,
  onSelectPreset,
}) => {
  const [customTheme, setCustomTheme] = useState('');
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState<string | null>(null);
  const [autofillError, setAutofillError] = useState<string | null>(null);

  const handleAutofill = async (themeToUse?: string) => {
    const selectedTheme = (themeToUse || customTheme).trim();
    if (!selectedTheme) {
      setAutofillError('Digite um problema de limpeza no campo ou clique em uma das sugestões rápidas abaixo.');
      return;
    }

    setIsAutofilling(true);
    setAutofillError(null);
    setAutofillSuccess(null);

    try {
      const data = await callLimpezaAgent('autofill-theme', { theme: selectedTheme });

      if (data.productName) setProductName(data.productName);
      if (data.niche) setNiche(data.niche);
      if (data.bodyPartModel) setBodyPartModel(data.bodyPartModel);
      if (data.ingredients) setIngredients(data.ingredients);
      if (data.characterDescription) setCharacterDescription(data.characterDescription);
      if (data.supplementDescription) setSupplementDescription(data.supplementDescription);
      if (data.settingDescription) setSettingDescription(data.settingDescription);
      if (data.narratorTone) setNarratorTone(data.narratorTone);

      setCustomTheme(selectedTheme);
      setAutofillSuccess(`Campos gerados com sucesso para: "${selectedTheme}"!`);
      setTimeout(() => setAutofillSuccess(null), 6000);
    } catch (err: any) {
      console.error(err);
      setAutofillError(err.message || 'Erro ao preencher campos com IA.');
    } finally {
      setIsAutofilling(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 mb-8 shadow-2xl backdrop-blur-md">
      {/* 🌟 AI Auto-fill By Cleaning Theme */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-slate-950 border border-emerald-500/30 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Preenchimento Automático com IA • Nicho de Limpeza e Donas de Casa
                <span className="text-[10px] bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Home Care 4K
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Escreva qualquer dor de limpeza doméstica para a IA desenhar o produto, maquete 1,20m, misturinha potente e cenário acolhedor
              </p>
            </div>
          </div>
        </div>

        {/* Input bar with instant action button */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={customTheme}
              onChange={(e) => {
                setCustomTheme(e.target.value);
                if (autofillError) setAutofillError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAutofill();
                }
              }}
              placeholder="Digite o problema de limpeza... Ex: Panela com fundo queimado de gordura, Rejunte preto do box, Sofá com manchas de pet..."
              className="w-full bg-slate-950/90 border border-emerald-500/30 focus:border-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
            />
          </div>

          <button
            type="button"
            disabled={isAutofilling}
            onClick={() => handleAutofill()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
          >
            {isAutofilling ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>IA Preenchendo Limpeza...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Preencher Campos de Limpeza com IA</span>
              </>
            )}
          </button>
        </div>

        {/* Suggested Theme Chips */}
        <div>
          <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1.5">
            <span>Ou clique em uma dor de faxina em alta para autocompletar na hora:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {SUGGESTED_THEMES.map((item, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isAutofilling}
                onClick={() => {
                  setCustomTheme(item.theme);
                  handleAutofill(item.theme);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-emerald-500/20 hover:border-emerald-400/50 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-emerald-200 transition-all duration-150 active:scale-95"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-3 h-3 text-emerald-400 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Success Feedback */}
        {autofillSuccess && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{autofillSuccess}</span>
          </div>
        )}

        {/* Error Feedback */}
        {autofillError && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{autofillError}</span>
          </div>
        )}
      </div>

      {/* 🌟 Regras de Ouro Invioláveis do Agente de Limpeza */}
      <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Regras do Agente • Vídeos de Limpeza de Alta Conversão (Brasil)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Regras Ativas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px]">
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">🚫</span>
            <div>
              <strong className="text-slate-200 block">Sem Frases Clichês</strong>
              <span className="text-slate-400">Zero jargões vazios ("segredo milagroso", "fórmula mágica"). Falas sinceras de dona de casa real.</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
            <span className="text-amber-400 font-bold shrink-0">🇧🇷</span>
            <div>
              <strong className="text-slate-200 block">Falas para o Público do Brasil</strong>
              <span className="text-slate-400">Vocabulário coloquial de dona de casa: "gordura preta", "sem cansar o braço", "rejunte encardido".</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
            <span className="text-cyan-400 font-bold shrink-0">⏱️</span>
            <div>
              <strong className="text-slate-200 block">Somente 9s de Fala por Cena</strong>
              <span className="text-slate-400">Rigorosamente entre 20 e 24 palavras por prompt, cronometradas para 9.0 segundos.</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
            <span className="text-emerald-400 font-bold shrink-0">🌿</span>
            <div>
              <strong className="text-slate-200 block">Misturinhas 100% Reais & Seguras</strong>
              <span className="text-slate-400">Química doméstica comprovada. Jamais misturas perigosas como cloro com vinagre ou amônia.</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
            <span className="text-teal-400 font-bold shrink-0">🛒</span>
            <div>
              <strong className="text-slate-200 block">Ingredientes Caseiros da Despensa</strong>
              <span className="text-slate-400">Bicarbonato, vinagre, limão, detergente neutro, água oxigenada, sabão de coco e sal.</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/40 bg-amber-500/5 flex items-start gap-2">
            <span className="text-amber-300 font-bold shrink-0">💡</span>
            <div>
              <strong className="text-amber-300 block">Prompt 4: Pra Que Serve & Como Usar</strong>
              <span className="text-amber-200/80">Obrigatoriamente explica a função na sujeira e o modo exato de aplicar em 9s sem esfregar.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Presets Bar */}
      <div className="mb-6 pb-5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Fórmulas Caseiras de Limpeza Pesada (1-Clique):
          </label>
          <span className="text-[11px] text-slate-500">
            Modelos validados para donas de casa e faxina prática
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {NUTRACEUTICAL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-emerald-500/15 hover:border-emerald-500/40 border border-slate-700/70 text-xs font-medium text-slate-200 hover:text-emerald-300 transition-all duration-150 active:scale-95"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1">
            Nome do Produto de Limpeza (Spray, Desengordurante, Concentrado ou Refil):
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ex: DesengorduraMax Pro, RejunteBranco BioPower, CristalBox Anti-Gota..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Niche / Pain */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1">
            Nicho e Dor Central da Faxina / Dona de Casa:
          </label>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Ex: Gordura vegetal carbonizada no fundo da panela, cansaço de esfregar com palha de aço..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Huge Dirt/Grout/Grease Model (Prompt 1 Hook - Foco Total na Maquete Gigante 1,20m) */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Maquete Gigante de 1,20m da Sujeira & Foco do Gancho (Prompt 1):
          </label>
          <span className="text-[11px] text-emerald-400/80 font-medium">
            🎯 Foco visual primário da câmera • Corte transversal microscópico ampliado da sujeira/gordura/rejunte
          </span>
        </div>
        <textarea
          rows={2}
          value={bodyPartModel}
          onChange={(e) => setBodyPartModel(e.target.value)}
          placeholder="Ex: Maquete gigante de 1,20m do fundo de panela em corte transversal microscópico ampliado 1000x: camadas pretas de gordura polimerizada e carbonizada fundidas nos microporos do metal, exibindo a película áspera impenetrável sob luz 8K..."
          className="w-full bg-slate-950 border border-emerald-500/40 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
        />
      </div>

      {/* Active Natural Homemade Ingredients */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Ingredientes Caseiros da Despensa (Citados Nominalmente no Prompt 2):
          </label>
          <span className="text-[11px] text-amber-300/90 font-medium">
            🌿 Ingredientes comuns (Bicarbonato, Vinagre, Limão, Detergente, Água oxigenada...)
          </span>
        </div>
        <textarea
          rows={2}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Ex: Bicarbonato de sódio puro de cozinha, Detergente neutro transparente, Vinagre de álcool branco morno e Suco de meio Limão fresco..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors font-mono"
        />

        {/* Step-by-Step Preparation & Ready Time Helper Box */}
        <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-300 block text-[11px] uppercase tracking-wide">
                Protocolo da Misturinha Passo a Passo & Tempo para Agir:
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                A IA calibra as cenas da receita para demonstrar o preparo real: <strong>Passo 1 (Mistura na tigela)</strong> ➔ <strong>Passo 2 (Aplicação na crosta)</strong> ➔ <strong>Passo 3 (Tempo de ação de 5 minutos)</strong> ➔ <strong>Passo 4 (Remoção sem esfregar)</strong>.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Age em 5 min</span>
          </div>
        </div>
      </div>

      {/* Fixed Studio Setting */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Cenário Fixo e Iluminação Acolhedora (mesmo cenário em todas as cenas):
        </label>
        <input
          type="text"
          value={settingDescription}
          onChange={(e) => setSettingDescription(e.target.value)}
          placeholder="Ex: Cozinha residencial moderna e impecável com bancada de granito preto São Gabriel polido, fogão cooktop limpo ao fundo e iluminação difusa quente 5400K..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
        />
      </div>

      {/* Dynamic Prompt Quantity Selector (3 to 10 Prompts) */}
      <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <label className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Estrutura de Vídeo de Limpeza (3 a 10 Cenas):</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono border border-emerald-500/40">
                {promptCount} Cenas ({promptCount * 9}s total)
              </span>
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Segue rigorosamente o formato de <strong>Misturinha Prática de Limpeza</strong>: {promptCount === 6 ? '6 cenas completas' : `${promptCount} cenas adaptadas`} {includeCTA ? '(com fechamento de CTA Frasco "EU QUERO")' : '(100% caseiro, sem cena de venda)'}.
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              ⏱️ {promptCount * 9}s VSL • ~{promptCount * 22} palavras
            </span>
          </div>
        </div>

        {/* Quick Scene Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
          {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isSelected = promptCount === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setPromptCount(num)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                  isSelected
                    ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-slate-950 font-black border-emerald-400 shadow-md shadow-emerald-500/20 scale-[1.03]'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-sm font-black">{num} {num === 6 ? '⭐' : ''}</span>
                <span className="text-[9px] font-mono opacity-80">{num * 9}s</span>
              </button>
            );
          })}
        </div>

        {/* Narrative Flow Preview for Chosen Count */}
        <div className="bg-slate-900/70 rounded-lg p-2.5 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-2">
          <span className="text-emerald-400 font-bold shrink-0">Fluxo da Narrativa:</span>
          <span className="text-slate-400 truncate">
            {promptCount === 3 && (includeCTA 
              ? '1. Gancho Maquete 1,20m da Sujeira (9s) ➔ 2. Misturinha de Fácil Acesso + Ação em 5 min (9s) ➔ 3. Pra Que Serve, Como Usar + CTA Frasco "EU QUERO" (9s)'
              : '1. Gancho Maquete 1,20m da Sujeira (9s) ➔ 2. Misturinha de Fácil Acesso + Ação em 5 min (9s) ➔ 3. Pra Que Serve, Como Usar & Casa Brilhando (Sem CTA) (9s)'
            )}
            {promptCount === 4 && (includeCTA
              ? '1. Gancho Maquete (9s) ➔ 2. Ingrediente Caseiro da Despensa (9s) ➔ 3. Como Fazer Passo a Passo em 5 min (9s) ➔ 4. Pra Que Serve, Como Usar & CTA Frasco "EU QUERO" (9s)'
              : '1. Gancho Maquete (9s) ➔ 2. Ingrediente Caseiro da Despensa (9s) ➔ 3. Como Fazer Passo a Passo em 5 min (9s) ➔ 4. Pra Que Serve & Como Usar na Prática (Sem CTA) (9s)'
            )}
            {promptCount === 5 && (includeCTA
              ? '1. Gancho Maquete (9s) ➔ 2. Ingrediente Caseiro da Despensa (9s) ➔ 3. Como Fazer Passo a Passo em 5 min (9s) ➔ 4. Pra Que Serve & Como Usar (9s) ➔ 5. CTA Frasco em Mãos "EU QUERO" (9s)'
              : '1. Gancho Maquete (9s) ➔ 2. Ingrediente Caseiro da Despensa (9s) ➔ 3. Como Fazer Passo a Passo em 5 min (9s) ➔ 4. Pra Que Serve & Como Usar (9s) ➔ 5. Brilho Real Sem Esforço (Sem CTA) (9s)'
            )}
            {promptCount === 6 && (includeCTA
              ? '1. Gancho Maquete (9s) ➔ 2. Ingredientes da Despensa (9s) ➔ 3. Como Fazer Passo a Passo em 5 min (9s) ➔ 4. Pra Que Serve & Como Usar (9s) ➔ 5. CTA Frasco em Mãos "EU QUERO" (9s) ➔ 6. Resultado Real e Casa Brilhando Sem Cansar o Braço (9s)'
              : '1. Gancho Maquete (9s) ➔ 2. Ingredientes da Despensa (9s) ➔ 3. Como Fazer Passo a Passo em 5 min (9s) ➔ 4. Pra Que Serve & Como Usar (9s) ➔ 5. Medidas Exatas de Colher (9s) ➔ 6. Casa Impecável Sem Esfregar (Sem CTA) (9s)'
            )}
            {promptCount === 7 && (includeCTA
              ? '1. Gancho Maquete (9s) ➔ 2. Nomes dos Ingredientes Caseiros (9s) ➔ 3. Como Fazer Passo a Passo em 5 min (9s) ➔ 4. Pra Que Serve & Como Usar (9s) ➔ 5. Medidas de Colher & Diluição (9s) ➔ 6. CTA Frasco "EU QUERO" (9s) ➔ 7. Brilho Espelhado Sem Esforço (9s)'
              : '1. Gancho Maquete (9s) ➔ 2. Nomes dos Ingredientes Caseiros (9s) ➔ 3. Como Fazer Passo a Passo em 5 min (9s) ➔ 4. Pra Que Serve & Como Usar (9s) ➔ 5. Medidas de Colher & Diluição (9s) ➔ 6. Ação Desengordurante (9s) ➔ 7. Brilho Espelhado (Sem CTA) (9s)'
            )}
            {promptCount >= 8 && (includeCTA
              ? `1. Gancho Maquete (9s) ➔ 2. Nomes dos Ingredientes (9s) ➔ 3. Preparo em 5 min (9s) ➔ 4. Pra Que Serve & Como Usar (9s) ➔ 5. Medidas Exatas (9s) ➔ 6. Química Doméstica Explicada Simples (9s) ➔ 7. CTA Frasco "EU QUERO" (9s) ➔ 8. Casa Impecável (9s)`
              : `1. Gancho Maquete (9s) ➔ 2. Nomes dos Ingredientes (9s) ➔ 3. Preparo em 5 min (9s) ➔ 4. Pra Que Serve & Como Usar (9s) ➔ 5. Medidas Exatas (9s) ➔ 6. Química Doméstica (9s) ➔ 7. Brilho Espelhado (9s) ➔ 8. Faxina Sem Sofrimento (Sem CTA) (9s)`
            )}
          </span>
        </div>
      </div>

      {/* Opção de Gerar ou Não o CTA (Chamada para Ação) */}
      <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
            includeCTA 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-200">
                Gerar Cena de CTA ("EU QUERO" + Apresentação do Produto de Limpeza):
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                includeCTA 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {includeCTA ? 'ATIVADO (Comercial / VSL de Limpeza)' : 'DESATIVADO (Conteúdo 100% Orgânico / Dica Caseira)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {includeCTA ? (
                <>
                  <strong className="text-emerald-300">Com CTA ativado:</strong> Finaliza com a especialista segurando o produto de limpeza (spray, desengordurante ou frasco dosador) virado para a câmera, pedindo para as donas de casa comentarem <span className="text-emerald-300 font-bold">"EU QUERO"</span> nos comentários para receberem o link com condição especial no direct.
                </>
              ) : (
                <>
                  <strong className="text-slate-300">Sem CTA (Orgânico):</strong> O vídeo foca 100% na misturinha caseira natural, modo de preparo, tempo de ação e benefícios de brilho espelhado sem esforço. <span className="text-emerald-400/90 font-medium">Nenhuma cena de venda, menção a direct ou frasco de produto.</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            role="switch"
            aria-checked={includeCTA}
            onClick={() => setIncludeCTA(!includeCTA)}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
              includeCTA ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                includeCTA ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Technical Video & Prompt Engine Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        {/* Engine */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Motor de Vídeo IA:
          </label>
          <select
            value={targetPlatform}
            onChange={(e) => setTargetPlatform(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="kling">Kling AI 1.5 / 2.0 Pro (Direct Mode)</option>
            <option value="sora">OpenAI Sora (Ultra 4K)</option>
            <option value="runway">Runway Gen-3 Alpha HD</option>
            <option value="luma">Luma Dream Machine Ray 2</option>
            <option value="universal">Universal Master Prompt (Qualquer IA)</option>
          </select>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Formato / Proporção:
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="9:16">9:16 (Vertical Reels / TikTok / Shorts)</option>
            <option value="16:9">16:9 (Horizontal VSL / YouTube / Web)</option>
            <option value="1:1">1:1 (Quadrado Feed)</option>
          </select>
        </div>

        {/* Resolution */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Fidelidade Visual 4K:
          </label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="4K UHD Master">4K UHD Master (Máxima Fidelidade)</option>
            <option value="8K Raw Hyper-Realistic">8K Raw Photorealistic Texture</option>
            <option value="Cinematic 35mm Film">Cinematic 35mm Arri Alexa 5400K</option>
          </select>
        </div>

        {/* Narrator Tone */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Tom de Narração:
          </label>
          <select
            value={narratorTone}
            onChange={(e) => setNarratorTone(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="Prático, Entusiasmado, Cúmplice e Seguro (Ritmo VSL Direct Response Limpeza)">
              Prático & Entusiasmado (Dona de Casa VSL)
            </option>
            <option value="Cumplicidade de Dona de Casa com Dicas Preciosas">
              Cumplicidade de Vizinha para Vizinha
            </option>
            <option value="Autoridade Serena em Organização Doméstica">
              Autoridade Serena em Higienização
            </option>
          </select>
        </div>
      </div>

      {/* Generate Action Button */}
      <button
        onClick={onGenerate}
        disabled={isLoading || !productName.trim()}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            <span>Engenharia de Prompts de Limpeza em Execução ({promptCount} Cenas com Gemini)...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-slate-950" />
            <span>GERAR {promptCount} PROMPTS LIMPEZA & DONAS DE CASA 4K ({promptCount * 9}s TOTAL • 9s CADA CENA • {includeCTA ? 'COM CTA "EU QUERO"' : 'SEM CTA / 100% ORGÂNICO'})</span>
          </>
        )}
      </button>
    </div>
  );
};
