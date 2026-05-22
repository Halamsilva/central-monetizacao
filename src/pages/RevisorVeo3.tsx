import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  Clipboard,
  Clapperboard,
  Copy,
  Film,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type RevisionResult = {
  title: string;
  scene: string;
  character: string;
  environment: string;
  action: string;
  camera: string;
  lighting: string;
  visualStyle: string;
  realisticDetails: string;
  audio: string;
  finalPrompt: string;
};

const examplePrompt =
  'Uma mulher adulta caminhando em uma rua de Tokyo à noite, chuva leve, luzes neon refletindo no chão, clima cyberpunk, câmera acompanhando em movimento suave.';

const fullRevisionText = (result: RevisionResult) =>
  `
Título: ${result.title}
Cena: ${result.scene}
Personagem: ${result.character}
Ambiente: ${result.environment}
Ação: ${result.action}
Câmera: ${result.camera}
Iluminação: ${result.lighting}
Estilo visual: ${result.visualStyle}
Detalhes realistas: ${result.realisticDetails}
Áudio: ${result.audio}

Prompt final:
${result.finalPrompt}
`.trim();

const resultItems = [
  ['Cena', 'scene'],
  ['Personagem', 'character'],
  ['Ambiente', 'environment'],
  ['Ação', 'action'],
  ['Câmera', 'camera'],
  ['Iluminação', 'lighting'],
  ['Estilo visual', 'visualStyle'],
  ['Detalhes realistas', 'realisticDetails'],
  ['Áudio', 'audio'],
] as const;

const RevisorVeo3: React.FC = () => {
  const resultRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<RevisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const reset = () => {
    setPrompt('');
    setResult(null);
    setError('');
    setCopied(null);
  };

  const revisePrompt = async () => {
    if (!prompt.trim()) {
      setError('Cole um prompt para revisar.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error('Faça login novamente para usar este agente.');
      }

      const response = await fetch('/api/agents/revisor-veo-3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível revisar o prompt.');
      }

      setResult(payload);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      setError(err.message || 'Erro ao revisar prompt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="-mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-black px-4 py-8 text-white sm:-mx-6 sm:-my-6 sm:px-8 lg:-mx-8 lg:-my-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-indigo-200">
                <Film size={14} />
                Revisor Veo 3
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Diretor de prompts
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-400 sm:text-base">
                Cole um prompt bruto e transforme em uma cena estruturada,
                segura e pronta para gerar vídeo no Veo 3.
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-zinc-200 transition hover:bg-white/10"
            >
              <RefreshCw size={16} />
              Limpar
            </button>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950 p-5 shadow-2xl shadow-black/30 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                <Clapperboard size={14} className="text-indigo-300" />
                Prompt original
              </label>

              <button
                type="button"
                onClick={() => setPrompt(examplePrompt)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-300 transition hover:bg-white/10"
              >
                Usar exemplo
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Cole aqui seu prompt do Veo 3..."
              rows={12}
              className="w-full resize-y rounded-2xl border border-white/10 bg-black p-5 text-sm font-semibold leading-relaxed text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            />

            {error && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={revisePrompt}
              disabled={loading || !prompt.trim()}
              className="mt-5 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-indigo-500 px-6 text-sm font-black text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {loading ? 'Revisando prompt...' : 'Revisar para Veo 3'}
            </button>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950 p-5 shadow-2xl shadow-black/30 sm:p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white">
              <Wand2 size={22} />
            </div>
            <h2 className="text-2xl font-black">O que ele corrige</h2>
            <div className="mt-5 space-y-3 text-sm font-semibold text-zinc-400">
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                Organiza cena, personagem, câmera, luz, áudio e prompt final.
              </p>
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                Remove termos arriscados e melhora a chance de passar no Veo 3.
              </p>
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                Mantém a ideia original, mas deixa o resultado mais profissional.
              </p>
            </div>
          </motion.aside>
        </div>

        <div ref={resultRef}>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">
                    Cena estruturada
                  </p>
                  <h2 className="mt-2 text-3xl font-black">{result.title}</h2>
                </div>

                <button
                  type="button"
                  onClick={() => copyText(fullRevisionText(result), 'all')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-zinc-100 transition hover:bg-white/10"
                >
                  {copied === 'all' ? <Check size={18} /> : <Clipboard size={18} />}
                  {copied === 'all' ? 'Copiado' : 'Copiar tudo'}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {resultItems.map(([label, key]) => (
                  <div key={key} className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                      {label}
                    </p>
                    <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-zinc-300">
                      {result[key]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-[2rem] border border-indigo-400/20 bg-indigo-400/10 p-5 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-200">
                      Prompt final
                    </p>
                    <h3 className="mt-1 text-2xl font-black text-white">Pronto para Veo 3</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyText(result.finalPrompt, 'final')}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 text-sm font-black text-white transition hover:bg-indigo-400"
                  >
                    {copied === 'final' ? <Check size={18} /> : <Copy size={18} />}
                    {copied === 'final' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-black p-5 font-mono text-sm leading-relaxed text-zinc-200">
                  {result.finalPrompt}
                </p>
              </div>
            </motion.section>
          )}
        </div>

        {!result && !loading && (
          <div className="rounded-[2rem] border border-dashed border-white/10 p-8 text-center text-zinc-500">
            <Sparkles className="mx-auto mb-3 text-indigo-300" size={34} />
            <p className="text-sm font-bold">
              O prompt revisado aparece aqui depois da geração.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisorVeo3;
