import React, { useState } from 'react';
import { Header } from './components/Header';
import { AssetUploaders } from './components/AssetUploaders';
import { CampaignForm } from './components/CampaignForm';
import { PromptCard } from './components/PromptCard';
import { RecipeStepByStepCard } from './components/RecipeStepByStepCard';
import { TeleprompterModal } from './components/TeleprompterModal';
import { ExportModal } from './components/ExportModal';
import { NUTRACEUTICAL_PRESETS } from './data/presets';
import { GeneratedCampaign, PresetNiche, PromptItem, RecipeStepByStep } from './types';
import { callLimpezaAgent } from './api';
import {
  Sparkles,
  Film,
  Clock,
  Download,
  Copy,
  Check,
  PlayCircle,
  AlertCircle,
  Layers,
  ShieldCheck,
  Zap,
  RotateCcw,
  ChefHat,
  Flame,
  Droplets,
} from 'lucide-react';

export default function App() {
  const defaultPreset = NUTRACEUTICAL_PRESETS[0];

  // Campaign Form State
  const [productName, setProductName] = useState(defaultPreset.productName);
  const [niche, setNiche] = useState(defaultPreset.nicheDescription);
  const [bodyPartModel, setBodyPartModel] = useState(defaultPreset.bodyPartModel);
  const [ingredients, setIngredients] = useState(defaultPreset.ingredients);
  const [scientificBacking, setScientificBacking] = useState(defaultPreset.scientificBacking || '');
  const [recipeStepByStep, setRecipeStepByStep] = useState<RecipeStepByStep | undefined>(defaultPreset.recipeStepByStep);
  const [characterDescription, setCharacterDescription] = useState(defaultPreset.characterDescription);
  const [characterEnglishDescription, setCharacterEnglishDescription] = useState('');
  const [supplementDescription, setSupplementDescription] = useState(defaultPreset.supplementDescription);
  const [settingDescription, setSettingDescription] = useState(defaultPreset.settingDescription);

  // Uploaded Assets State
  const [characterImagePreview, setCharacterImagePreview] = useState<string | null>(null);
  const [supplementImagePreview, setSupplementImagePreview] = useState<string | null>(null);

  // Video Settings
  const [targetPlatform, setTargetPlatform] = useState('kling');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [resolution, setResolution] = useState('4K UHD Master');
  const [narratorTone, setNarratorTone] = useState('Prático, Entusiasmado, Cúmplice e Seguro (Ritmo VSL Direct Response Limpeza)');
  const [promptCount, setPromptCount] = useState<number>(6);
  const [includeCTA, setIncludeCTA] = useState<boolean>(true);

  // Generation & Modals State
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Preset Selection
  const handleSelectPreset = (preset: PresetNiche) => {
    setProductName(preset.productName);
    setNiche(preset.nicheDescription);
    setBodyPartModel(preset.bodyPartModel);
    setIngredients(preset.ingredients);
    setScientificBacking(preset.scientificBacking || '');
    setRecipeStepByStep(preset.recipeStepByStep);
    setCharacterDescription(preset.characterDescription);
    setSupplementDescription(preset.supplementDescription);
    setSettingDescription(preset.settingDescription);
    setError(null);
  };

  // Generate Prompts
  const handleGeneratePrompts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data: GeneratedCampaign = await callLimpezaAgent('generate-prompts', {
        productName,
        niche,
        bodyPartModel,
        ingredients,
        scientificBacking,
        characterDescription,
        supplementDescription,
        settingDescription,
        targetPlatform,
        aspectRatio,
        resolution,
        narratorTone,
        promptCount,
        includeCTA,
      });
      
      // Ensure step-by-step recipe is attached
      if (!data.campaignOverview.recipeStepByStep && recipeStepByStep) {
        data.campaignOverview.recipeStepByStep = recipeStepByStep;
      }

      setGeneratedCampaign(data);

      // Smooth scroll to generated prompts
      setTimeout(() => {
        const el = document.getElementById('results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao gerar os prompts. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Refine single prompt
  const handleRefinePrompt = async (step: number, instruction: string) => {
    if (!generatedCampaign) return;
    setIsRefining(true);

    try {
      const targetPrompt = generatedCampaign.prompts.find((p) => p.step === step);
      if (!targetPrompt) return;

      const updatedPrompt: PromptItem = await callLimpezaAgent('refine-prompt', {
        promptData: targetPrompt,
        instruction,
        characterDescription,
        settingDescription,
        supplementDescription,
      });

      setGeneratedCampaign({
        ...generatedCampaign,
        prompts: generatedCampaign.prompts.map((p) => (p.step === step ? updatedPrompt : p)),
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao refinar prompt.');
    } finally {
      setIsRefining(false);
    }
  };

  // Quick copy all prompts with full speech and settings
  const handleCopyAllPrompts = async () => {
    if (!generatedCampaign) return;
    const text = generatedCampaign.prompts
      .map(
        (p) =>
          `=== CENA ${p.step}: ${p.title} (00:00 - 00:09 • RIGOROSAMENTE 9s) ===\n\n[PROMPT VISUAL 4K]:\n${p.videoPromptEnglish}\n\n[FALA DA ESPECIALISTA (9 SEGUNDOS)]: "${p.spokenScript}"\n\n[DIREÇÃO VOCAL]: ${p.voiceDirection || 'Tom entusiasmado e cúmplice de dona de casa'}\n\n[PARÂMETROS DE RENDER]: ${p.engineParameters || '--ar 9:16'}\n`,
      )
      .join('\n----------------------------------------\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Hero Badge */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300 font-mono tracking-wider uppercase">
                  Fórmula de Alta Conversão para Limpeza & Donas de Casa ({promptCount} Cenas • {promptCount * 9}s Total)
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  9s por cena
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Maquete gigante de sujeira 1,20m, misturinhas 100% reais de despensa, passo a passo detalhado e conformidade total com as diretrizes de anúncios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
              Age em 5 min sem esfregar
            </span>
          </div>
        </div>

        {/* Upload Visual Assets (Character & Supplement) */}
        <AssetUploaders
          characterDescription={characterDescription}
          setCharacterDescription={setCharacterDescription}
          characterEnglishDescription={characterEnglishDescription}
          setCharacterEnglishDescription={setCharacterEnglishDescription}
          supplementDescription={supplementDescription}
          setSupplementDescription={setSupplementDescription}
          characterImagePreview={characterImagePreview}
          setCharacterImagePreview={setCharacterImagePreview}
          supplementImagePreview={supplementImagePreview}
          setSupplementImagePreview={setSupplementImagePreview}
        />

        {/* Campaign Input Form */}
        <CampaignForm
          productName={productName}
          setProductName={setProductName}
          niche={niche}
          setNiche={setNiche}
          bodyPartModel={bodyPartModel}
          setBodyPartModel={setBodyPartModel}
          ingredients={ingredients}
          setIngredients={setIngredients}
          settingDescription={settingDescription}
          setSettingDescription={setSettingDescription}
          characterDescription={characterDescription}
          setCharacterDescription={setCharacterDescription}
          supplementDescription={supplementDescription}
          setSupplementDescription={setSupplementDescription}
          targetPlatform={targetPlatform}
          setTargetPlatform={setTargetPlatform}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          resolution={resolution}
          setResolution={setResolution}
          narratorTone={narratorTone}
          setNarratorTone={setNarratorTone}
          promptCount={promptCount}
          setPromptCount={setPromptCount}
          includeCTA={includeCTA}
          setIncludeCTA={setIncludeCTA}
          onGenerate={handleGeneratePrompts}
          isLoading={isLoading}
          onSelectPreset={handleSelectPreset}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="my-12 p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center justify-center space-y-4 shadow-2xl backdrop-blur-md">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
              <Sparkles className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Diretoria de Arte IA: Construindo {promptCount} Prompts de Limpeza 4K...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Calibrando exatamente 9 segundos por fala (~22 palavras), maquete gigante de 1,20m da sujeira, misturinhas reais de despensa e modo de preparo passo a passo.
              </p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Section */}
        {generatedCampaign && (
          <div id="results-section" className="space-y-6 animate-in fade-in duration-300">
            {/* Campaign Overview Bar */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-emerald-400 font-mono tracking-wider uppercase">
                    Roteiro de Limpeza Gerado com Sucesso
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  {generatedCampaign.campaignOverview.productName} •{' '}
                  <span className="text-slate-400 text-sm font-normal">
                    {generatedCampaign.campaignOverview.niche}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {generatedCampaign.prompts.length} Prompts encadeados ({generatedCampaign.prompts.length * 9}s total) com a mesma dona de casa/especialista, mesma cozinha moderna e 9s de fala cada.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsTeleprompterOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Ensaio 9s (Teleprompter)</span>
                </button>

                <button
                  onClick={handleCopyAllPrompts}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Todos Copiados!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Todos ({generatedCampaign.prompts.length} Cenas)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsExportOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Roteiro 4K</span>
                </button>
              </div>
            </div>

            {/* Consistency Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Especialista / Dona de Casa Canônica:
                </span>
                <p className="text-slate-300 line-clamp-3">
                  {generatedCampaign.campaignOverview.consistentCharacter}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Film className="w-3.5 h-3.5" />
                  Cenário e Iluminação Fixa:
                </span>
                <p className="text-slate-300 line-clamp-3">
                  {generatedCampaign.campaignOverview.consistentSetting}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Produto de Limpeza Segurado (Cenas Finais):
                </span>
                <p className="text-slate-300 line-clamp-3">
                  {generatedCampaign.campaignOverview.bottleAppearance}
                </p>
              </div>
            </div>

            {/* Step-by-Step Recipe Guide Card with exact timings and instructions */}
            {(generatedCampaign.campaignOverview.recipeStepByStep || recipeStepByStep) && (
              <RecipeStepByStepCard
                recipe={generatedCampaign.campaignOverview.recipeStepByStep || recipeStepByStep!}
                productName={generatedCampaign.campaignOverview.productName}
              />
            )}

            {/* The Sequential Prompt Cards */}
            <div className="space-y-6">
              {generatedCampaign.prompts.map((prompt) => (
                <PromptCard
                  key={prompt.step}
                  prompt={prompt}
                  onRefinePrompt={handleRefinePrompt}
                  isRefining={isRefining}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {generatedCampaign && (
        <>
          <TeleprompterModal
            isOpen={isTeleprompterOpen}
            onClose={() => setIsTeleprompterOpen(false)}
            prompts={generatedCampaign.prompts}
            characterPreview={characterImagePreview}
            supplementPreview={supplementImagePreview}
            productName={generatedCampaign.campaignOverview.productName}
          />

          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            campaign={generatedCampaign}
          />
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Agente Especialista em Prompts para Limpeza & Donas de Casa • 4K UHD Master</p>
          <p className="text-slate-600 font-mono">
            Kling AI 2.0 • Sora • Runway Gen-3 • Luma • 9s por Cena Rigorosos
          </p>
        </div>
      </footer>
    </div>
  );
}
