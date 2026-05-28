import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  Download,
  Loader2,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Square,
  Volume2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const draftKey = 'narracao-generator-draft';

const voices = [
  { value: 'pt_BR', label: 'Português BR' },
  { value: 'pt_BR-female', label: 'Voz feminina BR' },
  { value: 'pt_BR-male', label: 'Voz masculina BR' },
  { value: 'narrador', label: 'Narrador grave' },
];

const Narracao: React.FC = () => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('pt_BR');
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const chars = text.trim().length;
  const canGenerate = chars > 0 && !loading;
  const browserVoices = useMemo(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }, []);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
      if (typeof draft.text === 'string') setText(draft.text);
      if (typeof draft.voice === 'string') setVoice(draft.voice);
      if (typeof draft.speed === 'number') setSpeed(draft.speed);
      if (typeof draft.pitch === 'number') setPitch(draft.pitch);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ text, voice, speed, pitch }));
  }, [text, voice, speed, pitch]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [audioUrl]);

  const reset = () => {
    setText('');
    setAudioUrl('');
    setError('');
    setSpeaking(false);
    setPaused(false);
    localStorage.removeItem(draftKey);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const previewInBrowser = () => {
    if (!text.trim() || !('speechSynthesis' in window)) {
      setError('Este navegador não liberou narração local.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = speed;
    utterance.pitch = pitch;

    const ptVoice = browserVoices.find((item) => /pt|brazil|brasil/i.test(`${item.lang} ${item.name}`));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };

    setError('');
    setSpeaking(true);
    setPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const pausePreview = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.pause();
    setPaused(true);
  };

  const resumePreview = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.resume();
    setPaused(false);
  };

  const stopPreview = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  const generateAudio = async () => {
    if (!canGenerate) return;

    setLoading(true);
    setError('');
    setAudioUrl('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error('Faça login novamente para usar este agente.');
      }

      const response = await fetch('/api/agents/narracao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, voice, speed, pitch }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Não foi possível gerar o áudio.');
      }

      const blob = await response.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar narração.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async () => {
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="-mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-black px-3 py-6 text-zinc-100 sm:-mx-6 sm:-my-6 sm:px-8 sm:py-10 lg:-mx-8 lg:-my-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-orange-500/20 bg-[#070707] p-6 shadow-2xl shadow-black/40 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                <Mic2 size={14} />
                Narração open-source
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
                Narração IA
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-400 sm:text-base">
                Cole um roteiro, teste a leitura no navegador e gere áudio quando o servidor Piper/Kokoro estiver conectado.
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 text-sm font-black text-orange-200 transition hover:bg-orange-500/20"
            >
              <RotateCcw size={16} />
              Limpar
            </button>
          </div>
        </motion.section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.42fr]">
          <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                  Roteiro
                </p>
                <h2 className="text-xl font-black text-white">Texto para narração</h2>
              </div>
              <button
                type="button"
                onClick={copyText}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-xs font-black uppercase tracking-wide text-white hover:border-orange-500"
              >
                {copied ? <Check size={15} /> : <Volume2 size={15} />}
                {copied ? 'Copiado' : 'Copiar texto'}
              </button>
            </div>

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={16}
              maxLength={12000}
              placeholder="Cole aqui seu roteiro, narração ou legenda..."
              className="w-full resize-y rounded-2xl border border-zinc-800 bg-black p-4 text-sm font-semibold leading-relaxed text-white outline-none placeholder:text-zinc-600 focus:border-orange-500 sm:text-base"
            />
            <div className="mt-3 flex justify-between text-xs font-bold text-zinc-600">
              <span>{chars} caracteres</span>
              <span>limite 12.000</span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal size={17} className="text-orange-400" />
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Configuração</h2>
              </div>

              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                Voz
              </label>
              <select
                value={voice}
                onChange={(event) => setVoice(event.target.value)}
                className="mb-4 h-12 w-full rounded-xl border border-zinc-800 bg-black px-3 text-sm font-black text-white outline-none focus:border-orange-500"
              >
                {voices.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <ControlSlider label="Velocidade" value={speed} min={0.6} max={1.4} step={0.05} onChange={setSpeed} />
              <ControlSlider label="Tom" value={pitch} min={0.7} max={1.3} step={0.05} onChange={setPitch} />
            </div>

            <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                Prévia grátis
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={previewInBrowser}
                  disabled={!text.trim() || speaking}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 text-xs font-black uppercase text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Play size={16} />
                  Ouvir
                </button>
                <button
                  type="button"
                  onClick={paused ? resumePreview : pausePreview}
                  disabled={!speaking}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 text-xs font-black uppercase text-white hover:border-orange-500 disabled:opacity-40"
                >
                  <Pause size={16} />
                  {paused ? 'Voltar' : 'Pausar'}
                </button>
                <button
                  type="button"
                  onClick={stopPreview}
                  disabled={!speaking}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 text-xs font-black uppercase text-white hover:border-red-500 disabled:opacity-40"
                >
                  <Square size={15} />
                  Parar
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                Gerar arquivo
              </p>
              <button
                type="button"
                onClick={generateAudio}
                disabled={!canGenerate}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-xs font-black uppercase tracking-widest text-black shadow-[0_18px_60px_rgba(249,115,22,0.25)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Mic2 size={18} />}
                {loading ? 'Gerando...' : 'Gerar MP3'}
              </button>

              {audioUrl && (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-4">
                  <audio controls src={audioUrl} className="w-full" />
                  <a
                    href={audioUrl}
                    download="narracao.mp3"
                    className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 text-xs font-black uppercase tracking-wide text-white hover:border-orange-500"
                  >
                    <Download size={15} />
                    Baixar áudio
                  </a>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const ControlSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
  <div className="mb-4">
    <div className="mb-2 flex items-center justify-between">
      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">{label}</label>
      <span className="text-xs font-black text-zinc-400">{value.toFixed(2)}x</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full accent-orange-500"
    />
  </div>
);

export default Narracao;
