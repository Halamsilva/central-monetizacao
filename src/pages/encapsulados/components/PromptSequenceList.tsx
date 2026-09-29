import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Volume2, 
  Layers, 
  ArrowDown, 
  Share2, 
  Code,
  Sparkles,
  Play,
  Trash2,
  Zap,
  Droplets,
  User,
  Building2,
  Ban,
  BookOpen,
  Pill,
  Hash,
  Video,
  Film
} from 'lucide-react';
import { VideoScript, CorpoReveladoPrompt } from '../types';

interface PromptSequenceListProps {
  script: VideoScript;
  activePromptId: number;
  onSelectPrompt: (id: number) => void;
  onClearPrompts: () => void;
}

export const PromptSequenceList: React.FC<PromptSequenceListProps> = ({
  script,
  activePromptId,
  onSelectPrompt,
  onClearPrompts,
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedNarration, setCopiedNarration] = useState<boolean>(false);
  const [copiedSeo, setCopiedSeo] = useState<boolean>(false);

  // Generate plain-text SEO block (sem marcações, apenas Título, Descrição, 5 Hashtags e Resumo)
  const getSeoBlockText = () => {
    const cleanTheme = script.theme.trim();
    // Derive hashtags based on theme and solution
    const formatTag = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '');
    const tag1 = formatTag(cleanTheme) || 'SaudeNatural';
    const tag2 = 'ReceitaCaseira';
    const tag3 = 'RemedioNatural';
    const tag4 = 'SaudeEBemEstar';
    const tag5 = script.productTitleUsed 
      ? formatTag(script.productTitleUsed) 
      : (script.bookTitleUsed ? formatTag(script.bookTitleUsed) : 'EncapsuladosNaturais');

    const title = `Como Tratar ${cleanTheme} Naturalmente com Receita Caseira Rápida`;
    const description = `${script.summary || `Aprenda o passo a passo prático para combater e tratar ${cleanTheme} usando ingredientes naturais simples da sua cozinha.`} Assista até o final para ver a preparação completa e como garantir a fórmula concentrada em cápsulas com desconto de fábrica.`;
    const hashtags = `#${tag1} #${tag2} #${tag3} #${tag4} #${tag5}`;
    const videoSummary = script.summary || `Demonstração visual em ${script.prompts.length} etapas mostrando o gancho visceral de ${cleanTheme}, a explicação do problema por dentro, os ingredientes caseiros ativos, o preparo ao vivo na panela, a degustação e os dois prompts de CTA para o suplemento concentrado em cápsulas.`;

    return `Titulo:
${title}

Descrição:
${description}

Hashtags:
${hashtags}

Resumo do vídeo:
${videoSummary}`;
  };

  const handleCopySeoBlock = async () => {
    try {
      await navigator.clipboard.writeText(getSeoBlockText());
      setCopiedSeo(true);
      setTimeout(() => setCopiedSeo(false), 2000);
    } catch (err) {
      console.error('Failed to copy SEO block:', err);
    }
  };

  // Generates the complete, standardized formatted text for a single prompt with ALL descriptions and physical movements included
  const formatSinglePromptText = (prompt: CorpoReveladoPrompt, mode: 'complete' | 'promptOnly' | 'speechOnly' = 'complete') => {
    if (mode === 'speechOnly') {
      return `[${prompt.stepName} • ${prompt.timeRange}]\n"${prompt.spokenLinePt}"`;
    }

    if (mode === 'promptOnly') {
      let text = prompt.promptText.trim();
      if (!text.includes(prompt.spokenLinePt)) {
        text += `\n\nSPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization, spoken naturally without on-screen subtitles):\n"${prompt.spokenLinePt}"`;
      }
      return text;
    }

    // Default 'complete' mode: includes ALL descriptions, physical movements, focal object, spoken dialogue, and full AI video prompt
    const sections: string[] = [];

    sections.push(`==================================================`);
    sections.push(`${prompt.stepName} (${prompt.timeRange})`);
    sections.push(`DIRETRIZ DE VÍDEO: SEM LEGENDAS NEM TEXTOS NA TELA (RAW CINEMATIC FOOTAGE)`);
    sections.push(`==================================================`);

    if (prompt.focalObject) {
      sections.push(`OBJETO PRINCIPAL EM PRIMEIRO PLANO:\n${prompt.focalObject}`);
    }

    if (prompt.actionSummary) {
      sections.push(`CONTINUIDADE FÍSICA & DESCRIÇÃO COMPLETA DAS MOVIMENTAÇÕES (AÇÃO EM CENA):\n${prompt.actionSummary}`);
    }

    if (prompt.cameraFraming) {
      sections.push(`ENQUADRAMENTO DA CÂMERA & LENTE:\n${prompt.cameraFraming}`);
    }

    sections.push(`FALA DO APRESENTADOR (Português Brasileiro • 8s • Sincronia Labial • SEM legendas na tela):\n"${prompt.spokenLinePt}"`);

    let technicalPrompt = prompt.promptText.trim();
    if (!technicalPrompt.includes(prompt.spokenLinePt)) {
      technicalPrompt += `\n\nSPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization, spoken naturally without on-screen subtitles):\n"${prompt.spokenLinePt}"`;
    }

    sections.push(`PROMPT COMPLETO DE VÍDEO PARA IA (Inglês Técnico com todas as movimentações e descrições):\n${technicalPrompt}`);

    return sections.join('\n\n');
  };

  // Format all prompts in the exact mandatory format with Fala explicitly attached to each
  const formatAllPromptsText = () => {
    return script.prompts
      .map((p) => formatSinglePromptText(p, 'complete'))
      .join('\n\n==================================================\n\n');
  };

  const handleCopyIndividual = async (prompt: CorpoReveladoPrompt, mode: 'complete' | 'promptOnly' | 'speechOnly' = 'complete') => {
    try {
      const textToCopy = formatSinglePromptText(prompt, mode);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(prompt.id);
      setCopiedType(mode);
      setTimeout(() => {
        setCopiedId(null);
        setCopiedType(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatAllPromptsText());
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy all:', err);
    }
  };

  const handleCopyNarrationOnly = async () => {
    try {
      const narrationText = script.prompts
        .map((p) => `[${p.stepName.split('—')[1]?.trim() || `Prompt ${p.id}`} • ${p.timeRange}]\n"${p.spokenLinePt}"`)
        .join('\n\n');
      await navigator.clipboard.writeText(narrationText);
      setCopiedNarration(true);
      setTimeout(() => setCopiedNarration(false), 2000);
    } catch (err) {
      console.error('Failed to copy narration:', err);
    }
  };

  const handleDownloadTxt = () => {
    const header = `==================================================\nCORPO REVELADO — SEQUÊNCIA DE PROMPTS ULTRA-REALISTAS\n==================================================\nTEMA: ${script.theme}\nOBJETO: ${script.focalObject}\nCRIADO EM: ${new Date(script.createdAt).toLocaleString('pt-BR')}\nESTRUTURA: ${script.prompts.length} Prompts Conectados • 8 Segundos Cada • Total ${script.prompts.length * 8}s\nFORMATO: 9:16 • 4K • 30fps\nDIRETRIZ OBRIGATÓRIA: SEM LEGENDAS NEM TEXTOS NA TELA (RAW CINEMATIC FOOTAGE - NO SUBTITLES, NO ON-SCREEN TEXT)\n==================================================\n\n`;
    const fullText = header + formatAllPromptsText();
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `corpo-revelado-${script.theme.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `corpo-revelado-${script.theme.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="prompt-sequence-container" className="flex flex-col gap-5">
      {/* Top Action & Overview Bar */}
      <div className="rounded-xl border border-emerald-900/40 bg-[#121e17] p-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                {script.theme}
              </h2>
            </div>
            <p className="text-xs text-emerald-300/70 mt-1">
              {script.summary}
            </p>
          </div>

          {/* Master Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-copy-all-prompts"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              title={`Copiar todos os ${script.prompts.length} prompts completos com todas as descrições, movimentações em cena, objetos, falas e prompts técnicos para IA`}
            >
              {copiedAll ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
              <span>{copiedAll ? 'Todos Copiados (+ Movimentações)!' : `Copiar Todos (${script.prompts.length} Prompts Completos)`}</span>
            </button>

            <button
              id="btn-copy-narration"
              onClick={handleCopyNarrationOnly}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-[#16271e] hover:bg-emerald-900/40 px-3 py-2 text-xs font-medium text-emerald-200 transition-colors"
              title="Copiar apenas o roteiro de fala para gravação ou dublagem"
            >
              {copiedNarration ? <Check className="h-3.5 w-3.5 text-amber-400" /> : <FileText className="h-3.5 w-3.5" />}
              <span>Copiar só as Falas ({script.prompts.length * 8}s)</span>
            </button>

            <button
              id="btn-copy-seo"
              onClick={handleCopySeoBlock}
              className="flex items-center gap-1.5 rounded-lg border border-amber-800/60 bg-[#221c10] hover:bg-amber-900/40 px-3 py-2 text-xs font-medium text-amber-200 transition-colors"
              title="Copiar bloco SEO sem marcações (Título, Descrição, 5 Hashtags e Resumo do Vídeo)"
            >
              {copiedSeo ? <Check className="h-3.5 w-3.5 text-amber-400" /> : <Hash className="h-3.5 w-3.5 text-amber-400" />}
              <span>{copiedSeo ? 'SEO Copiado!' : 'Copiar Bloco SEO'}</span>
            </button>

            <button
              id="btn-download-txt"
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-[#16271e] hover:bg-emerald-900/40 px-3 py-2 text-xs font-medium text-emerald-200 transition-colors"
              title="Baixar arquivo TXT pronto"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Baixar .TXT</span>
            </button>

            <button
              id="btn-download-json"
              onClick={handleDownloadJson}
              className="flex items-center gap-1 rounded-lg border border-emerald-900/60 bg-[#16271e] hover:bg-emerald-900/40 px-2.5 py-2 text-xs font-medium text-emerald-300/80 transition-colors"
              title="Exportar dados brutos em JSON"
            >
              <Code className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>

            <button
              id="btn-clear-prompts"
              onClick={onClearPrompts}
              className="flex items-center gap-1.5 rounded-lg border border-red-900/60 bg-red-950/30 hover:bg-red-900/40 px-3 py-2 text-xs font-semibold text-red-300 hover:text-red-200 transition-colors shadow-sm"
              title="Limpar todos os prompts anteriores e começar de novo"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              <span>Limpar Prompts</span>
            </button>
          </div>
        </div>

        {/* Script Metadata Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-emerald-900/40 pt-3 text-[11px]">
          <span className="rounded bg-[#17271e] px-2 py-0.5 text-emerald-300 font-medium">
            <strong className="text-emerald-200">Objeto:</strong> {script.focalObject.slice(0, 55)}...
          </span>
          <span className="rounded bg-[#17271e] px-2 py-0.5 text-amber-300/90 font-medium">
            <strong className="text-amber-200">Problema:</strong> {script.targetProblem.slice(0, 45)}...
          </span>
          {script.solutionIngredients && (
            <span className="rounded bg-[#17271e] px-2 py-0.5 text-emerald-300 font-medium border border-emerald-800/60">
              <strong className="text-emerald-200">{script.prompts.length >= 7 ? '🌿 Ingredientes (Prompt 3):' : '🌿 Ingredientes (Prompt 2):'}</strong> {script.solutionIngredients}
            </span>
          )}
          <span className="rounded bg-[#17271e] px-2 py-0.5 text-emerald-300 font-medium">
            <strong className="text-emerald-200">Fórmula:</strong> {script.prompts.length} Prompts × 8s = {script.prompts.length * 8}s (9:16, 4K)
          </span>

          {/* Custom Character Badge if used */}
          {script.characterUsed && (
            <span className="inline-flex items-center gap-1.5 rounded bg-teal-950/90 border border-teal-700/60 px-2 py-0.5 text-teal-200 font-medium">
              {script.characterImagePreview ? (
                <img 
                  src={script.characterImagePreview} 
                  alt="Avatar" 
                  className="h-4 w-4 rounded-full object-cover border border-teal-400"
                />
              ) : (
                <User className="h-3 w-3 text-teal-400" />
              )}
              <span><strong>Personagem:</strong> {script.characterUsed.slice(0, 40)}</span>
            </span>
          )}

          {/* Custom Setting Badge if used */}
          {script.settingUsed && (
            <span className="inline-flex items-center gap-1.5 rounded bg-teal-950/90 border border-teal-700/60 px-2 py-0.5 text-teal-200 font-medium">
              {script.settingImagePreview ? (
                <img 
                  src={script.settingImagePreview} 
                  alt="Cenário" 
                  className="h-4 w-4 rounded object-cover border border-teal-400"
                />
              ) : (
                <Building2 className="h-3 w-3 text-teal-400" />
              )}
              <span><strong>Cenário:</strong> {script.settingUsed.slice(0, 40)}</span>
            </span>
          )}

          {/* Custom Encapsulated Product Badge if used */}
          {script.productTitleUsed && (
            <span className="inline-flex items-center gap-1.5 rounded bg-lime-950/90 border border-lime-700/60 px-2 py-0.5 text-lime-200 font-medium">
              {script.productImagePreview ? (
                <img 
                  src={script.productImagePreview} 
                  alt="Produto Encapsulado" 
                  className="h-4 w-3 rounded object-cover border border-lime-400"
                />
              ) : (
                <Pill className="h-3 w-3 text-lime-400" />
              )}
              <span><strong>Encapsulado:</strong> {script.productTitleUsed.slice(0, 35)}</span>
            </span>
          )}

          {/* Custom Book Badge if used (legacy) */}
          {script.bookTitleUsed && !script.productTitleUsed && (
            <span className="inline-flex items-center gap-1.5 rounded bg-lime-950/90 border border-lime-700/60 px-2 py-0.5 text-lime-200 font-medium">
              {script.bookImagePreview ? (
                <img 
                  src={script.bookImagePreview} 
                  alt="Capa Livro" 
                  className="h-4 w-3 rounded object-cover border border-lime-400"
                />
              ) : (
                <BookOpen className="h-3 w-3 text-lime-400" />
              )}
              <span><strong>Livro:</strong> {script.bookTitleUsed.slice(0, 35)}</span>
            </span>
          )}
          {/* Reference Analysis Banner if reference was provided */}
          {script.referenceAnalysis && script.referenceAnalysis.hasReference && (
            <div className="w-full mt-2 rounded-lg border border-emerald-700/50 bg-[#0d1812] p-2.5 text-xs text-emerald-200">
              <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-1">
                {script.referenceAnalysis.referenceType === 'video' ? (
                  <Video className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                )}
                <span>
                  {script.referenceAnalysis.referenceType === 'video'
                    ? `Engenharia Viral Decodificada de Vídeo (${script.referenceAnalysis.videoFileName || 'Vídeo de Referência'})`
                    : 'Engenharia Visual da Referência Aplicada'}
                </span>
                {script.referenceAnalysis.referenceType === 'video' && script.referenceAnalysis.videoFileSizeMB && (
                  <span className="rounded bg-emerald-900/60 px-1.5 py-0.2 text-[10px] text-emerald-300">
                    {script.referenceAnalysis.videoFileSizeMB} MB
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-emerald-300/80 pt-1">
                <div>
                  <strong className="text-emerald-200">Gancho Decodificado:</strong> {script.referenceAnalysis.detectedHook}
                </div>
                <div>
                  <strong className="text-emerald-200">Objeto Focal:</strong> {script.referenceAnalysis.detectedObject}
                </div>
                <div>
                  <strong className="text-emerald-200">Ritmo Preservado:</strong> {script.referenceAnalysis.pacingPreserved}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* The 8 Prompts Cards in Strict Succession */}
      <div className="flex flex-col gap-4">
        {script.prompts.map((prompt, index) => {
          const isSelected = activePromptId === prompt.id;
          const isCopied = copiedId === prompt.id;

          return (
            <div key={prompt.id} className="relative">
              {/* Card Body */}
              <div
                id={`prompt-card-${prompt.id}`}
                onClick={() => onSelectPrompt(prompt.id)}
                className={`rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500/70 bg-[#122219] shadow-lg shadow-emerald-950/80 ring-1 ring-amber-500/40'
                    : 'border-emerald-900/40 bg-[#101b15]/90 hover:border-emerald-700/50 hover:bg-[#121f18]'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/30 px-4 py-3 bg-[#0d1611]/60 rounded-t-xl">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black font-mono shadow-inner ${
                      isSelected ? 'bg-amber-500 text-black' : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    }`}>
                      {prompt.id}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                          {prompt.stepName}
                        </h3>
                        {prompt.id === 1 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-950/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                            <Zap className="h-3 w-3 text-amber-400" />
                            <span>Gancho Chocante • Modelo Colossal & Ação Visceral</span>
                          </span>
                        )}
                        {prompt.id === 2 && script.prompts.length >= 7 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/50 bg-rose-950/60 px-2 py-0.5 text-[10px] font-extrabold text-rose-300">
                            <Layers className="h-3 w-3 text-rose-400" />
                            <span>Explicação do Problema (O Que É / Sintomas)</span>
                          </span>
                        )}
                        {((prompt.id === 3 && script.prompts.length >= 7) || (prompt.id === 2 && script.prompts.length < 7)) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                            <Sparkles className="h-3 w-3 text-emerald-400" />
                            <span>Ingredientes Caseiros da Cura (Falar & Mostrar)</span>
                          </span>
                        )}
                        {((prompt.id === 4 && script.prompts.length >= 7) || (prompt.id === 3 && script.prompts.length === 6)) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/50 bg-teal-950/60 px-2 py-0.5 text-[10px] font-extrabold text-teal-300">
                            <Droplets className="h-3 w-3 text-teal-400" />
                            <span>Preparo Parte 1: Base & Lip-Sync ao Vivo (Anti-Locutor)</span>
                          </span>
                        )}
                        {prompt.id === 3 && script.prompts.length < 6 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/50 bg-teal-950/60 px-2 py-0.5 text-[10px] font-extrabold text-teal-300">
                            <Droplets className="h-3 w-3 text-teal-400" />
                            <span>Fazer o Remédio Caseiro ao Vivo</span>
                          </span>
                        )}
                        {((prompt.id === 5 && script.prompts.length >= 7) || (prompt.id === 4 && script.prompts.length === 6)) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/50 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-extrabold text-cyan-300">
                            <Sparkles className="h-3 w-3 text-cyan-400" />
                            <span>Preparo Parte 2: Continuação na Panela com Bioativos</span>
                          </span>
                        )}
                        {prompt.id === 4 && script.prompts.length < 6 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/50 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-extrabold text-cyan-300">
                            <Layers className="h-3 w-3 text-cyan-400" />
                            <span>Uso, Degustação & Relato de Cura</span>
                          </span>
                        )}
                        {prompt.id === 6 && script.prompts.length >= 8 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-950/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                            <Layers className="h-3 w-3 text-amber-400" />
                            <span>Quantidade de Ingredientes & Tempo de Preparo</span>
                          </span>
                        )}
                        {((prompt.id === 7 && script.prompts.length >= 8) || (prompt.id === 6 && script.prompts.length === 7) || (prompt.id === 5 && script.prompts.length === 6)) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/50 bg-sky-950/60 px-2 py-0.5 text-[10px] font-extrabold text-sky-300">
                            <Layers className="h-3 w-3 text-sky-400" />
                            <span>Uso, Degustação & Relato</span>
                          </span>
                        )}
                        {prompt.id === 8 && script.prompts.length === 9 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-lime-500/50 bg-lime-950/60 px-2 py-0.5 text-[10px] font-extrabold text-lime-300">
                            <Pill className="h-3 w-3 text-lime-400" />
                            <span>CTA 1: {script.productTitleUsed ? `Encapsulado ${script.productTitleUsed}` : 'Apresentação do Encapsulado'}</span>
                          </span>
                        )}
                        {prompt.id === 9 && script.prompts.length === 9 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-950/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                            <Zap className="h-3 w-3 text-amber-400" />
                            <span>CTA 2: Chamada Final, Escassez & "EU QUERO"</span>
                          </span>
                        )}
                        {((prompt.id === 8 && script.prompts.length === 8) || (prompt.id === 7 && script.prompts.length === 7) || (prompt.id === 6 && script.prompts.length === 6) || (prompt.id === 5 && script.prompts.length < 6)) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-lime-500/50 bg-lime-950/60 px-2 py-0.5 text-[10px] font-extrabold text-lime-300">
                            <BookOpen className="h-3 w-3 text-lime-400" />
                            <span>Livro "{script.bookTitleUsed || 'Farmácia da Longevidade'}"</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-700/60 bg-red-950/70 px-2 py-0.5 text-[10px] font-bold text-red-200" title="Diretriz ativa: zero legendas, zero closed captions e zero textos na tela">
                          <Ban className="h-2.5 w-2.5 text-red-400" />
                          <span>Sem legendas nem textos</span>
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400/80">
                        {prompt.timeRange} (8 segundos)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      id={`btn-copy-prompt-${prompt.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyIndividual(prompt, 'complete');
                      }}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-95 ${
                        isCopied && copiedType === 'complete'
                          ? 'border-emerald-400 bg-emerald-500 text-black shadow-emerald-900/50'
                          : 'border-emerald-500/70 bg-emerald-600/30 text-emerald-100 hover:bg-emerald-600/50 hover:border-emerald-400'
                      }`}
                      title="Copiar prompt completo com todas as descrições, movimentações em cena, objeto principal, fala e prompt técnico para IA"
                    >
                      {isCopied && copiedType === 'complete' ? <Check className="h-3.5 w-3.5 text-black" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{isCopied && copiedType === 'complete' ? 'Copiado (+ Movimentações)!' : 'Copiar Prompt Completo (+ Movimentações)'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-3.5">
                  {/* Spoken Brazilian Portuguese Line */}
                  <div className="rounded-lg border border-amber-500/20 bg-[#172018]/80 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                        Fala do Apresentador (Português Brasileiro • ~8s)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyIndividual(prompt, 'speechOnly');
                        }}
                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border transition-all ${
                          isCopied && copiedType === 'speechOnly'
                            ? 'border-amber-400 bg-amber-500 text-black font-bold'
                            : 'border-amber-500/40 bg-amber-950/40 text-amber-200 hover:bg-amber-900/50 hover:border-amber-400'
                        }`}
                        title="Copiar apenas a fala em português para dublagem, gravação ou ElevenLabs"
                      >
                        {isCopied && copiedType === 'speechOnly' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{isCopied && copiedType === 'speechOnly' ? 'Fala Copiada!' : 'Copiar só Fala'}</span>
                      </button>
                    </div>
                    <p className="text-sm font-medium text-white italic pl-2 border-l-2 border-amber-400">
                      "{prompt.spokenLinePt}"
                    </p>
                  </div>

                  {/* Physical Continuity & Action Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-[#0e1712] p-2.5 border border-emerald-900/30">
                      <span className="font-bold text-emerald-400 block mb-0.5">
                        Objeto Principal em Primeiro Plano:
                      </span>
                      <p className="text-emerald-200/80 text-[11px]">
                        {prompt.focalObject}
                      </p>
                    </div>

                    <div className="rounded-lg bg-[#0e1712] p-2.5 border border-emerald-900/30">
                      <span className="font-bold text-emerald-400 block mb-0.5">
                        Continuidade Física & Ação:
                      </span>
                      <p className="text-emerald-200/80 text-[11px]">
                        {prompt.actionSummary}
                      </p>
                    </div>
                  </div>

                  {/* Custom Encapsulated Product visual card if image is present */}
                  {((prompt.id === 8 || prompt.id === 9) && script.productImagePreview) && (
                    <div className="flex items-center gap-3 rounded-lg border border-lime-800/60 bg-[#0d1a12] p-2.5">
                      <img 
                        src={script.productImagePreview} 
                        alt="Produto Encapsulado" 
                        className="h-14 w-10 rounded object-cover border border-lime-500/70 shadow-md shrink-0" 
                      />
                      <div className="text-xs">
                        <span className="font-bold text-lime-300 block">
                          Frasco de Encapsulado Configurado para o Prompt {prompt.id} (CTA de Venda)
                        </span>
                        <p className="text-[11px] text-lime-200/80">
                          Fórmula: <strong>{script.productTitleUsed || 'Fórmula Concentrada em Cápsulas'}</strong>. O prompt instrui a exibir o frasco âmbar premium e as cápsulas nas mãos do apresentador.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Custom book visual card if image is present (legacy) */}
                  {((prompt.id === 8 || (prompt.id === script.prompts.length && prompt.id >= 6)) && !script.productImagePreview && script.bookImagePreview) && (
                    <div className="flex items-center gap-3 rounded-lg border border-lime-800/60 bg-[#0d1a12] p-2.5">
                      <img 
                        src={script.bookImagePreview} 
                        alt="Capa do Livro em Destaque" 
                        className="h-14 w-10 rounded object-cover border border-lime-500/70 shadow-md shrink-0" 
                      />
                      <div className="text-xs">
                        <span className="font-bold text-lime-300 block">
                          Capa do Livro Configurada para o Prompt {prompt.id} (CTA Final)
                        </span>
                        <p className="text-[11px] text-lime-200/80">
                          Título impresso: <strong>{script.bookTitleUsed || 'Livro Personalizado'}</strong>. Descrição do prompt orienta a reproduzir esta capa exata nas mãos do apresentador.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Full Prompt Text in English (AI Video Generator Ready) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                          Prompt Completo Autossuficiente (Inglês Técnico para IA):
                        </span>
                        <span className="text-[10px] text-emerald-500 font-mono">
                          {prompt.promptText.length} caracteres
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyIndividual(prompt, 'promptOnly');
                        }}
                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border transition-all ${
                          isCopied && copiedType === 'promptOnly'
                            ? 'border-emerald-400 bg-emerald-500 text-black font-bold'
                            : 'border-emerald-800/60 bg-[#16271e] text-emerald-300 hover:bg-emerald-900/40'
                        }`}
                        title="Copiar apenas o prompt descritivo em inglês para a IA de vídeo"
                      >
                        {isCopied && copiedType === 'promptOnly' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{isCopied && copiedType === 'promptOnly' ? 'Prompt Copiado!' : 'Copiar só Prompt IA'}</span>
                      </button>
                    </div>

                    <div className="relative rounded-lg border border-emerald-950 bg-[#0a110d] p-3 text-xs font-mono text-emerald-200/90 leading-relaxed overflow-x-auto select-all max-h-56 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-mono text-[11px]">
                        {prompt.promptText}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Continuity Arrow between prompts */}
              {index < script.prompts.length - 1 && (
                <div className="flex justify-center my-1">
                  <div className="flex items-center gap-1 rounded-full bg-[#0d1611] px-3 py-1 border border-emerald-900/40 text-[10px] text-emerald-400/70 font-mono">
                    <ArrowDown className="h-3 w-3 animate-bounce" />
                    <span>Continuidade Física Instantânea ({index + 1} → {index + 2})</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BLOCO DE SEO (Sem marcações, com Título, Descrição, 5 Hashtags e Resumo do Vídeo) */}
      <div id="seo-block-section" className="rounded-xl border border-amber-900/50 bg-[#141b14] p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/40 pb-2.5">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
              Bloco de SEO (Título, Descrição, 5 Hashtags e Resumo)
            </h3>
          </div>
          <button
            type="button"
            id="btn-copy-seo-bottom"
            onClick={handleCopySeoBlock}
            className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-amber-500/70 bg-amber-600/30 hover:bg-amber-600/50 px-3 py-1.5 text-xs font-bold text-amber-100 transition-all active:scale-95 shadow-sm"
            title="Copiar texto puro de SEO pronto para postagem"
          >
            {copiedSeo ? <Check className="h-3.5 w-3.5 text-amber-300" /> : <Copy className="h-3.5 w-3.5 text-amber-300" />}
            <span>{copiedSeo ? 'SEO Copiado!' : 'Copiar Bloco SEO'}</span>
          </button>
        </div>

        <div className="relative rounded-lg border border-amber-950/80 bg-[#0c120d] p-3.5 text-xs font-sans text-amber-100 leading-relaxed overflow-x-auto select-all">
          <pre className="whitespace-pre-wrap font-sans text-xs text-amber-100/90 leading-relaxed selection:bg-amber-500/40">
            {getSeoBlockText()}
          </pre>
        </div>
      </div>
    </div>
  );
};
