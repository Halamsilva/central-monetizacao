import React, { useState } from 'react';
import { Film, Copy, Check, Download, Video, Camera, Sparkles, Globe, Clock, VolumeX } from 'lucide-react';
import { VideoPromptBlock } from '../types';

interface VideoPromptsSectionProps {
  prompts?: VideoPromptBlock[];
  newsTitle: string;
}

export const VideoPromptsSection: React.FC<VideoPromptsSectionProps> = ({
  prompts,
  newsTitle,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [preferredLang, setPreferredLang] = useState<'en' | 'pt'>('en');

  if (!prompts || prompts.length === 0) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = (lang: 'en' | 'pt') => {
    const formatted = prompts
      .map(
        (p) =>
          `[BLOCO ${p.blockNumber} • ${p.timecode} • 10s SEM FALAS]\n` +
          `Fase: ${p.phaseTitle}\n` +
          `Câmera: ${p.cameraMovement}\n` +
          `Prompt (${lang.toUpperCase()}): ${lang === 'en' ? p.visualPromptEn : p.visualPromptPt}\n`
      )
      .join('\n---\n\n');

    navigator.clipboard.writeText(
      `PROMPTS DE VÍDEO (8 BLOCOS DE 10 SEGUNDOS SEM FALAS)\nNotícia: ${newsTitle}\n\n${formatted}`
    );
    setCopiedId(`all-${lang}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadTxt = () => {
    const content = prompts
      .map(
        (p) =>
          `========================================\n` +
          `BLOCO ${p.blockNumber}: ${p.phaseTitle.toUpperCase()}\n` +
          `TIMECODE: ${p.timecode} (10 SEGUNDOS • SEM FALAS)\n` +
          `MOVIMENTO DE CÂMERA: ${p.cameraMovement}\n` +
          `CENA: ${p.sceneDescription}\n\n` +
          `PROMPT PARA IA (INGLÊS - RUNWAY / KLING / SORA / VEO):\n${p.visualPromptEn}\n\n` +
          `PROMPT EM PORTUGUÊS:\n${p.visualPromptPt}\n`
      )
      .join('\n\n');

    const fullFile = `ROTEIRO VISUAL DE VÍDEO (8 BLOCOS • 10 SEGUNDOS CADA • SEM FALAS)\nNOTÍCIA: ${newsTitle}\nTOTAL DE VÍDEO: 80 SEGUNDOS (B-ROLL CINEMATOGRÁFICO)\n\n${content}`;
    const blob = new Blob([fullFile], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-video-8-blocos-${newsTitle.slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
  };

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                8 Prompts de Vídeo para IA
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  8 Blocos • 10s Sem Falas
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ilustrações cronológicas em B-roll de 10 segundos sem diálogo, prontas para Runway Gen-3, Kling, Sora, Luma e Veo
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lang Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setPreferredLang('en')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                preferredLang === 'en'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inglês (Melhor p/ IAs)
            </button>
            <button
              onClick={() => setPreferredLang('pt')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                preferredLang === 'pt'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Português
            </button>
          </div>

          {/* Copy all */}
          <button
            onClick={() => handleCopyAll(preferredLang)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            {copiedId === `all-${preferredLang}` ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiados!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Todos ({preferredLang.toUpperCase()})</span>
              </>
            )}
          </button>

          {/* Download TXT */}
          <button
            onClick={handleDownloadTxt}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Baixar lista completa de prompts em .txt"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of 8 Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {prompts.map((block) => (
          <div
            key={block.blockNumber}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 group"
          >
            {/* Block Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    BLOCO {block.blockNumber}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {block.timecode}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                    <VolumeX className="w-3 h-3" />
                    10s Sem Falas
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      preferredLang === 'en'
                        ? block.visualPromptEn
                        : block.visualPromptPt,
                      `block-${block.blockNumber}`
                    )
                  }
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Copiar este prompt de vídeo"
                >
                  {copiedId === `block-${block.blockNumber}` ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[11px]">Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Phase Title */}
              <h4 className="text-xs font-bold text-slate-100 leading-snug mb-1">
                {block.phaseTitle}
              </h4>

              {/* Camera Movement */}
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-mono mb-2">
                <Camera className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>{block.cameraMovement}</span>
              </div>

              {/* Scene Explanation */}
              <p className="text-[11px] text-slate-400 leading-relaxed italic mb-2.5">
                "{block.sceneDescription}"
              </p>
            </div>

            {/* Prompt Box */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 font-mono text-[11px] text-slate-200 leading-relaxed select-text">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">
                {preferredLang === 'en'
                  ? 'PROMPT DE VÍDEO IA (INGLÊS):'
                  : 'PROMPT DE VÍDEO IA (PORTUGUÊS):'}
              </span>
              <p className="text-purple-200">
                {preferredLang === 'en'
                  ? block.visualPromptEn
                  : block.visualPromptPt}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tip Banner */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>
            <strong>Dica de Produção:</strong> Use cada bloco de 10 segundos no seu editor de vídeo (CapCut, Premiere, DaVinci) alinhado com a narração de áudio para criar um vídeo dinâmico de 80 segundos com retenção máxima.
          </span>
        </span>
      </div>
    </div>
  );
};
