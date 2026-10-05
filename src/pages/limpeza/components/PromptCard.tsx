import React, { useState } from 'react';
import { PromptItem } from '../types';
import {
  Copy,
  Check,
  Sparkles,
  Video,
  Clock,
  Mic,
  Smile,
  ShieldCheck,
  ChevronRight,
  Flame,
  Volume2,
  RefreshCw,
  Wand2,
  AlertCircle,
  HelpCircle,
  ChefHat,
  Droplets,
  Info,
} from 'lucide-react';

interface PromptCardProps {
  prompt: PromptItem;
  onRefinePrompt: (step: number, instruction: string) => void;
  isRefining: boolean;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onRefinePrompt, isRefining }) => {
  const [activeTab, setActiveTab] = useState<'complete' | 'english' | 'portuguese' | 'humanRealism' | 'recipeStep'>('complete');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Badge stylings based on step function for cleaning niche
  const getBadgeStyle = (title: string, step: number) => {
    const combined = `${title} ${step}`.toUpperCase();

    if (combined.includes('GANCHO') || combined.includes('MAQUETE') || step === 1) {
      return {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-500 animate-pulse',
        label: 'GANCHO 1,20M • SUJEIRA ENCRUSTADA & ESPANTO',
      };
    }
    if (combined.includes('INGREDIENTE') || combined.includes('NOMES')) {
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
        label: 'INGREDIENTES DA DESPENSA • CITADOS NOMINALMENTE',
      };
    }
    if (combined.includes('PREPARO') || combined.includes('PREPARAR')) {
      return {
        bg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
        dot: 'bg-teal-400',
        label: 'PASSO A PASSO NA BANCADA • AÇÃO EM 5 MINUTOS',
      };
    }
    if (combined.includes('SERVE') || combined.includes('USAR') || step === 4) {
      return {
        bg: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400 animate-pulse',
        label: '💡 PROMPT 4: PRA QUE SERVE & COMO APLICAR SEM ESFORÇO (9s)',
      };
    }
    if (combined.includes('QUANTIDADE') || combined.includes('TEMPO')) {
      return {
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400',
        label: 'QUANTIDADE EXATA & TEMPO (5 MINUTOS)',
      };
    }
    if (combined.includes('CTA') || combined.includes('EU QUERO') || combined.includes('FRASCO EM MÃOS') || combined.includes('CHAMADA')) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        label: 'CTA • COMENTE "EU QUERO" • PRODUTO DE LIMPEZA',
      };
    }
    if (combined.includes('BENEFÍCIO') || combined.includes('TRANSFORMAÇÃO') || combined.includes('BRILHO') || combined.includes('ESPELHADO')) {
      return {
        bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        dot: 'bg-sky-400',
        label: 'BENEFÍCIOS FINAIS • CASA LIMPA & BRILHO ESPELHADO',
      };
    }
    return {
      bg: 'bg-slate-800 text-slate-300 border-slate-700',
      dot: 'bg-slate-400',
      label: `CENA LIMPEZA #${step}`,
    };
  };

  const badge = getBadgeStyle(prompt.title, prompt.step);

  // Formatter for Complete Prompt + Speech Block
  const getCompletePromptWithSpeech = () => {
    return [
      `=== CENA ${prompt.step}: ${prompt.title} (00:00 - 00:09 • RIGOROSAMENTE 9s) ===`,
      '',
      `[PROMPT VISUAL CINEMATOGRÁFICO 4K (KLING / SORA / RUNWAY)]:`,
      prompt.videoPromptEnglish,
      '',
      `[FALA DA ESPECIALISTA (EXATAMENTE 9 SEGUNDOS • ~${prompt.wordCount || 22} PALAVRAS)]:`,
      `"${prompt.spokenScript}"`,
      '',
      `[TEMPO DE AÇÃO & ETAPA]: ${prompt.timeToReady || 'Age em 5 minutos sem esfregar'}`,
      `[DIREÇÃO VOCAL]: ${prompt.voiceDirection || 'Tom entusiasmado e cúmplice de dona de casa'}`,
      `[MICRO-EXPRESSÕES & REALISMO]: ${prompt.facialExpressionsAndHumanRealism}`,
      `[MOVIMENTOS DAS MÃOS]: ${prompt.handMovements}`,
      `[CÂMERA & LUZ]: ${prompt.cameraAndLighting}`,
      prompt.scientificBacking ? `[RESPALDO TÉCNICO]: ${prompt.scientificBacking}` : '',
      `[PARÂMETROS DE RENDER]: ${prompt.engineParameters || '--ar 9:16 --v 6.1 --style raw'}`,
    ].filter(Boolean).join('\n');
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Audio Playback with 9-second simulation
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não suporta síntese de voz.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setAudioProgress(0);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text from pauses like <pausa 0.5s> for smoother reading
    const cleanSpeech = prompt.spokenScript.replace(/<pausa[^>]*>/gi, '...');
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05; // calibrado para 9 segundos

    setIsPlayingAudio(true);
    setAudioProgress(0);

    const startTime = Date.now();
    const targetDurationMs = 9000; // 9 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / targetDurationMs) * 100));
      setAudioProgress(pct);

      if (elapsed >= targetDurationMs) {
        clearInterval(timer);
      }
    }, 100);

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setAudioProgress(100);
      clearInterval(timer);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      clearInterval(timer);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineText.trim()) return;
    onRefinePrompt(prompt.step, refineText);
    setRefineText('');
    setShowRefineInput(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-5 shadow-xl hover:border-slate-700/80 transition-all duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black font-mono text-sm shadow-md">
            #{prompt.step}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${badge.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
            {badge.label}
          </span>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            9s de fala (~{prompt.wordCount || 22} palavras)
          </span>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Audio Preview */}
          <button
            onClick={handleToggleSpeech}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isPlayingAudio
                ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Ouvir simulação de fala de 9 segundos"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isPlayingAudio ? 'Ouvindo 9s...' : 'Ouvir 9s'}</span>
          </button>

          {/* AI Refine button */}
          <button
            onClick={() => setShowRefineInput(!showRefineInput)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-teal-950/60 text-slate-300 hover:text-teal-300 border border-slate-700 hover:border-teal-500/50 text-xs font-medium transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Refinar Cena</span>
          </button>

          {/* Copy Full Card */}
          <button
            onClick={() => copyToClipboard(getCompletePromptWithSpeech(), `all-${prompt.step}`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95"
          >
            {copiedField === `all-${prompt.step}` ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Cena #{prompt.step} Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Cena Completa</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Goal & Step Objective */}
      <div className="mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Objetivo e Efeito de Alta Conversão do Prompt:
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {prompt.duration || '00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)'}
          </span>
        </div>
        <p className="text-xs text-slate-200 font-medium leading-relaxed">{prompt.goal}</p>
      </div>

      {/* Audio Progress Bar when playing */}
      {isPlayingAudio && (
        <div className="mb-4 bg-slate-950 p-2.5 rounded-xl border border-emerald-500/40">
          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 mb-1">
            <span>🔊 Reproduzindo fala a 150 palavras/min (Ritmo Direto)...</span>
            <span>{Math.round((audioProgress / 100) * 9)}s / 9.0s</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full transition-all duration-100"
              style={{ width: `${audioProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Special Banner for Prompt 4 Purpose & Usage */}
      {(prompt.step === 4 || prompt.title.toLowerCase().includes('serve') || prompt.title.toLowerCase().includes('usar')) && (
        <div className="mb-3.5 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                Regra de Ouro: Pra Que Serve & Como Usar na Prática
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                  9s Exatos
                </span>
              </span>
              <p className="text-[11px] text-amber-100/80 leading-tight">
                Fala brasileira real sem clichês: explica o que a misturinha dissolve na sujeira e o modo exato de aplicar e limpar em minutos.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-300 border border-amber-500/30 shrink-0 self-start sm:self-auto">
            {prompt.wordCount || 22} palavras • 9.0s
          </span>
        </div>
      )}

      {/* Spoken Script Box (Strictly 9 seconds) */}
      <div className="mb-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 rounded-xl border border-cyan-500/30 shadow-inner relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Mic className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Fala da Especialista (Somente 9 Segundos • {prompt.wordCount || 22} Palavras):
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(prompt.spokenScript, `speech-${prompt.step}`)}
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 transition-colors"
          >
            {copiedField === `speech-${prompt.step}` ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Fala Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar Fala</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm font-semibold text-white leading-relaxed italic bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          "{prompt.spokenScript}"
        </p>

        {prompt.voiceDirection && (
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <span className="text-cyan-400 font-bold">Direção Vocal:</span>
            <span>{prompt.voiceDirection}</span>
          </div>
        )}
      </div>

      {/* Prompt Display Mode Tabs */}
      <div className="flex items-center gap-2 mb-3 border-b border-slate-800 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('complete')}
          className={`pb-2 px-1 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
            activeTab === 'complete'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Prompt + Fala Completo</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
            Tudo em 1
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recipeStep')}
          className={`pb-2 px-1 text-xs font-semibold transition-all border-b-2 flex items-center gap-1 shrink-0 ${
            activeTab === 'recipeStep'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5 text-teal-400" />
          <span>Passo a Passo & Tempo</span>
        </button>

        <button
          onClick={() => setActiveTab('english')}
          className={`pb-2 px-1 text-xs font-semibold transition-all border-b-2 shrink-0 ${
            activeTab === 'english'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Prompt de Vídeo IA (Inglês 4K)
        </button>

        <button
          onClick={() => setActiveTab('portuguese')}
          className={`pb-2 px-1 text-xs font-semibold transition-all border-b-2 shrink-0 ${
            activeTab === 'portuguese'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Prompt Detalhado (Português)
        </button>

        <button
          onClick={() => setActiveTab('humanRealism')}
          className={`pb-2 px-1 text-xs font-semibold transition-all border-b-2 flex items-center gap-1 shrink-0 ${
            activeTab === 'humanRealism'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3 h-3 text-emerald-400" />
          Realismo Humano & Câmera
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[140px]">
        {activeTab === 'complete' && (
          <div className="relative bg-slate-950 p-4 rounded-xl border border-slate-800/90 font-mono text-xs text-slate-300 leading-relaxed shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  PROMPT COMPLETO COM FALA INCLUSA (CENA {prompt.step})
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  00:00 - 00:09
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(getCompletePromptWithSpeech(), `tab-complete-${prompt.step}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
              >
                {copiedField === `tab-complete-${prompt.step}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Prompt + Fala Copiados!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Este Bloco Completo</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3 font-sans">
              {/* Visual Prompt Section */}
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] font-mono font-bold text-emerald-400 block mb-1">
                  [PROMPT VISUAL CINEMATOGRÁFICO 4K]:
                </span>
                <p className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {prompt.videoPromptEnglish}
                </p>
              </div>

              {/* Speech Section */}
              <div className="bg-slate-900/90 p-3 rounded-lg border border-cyan-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono font-bold text-cyan-400">
                    [FALA DA ESPECIALISTA (EXATAMENTE 9 SEGUNDOS)]:
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {prompt.wordCount || 22} palavras (~9s)
                  </span>
                </div>
                <p className="text-sm font-medium text-white italic leading-relaxed">
                  "{prompt.spokenScript}"
                </p>
                {prompt.voiceDirection && (
                  <p className="text-[11px] text-cyan-300/80 mt-1 font-mono">
                    Direção: {prompt.voiceDirection}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Recipe Step & Time to be Ready */}
        {activeTab === 'recipeStep' && (
          <div className="bg-slate-950 p-4 rounded-xl border border-teal-500/30 space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-teal-300 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-teal-400" />
                Etapa da Misturinha nesta Cena:
              </span>
              <span className="text-[11px] font-mono bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {prompt.timeToReady || 'Age em 5 minutos sem esfregar'}
              </span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] font-bold text-amber-400 block mb-1">
                📋 Instrução Prática de Bancada:
              </span>
              <p className="text-slate-200 leading-relaxed">
                {prompt.recipeStepDetail ||
                  (prompt.step === 1
                    ? 'Apresentação da maquete gigante de 1,20m mostrando a sujeira incrustada nos microporos da superfície.'
                    : prompt.step === 2
                    ? 'Apresentação dos ingredientes caseiros da despensa e proporções de colher/xícara.'
                    : prompt.step === 3 || prompt.step === 4
                    ? 'Demonstração de como preparar a misturinha passo a passo: ativação efervescente e tempo de ação de 5 minutos exatos.'
                    : prompt.step === 5
                    ? 'Exibição do modo de aplicação com borrifador ou esponja e remoção suave sem esfregar.'
                    : 'Brilho espelhado alcançado, casa impecável e satisfação doméstica completa.')}
              </p>
            </div>

            {prompt.scientificBacking && (
              <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-emerald-300 block">
                    Respaldo Químico Comprovado:
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {prompt.scientificBacking}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'english' && (
          <div className="relative bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <button
                onClick={() => copyToClipboard(prompt.videoPromptEnglish, `en-${prompt.step}`)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors border border-slate-700 cursor-pointer"
              >
                {copiedField === `en-${prompt.step}` ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="pr-20 whitespace-pre-wrap">{prompt.videoPromptEnglish}</p>
            {prompt.engineParameters && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400">
                Parâmetros de Render: <code className="text-slate-200">{prompt.engineParameters}</code>
              </div>
            )}
          </div>
        )}

        {activeTab === 'portuguese' && (
          <div className="relative bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <button
                onClick={() => copyToClipboard(prompt.videoPromptVisual, `pt-${prompt.step}`)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors border border-slate-700 cursor-pointer"
              >
                {copiedField === `pt-${prompt.step}` ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="pr-20 whitespace-pre-wrap">{prompt.videoPromptVisual}</p>
          </div>
        )}

        {activeTab === 'humanRealism' && (
          <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="font-semibold text-emerald-400 block mb-0.5">
                • Micro-Expressões Faciais, Poros 8K & Realismo Natural:
              </span>
              <p className="text-slate-300 pl-3 border-l-2 border-emerald-500/40">
                {prompt.facialExpressionsAndHumanRealism}
              </p>
            </div>
            <div>
              <span className="font-semibold text-amber-400 block mb-0.5">
                • Anatomia e Movimentos das Mãos (5 dedos nítidos):
              </span>
              <p className="text-slate-300 pl-3 border-l-2 border-amber-500/40">
                {prompt.handMovements}
              </p>
            </div>
            <div>
              <span className="font-semibold text-cyan-400 block mb-0.5">
                • Câmera, Lente 50mm f/1.8 & Iluminação Cinematográfica 5400K:
              </span>
              <p className="text-slate-300 pl-3 border-l-2 border-cyan-500/40">
                {prompt.cameraAndLighting}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Refine Popover / Input */}
      {showRefineInput && (
        <form onSubmit={handleRefineSubmit} className="mt-4 p-3 bg-slate-950 rounded-xl border border-teal-500/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-teal-300 flex items-center gap-1">
              <Wand2 className="w-3.5 h-3.5 text-teal-400" />
              Refinar Prompt #{prompt.step} com IA:
            </span>
            <button
              type="button"
              onClick={() => setShowRefineInput(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Cancelar
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={refineText}
              onChange={(e) => setRefineText(e.target.value)}
              placeholder="Ex: Deixar a efervescência mais visível na tigela, enfatizar o brilho espelhado da panela..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={isRefining || !refineText.trim()}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {isRefining ? 'Ajustando...' : 'Aplicar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
