import React, { useState } from 'react';
import { ReflectionScript } from '../types';
import { X, Copy, Check, Download, FileText, Code, CheckCheck } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: ReflectionScript;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, script }) => {
  const [tab, setTab] = useState<'prompts' | 'speech' | 'json'>('prompts');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isFemale = script.speakerGender === 'female';
  const characterTitle = script.customAvatarUrl
    ? `AVATAR PERSONALIZADO (${isFemale ? 'Voz feminina' : 'Voz masculina'})`
    : isFemale
    ? 'A VELHA DA ROÇA (Mulher, 80 anos)'
    : 'O VELHO DA ROÇA (Homem, 80 anos)';

  const getAllPromptsText = (): string => {
    let result = `# REFLEXÃO - ${characterTitle}\nTEMA: ${script.title}\nPERSONAGEM: ${characterTitle}\nCENÁRIO: ${script.environment}\nTOTAL DE CENAS: ${script.prompts.length} (~${script.prompts.length * 9} segundos)\n`;
    if (script.customAvatarDescription) {
      result += `AVATAR PERSONALIZADO: ${script.customAvatarDescription}\n`;
    }
    if (script.customEnvironmentDescription) {
      result += `CENÁRIO PERSONALIZADO: ${script.customEnvironmentDescription}\n`;
    }
    result += `\n---\n\n`;
    script.prompts.forEach((p) => {
      result += `## ${p.stageName.toUpperCase()}\n\n`;
      result += `${p.fullFormattedPrompt || `${p.visualPrompt}\n\nSpoken dialogue in Brazilian Portuguese:\n"${p.spokenDialogue}"\n\nNo speech other than the exact dialogue provided.\nNo subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`}\n\n---\n\n`;
    });
    return result;
  };

  const getSpeechOnlyText = (): string => {
    let result = `ROTEIRO DE VOZ - ${characterTitle}\nTema: ${script.title}\nNarrador(a): ${characterTitle}\n\n`;
    script.prompts.forEach((p, idx) => {
      result += `[CENA ${idx + 1} - ~9s]\n"${p.spokenDialogue}"\n\n`;
    });
    return result;
  };

  const getJsonText = (): string => {
    return JSON.stringify(script, null, 2);
  };

  const getActiveContent = (): string => {
    if (tab === 'prompts') return getAllPromptsText();
    if (tab === 'speech') return getSpeechOnlyText();
    return getJsonText();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getActiveContent());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const content = getActiveContent();
    const prefix = isFemale ? 'velha-da-roca' : 'velho-da-roca';
    const filename = `${prefix}-${script.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${tab === 'json' ? 'json' : 'txt'}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div 
        id="export-modal"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-[#1a130d] border border-[#3e2b1d] rounded-2xl p-6 text-[#faf3e8] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#302115]">
          <div>
            <h3 className="text-xl font-serif-roca font-bold text-[#faf3e8]">
              Exportar Roteiro {isFemale ? 'da Velha' : 'do Velho'} da Roça
            </h3>
            <p className="text-xs text-[#a89683]">
              {script.title} ({script.prompts.length} cenas de 9 segundos)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9f8d7b] hover:text-white hover:bg-[#2c1f15] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-3">
          <button
            onClick={() => setTab('prompts')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              tab === 'prompts'
                ? 'bg-[#c26a2c] text-white border-[#d97730]'
                : 'bg-[#22170f] text-[#baa999] border-[#382618] hover:bg-[#2c1e14]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Prompts Completos (Sora / Kling)</span>
          </button>

          <button
            onClick={() => setTab('speech')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              tab === 'speech'
                ? 'bg-[#c26a2c] text-white border-[#d97730]'
                : 'bg-[#22170f] text-[#baa999] border-[#382618] hover:bg-[#2c1e14]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Apenas Falas (ElevenLabs / Gravação)</span>
          </button>

          <button
            onClick={() => setTab('json')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              tab === 'json'
                ? 'bg-[#c26a2c] text-white border-[#d97730]'
                : 'bg-[#22170f] text-[#baa999] border-[#382618] hover:bg-[#2c1e14]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON Bruto</span>
          </button>
        </div>

        {/* Text Area Content */}
        <div className="flex-1 min-h-[300px] overflow-y-auto p-4 rounded-xl bg-[#120d09] border border-[#2d1d12] font-mono text-xs text-[#cfbfb0] whitespace-pre-wrap select-all">
          {getActiveContent()}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-2 border-t border-[#302115] flex items-center justify-between gap-3">
          <span className="text-xs text-[#8c7b6c]">
            Formato compatível com geradores de vídeo de IA
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2b1e14] hover:bg-[#38281a] text-[#f0ae71] border border-[#483321] text-xs font-semibold transition-colors"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-4 h-4 text-[#79a665]" />
                  <span className="text-[#79a665]">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Tudo</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#c26a2c] hover:bg-[#d67634] text-white text-xs font-semibold transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
