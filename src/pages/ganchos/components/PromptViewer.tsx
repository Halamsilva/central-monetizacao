import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  FileText,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { estimateDialogueTiming } from '../utils/promptParser';

interface PromptViewerProps {
  promptText: string;
  onCopyPrompt: () => void;
  hasCopied: boolean;
  skinRealismActive: boolean;
  onToggleSkinRealism: () => void;
}

export const PromptViewer: React.FC<PromptViewerProps> = ({
  promptText,
  onCopyPrompt,
  hasCopied,
  skinRealismActive,
  onToggleSkinRealism,
}) => {
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copySectionFeedback, setCopySectionFeedback] = useState<string | null>(null);

  // Extract dialogue text to simulate 8-second speech
  const dialogueMatch = promptText.match(/fala no idioma e estilo de [^\n:]+:\s*“?([^”"]+)”?/i) || promptText.match(/“([^”"]{10,})”/);
  const speechText = dialogueMatch ? dialogueMatch[1].trim() : '';
  const timing = estimateDialogueTiming(speechText);

  const handleCopySection = (content: string, sectionKey: string) => {
    navigator.clipboard.writeText(content);
    setCopySectionFeedback(sectionKey);
    setTimeout(() => setCopySectionFeedback(null), 2000);
  };

  const handlePlaySpeech = () => {
    if (!speechText) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.15; // slightly faster for high-tension anger/drama pace
    utterance.pitch = 1.05;

    // Pick pt-BR voice if available
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownload = () => {
    const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PROMPT_CENA_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Action Bar with BIG COPY BUTTON */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              PROMPT PRONTO PARA USO
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                100% Texto
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Estrutura técnica preservada • Copie com um clique
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Switch raw / structured */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-800 border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('structured')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'structured'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Blocos
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'raw'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Texto Puro
            </button>
          </div>

          {/* Download txt */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Baixar como arquivo .txt"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* THE MASTER 1-CLICK COPY BUTTON */}
          <button
            onClick={onCopyPrompt}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-lg ${
              hasCopied
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-emerald-400'
                : 'bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white shadow-rose-950/60'
            }`}
          >
            {hasCopied ? (
              <>
                <Check className="w-4 h-4 text-white animate-bounce" />
                <span>COPIADO COM SUCESSO!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>COPIAR PROMPT PRONTO</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Speech and Timing Gauge Banner */}
      {speechText && (
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Duração Estimada da Fala:</span>
              <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                ~{timing.durationSeconds}s
              </span>
              <span className="text-slate-400">({timing.wordCount} palavras)</span>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                timing.isOptimal
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {timing.statusText}
            </span>
          </div>

          {/* Audio speech test */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlaySpeech}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                isPlayingAudio
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>Parar Áudio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ouvir Ritmo da Fala (pt-BR)</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleCopySection(`“${speechText}”`, 'speech')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
              title="Copiar apenas a fala para roteiro ou dublagem"
            >
              {copySectionFeedback === 'speech' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copiada</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar Só a Fala</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto font-mono text-sm leading-relaxed">
        {viewMode === 'raw' ? (
          <div className="relative">
            <textarea
              readOnly
              value={promptText}
              className="w-full h-[520px] bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 font-mono text-xs sm:text-sm focus:outline-none resize-none leading-relaxed select-all"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Badge */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                  Cabeçalho Obrigatório
                </span>
                <p className="text-sm font-bold text-white mt-0.5">
                  {promptText.split('\n')[0] || 'PROMPT GANCHO CHAMATIVO CENA 01'}
                </p>
              </div>
              <button
                onClick={() => handleCopySection(promptText.split('\n')[0], 'header')}
                className="text-xs text-slate-400 hover:text-white p-1"
                title="Copiar cabeçalho"
              >
                {copySectionFeedback === 'header' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Formatted Blocks */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 whitespace-pre-wrap text-slate-200">
              {/* Parse sections and render with color highlights */}
              {renderFormattedPrompt(promptText, skinRealismActive)}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Quick Rules */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Estrutura 100% em conformidade com o formato obrigatório</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            Regra: primeiros 4s agressivos • retenção ~8s • sem imagens
          </span>
        </div>
      </div>
    </div>
  );
};

function renderFormattedPrompt(text: string, skinRealismActive: boolean) {
  // Split lines and color-code sections
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Check if header line
        if (trimmed.startsWith('PROMPT GANCHO CHAMATIVO')) {
          return (
            <div key={idx} className="text-amber-400 font-bold text-base border-b border-amber-500/20 pb-2 mb-3">
              {line}
            </div>
          );
        }

        // Section titles
        if (
          trimmed === 'CENA:' ||
          trimmed === 'PERSONAGENS:' ||
          trimmed === 'POSTURA:' ||
          trimmed === 'PERFIL PSICOLÓGICO:' ||
          trimmed.startsWith('Motivação:') ||
          trimmed.startsWith('Medo:') ||
          trimmed.includes('fala no idioma e estilo de')
        ) {
          const isDialogueLabel = trimmed.includes('fala no idioma e estilo de');
          return (
            <div
              key={idx}
              className={`font-bold mt-4 pt-2 border-t border-slate-800/80 ${
                isDialogueLabel
                  ? 'text-rose-400 text-sm tracking-wide flex items-center gap-1.5'
                  : 'text-indigo-400 text-xs tracking-wider uppercase'
              }`}
            >
              {line}
            </div>
          );
        }

        // The dialogue line with quotes
        if (trimmed.startsWith('“') || (trimmed.endsWith('”') && trimmed.length > 15)) {
          return (
            <div
              key={idx}
              className="p-3.5 my-2 rounded-lg bg-rose-950/30 border-l-4 border-rose-500 text-rose-200 text-sm font-semibold italic shadow-sm"
            >
              {line}
            </div>
          );
        }

        // Skin realism highlight
        if (
          trimmed.toLowerCase().includes('textura de pele') ||
          trimmed.toLowerCase().includes('poros visíveis') ||
          trimmed.toLowerCase().includes('micro-relevo dérmico')
        ) {
          return (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed"
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-400 uppercase text-[10px] mb-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Comando Extra Ativo • Textura de Pele Humana Real 8K</span>
              </div>
              {line}
            </div>
          );
        }

        // Normal text line
        return (
          <div key={idx} className="text-slate-300 text-xs sm:text-sm">
            {line || <span className="block h-2" />}
          </div>
        );
      })}
    </div>
  );
}
