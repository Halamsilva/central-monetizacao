import React, { useState } from 'react';
import { GeneratedCampaign } from '../types';
import {
  Download,
  Copy,
  Check,
  X,
  FileText,
  Film,
  Layers,
  Sparkles,
  Printer,
  ChefHat,
  Clock,
} from 'lucide-react';

interface ExportModalProps {
  campaign: GeneratedCampaign;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ campaign, isOpen, onClose }) => {
  const [exportType, setExportType] = useState<'klingPrompts' | 'vslScript' | 'recipeGuide' | 'json'>('klingPrompts');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Format 1: Kling/Sora/Runway 4K Prompts Only (batch ready)
  const formatKlingPrompts = () => {
    return campaign.prompts
      .map((p) => {
        return `=== CENA ${p.step}: ${p.title} (${p.duration}) ===\n[4K VIDEO PROMPT - KLING / SORA / RUNWAY]:\n${p.videoPromptEnglish}\n\n[PARÂMETROS DE RENDER]:\n${p.engineParameters}\n\n[FALA DA ESPECIALISTA (9s)]: "${p.spokenScript}"\n`;
      })
      .join('\n----------------------------------------\n\n');
  };

  // Format 2: Full VSL Video Production Sheet
  const formatVSLScript = () => {
    let doc = `# ROTEIRO DE PRODUÇÃO VSL 4K • LIMPEZA & DONAS DE CASA: ${campaign.campaignOverview.productName.toUpperCase()}\n`;
    doc += `Nicho / Dor da Faxina: ${campaign.campaignOverview.niche}\n`;
    doc += `Duração Total: ${campaign.prompts.length * 9} Segundos (${campaign.prompts.length} Cenas de 9s)\n`;
    doc += `Consistência da Especialista: ${campaign.campaignOverview.consistentCharacter}\n`;
    doc += `Cenário Acolhedor Fixo: ${campaign.campaignOverview.consistentSetting}\n`;
    doc += `Produto de Limpeza: ${campaign.campaignOverview.bottleAppearance}\n`;
    doc += `\n============================================================\n\n`;

    campaign.prompts.forEach((p) => {
      doc += `### CENA ${p.step} • ${p.title.toUpperCase()}\n`;
      doc += `⏱️ Duração: ${p.duration} (~${p.wordCount} palavras)\n`;
      doc += `🎯 Objetivo: ${p.goal}\n\n`;
      doc += `🎙️ FALA EXATA DA ESPECIALISTA:\n"${p.spokenScript}"\n\n`;
      doc += `🔊 Direção de Voz: ${p.voiceDirection}\n`;
      doc += `👤 Realismo Humano: ${p.facialExpressionsAndHumanRealism}\n`;
      doc += `🖐️ Movimento das Mãos: ${p.handMovements}\n`;
      doc += `🎥 Câmera & Luz 4K: ${p.cameraAndLighting}\n\n`;
      doc += `🎬 PROMPT DE VÍDEO IA (ENGLISH 4K):\n${p.videoPromptEnglish}\n\n`;
      doc += `⚙️ Parâmetros: ${p.engineParameters}\n\n`;
      doc += `------------------------------------------------------------\n\n`;
    });

    return doc;
  };

  // Format 3: Step-by-Step Recipe Guide with Timings
  const formatRecipeGuide = () => {
    const r = campaign.campaignOverview.recipeStepByStep;
    let doc = `# GUIA COMPLETO DA MISTURINHA CASEIRA PASSO A PASSO\n`;
    doc += `PRODUTO: ${campaign.campaignOverview.productName}\n`;
    doc += `NICHO: ${campaign.campaignOverview.niche}\n`;
    if (r) {
      doc += `TEMPO DE AÇÃO: ${r.totalReadyTime}\n`;
      doc += `DIFICULDADE: ${r.difficulty}\n`;
      doc += `RENDIMENTO: ${r.servings}\n\n`;

      doc += `## INGREDIENTES CASEIROS DA DESPENSA (MEDIDAS DE COZINHA):\n`;
      r.ingredientsWithMeasurements.forEach((ing, i) => {
        doc += `${i + 1}. ${ing}\n`;
      });

      doc += `\n## MODO DE FAZER PASSO A PASSO:\n`;
      r.steps.forEach((s) => {
        doc += `\n[PASSO ${s.stepNumber}]: ${s.title} (${s.timeEstimate})\n`;
        doc += `Instrução: ${s.instruction}\n`;
        doc += `Ingrediente chave: ${s.keyIngredient}\n`;
      });

      doc += `\n## COMO APLICAR E LIMPAR:\n${r.howToConsume}\n`;
      doc += `\n## SEGURANÇA DOMÉSTICA:\n${r.safetyNotice}\n`;
      doc += `\n## RESPALDO QUÍMICO:\n${r.scientificBacking}\n`;
    } else {
      doc += `Ingredientes Caseiros: ${campaign.campaignOverview.ingredientsList.join(', ')}\n`;
      doc += `Tempo de ação: 5 minutos sem esfregar\n`;
      doc += `Respaldo técnico: ${campaign.campaignOverview.scientificBacking || 'Princípios de tensoativos e saponificação'}\n`;
    }

    return doc;
  };

  // Format 4: Clean JSON
  const formatJSON = () => {
    return JSON.stringify(campaign, null, 2);
  };

  const getExportContent = () => {
    switch (exportType) {
      case 'klingPrompts':
        return formatKlingPrompts();
      case 'vslScript':
        return formatVSLScript();
      case 'recipeGuide':
        return formatRecipeGuide();
      case 'json':
        return formatJSON();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getExportContent());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    const content = getExportContent();
    const extension = exportType === 'json' ? 'json' : 'txt';
    const filename = `${campaign.campaignOverview.productName.toLowerCase().replace(/\s+/g, '-')}-${exportType}.${extension}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Exportar Pacote de Produção • Limpeza & Donas de Casa 4K
              </h3>
              <p className="text-xs text-slate-400">
                Copie em 1 clique ou faça download do material pronto para Kling, Sora, Runway ou VSL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Type Selector */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap gap-2">
          <button
            onClick={() => setExportType('klingPrompts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              exportType === 'klingPrompts'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Prompts de Vídeo 4K (Lote)
          </button>

          <button
            onClick={() => setExportType('vslScript')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              exportType === 'vslScript'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Roteiro de Produção VSL Completo
          </button>

          <button
            onClick={() => setExportType('recipeGuide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              exportType === 'recipeGuide'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Guia da Misturinha Passo a Passo
          </button>

          <button
            onClick={() => setExportType('json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              exportType === 'json'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            JSON Bruto da Campanha
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950">
          <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 max-h-[50vh] overflow-y-auto leading-relaxed">
            {getExportContent()}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {campaign.prompts.length} Cenas • {campaign.prompts.length * 9}s VSL • Pronto para produção
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copiado para Área de Transferência!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Conteúdo</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo (TXT)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
