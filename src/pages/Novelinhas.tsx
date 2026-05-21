import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  BookOpen,
  Check,
  Clipboard,
  Film,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const themes = [
  'Racismo',
  'Preconceito',
  'Humilhação',
  'Injustiça',
  'Abuso de Poder',
  'Desigualdade Social',
  'Superação',
  'Drama',
  'Infantil',
  'Traição',
  'Roça',
  'Comédia Br',
  'Viagem no Tempo',
  'Outro',
];

const countries = ['Brasil', 'EUA', 'Espanha', 'México'];

const tones = [
  'Dramático e ultra-realista',
  'Emocionante e familiar',
  'Suspense com virada',
  'Comédia popular',
];

const Novelinhas: React.FC = () => {
  const [theme, setTheme] = useState('Drama');
  const [country, setCountry] = useState('Brasil');
  const [tone, setTone] = useState(tones[0]);
  const [scenes, setScenes] = useState(6);
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const canGenerate = useMemo(() => !loading && theme.trim(), [loading, theme]);

  const generateScript = async () => {
    if (!canGenerate) return;

    setLoading(true);
    setError('');
    setResult('');
    setCopied(false);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error('Faça login novamente para usar este agente.');
      }

      const response = await fetch('/api/agents/novelinhas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme, country, tone, scenes, context }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível gerar o roteiro.');
      }

      setResult(payload.text || '');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar roteiro.');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;

    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-orange-600">
          <Film size={14} />
          Agente cinematográfico
        </div>

        <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
          Fábrica de <span className="text-orange-600">Novelinhas</span>
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
          Gere roteiros dramáticos cena por cena para vídeos verticais, com
          falas, ganchos e viradas prontas para TikTok, Reels e Shorts.
        </p>
      </motion.section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <BookOpen size={15} className="text-orange-600" />
              Tema da história
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {themes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTheme(item)}
                  className={`min-h-16 rounded-2xl border px-3 text-sm font-black transition ${theme === item
                      ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/50'
                    }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-xs font-black uppercase tracking-widest text-slate-500">
              Contexto adicional
            </label>
            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              rows={5}
              maxLength={900}
              placeholder="Ex: A cena acontece em um hospital e um dos personagens é um médico arrogante..."
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <label className="mb-3 block text-xs font-black uppercase tracking-widest text-slate-500">
                Estilo das falas
              </label>
              <div className="grid gap-2">
                {countries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCountry(item)}
                    className={`h-12 rounded-2xl border px-4 text-left text-sm font-black transition ${country === item
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <label className="mb-3 block text-xs font-black uppercase tracking-widest text-slate-500">
                Tom do roteiro
              </label>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                {tones.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <label className="mt-5 block text-xs font-black uppercase tracking-widest text-slate-500">
                Quantidade de cenas
              </label>
              <div className="mt-3 flex items-center gap-4">
                <input
                  type="range"
                  min={4}
                  max={60}
                  value={scenes}
                  onChange={(event) => setScenes(Number(event.target.value))}
                  className="w-full accent-orange-600"
                />
                <span className="w-10 text-right text-2xl font-black text-orange-600">
                  {scenes}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={generateScript}
            disabled={!canGenerate}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-100 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {loading ? 'Gerando roteiro...' : 'Gerar Roteiro'}
          </button>
        </div>

        <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Resultado
              </p>
              <h2 className="text-xl font-black text-slate-950">
                Roteiro gerado
              </h2>
            </div>

            <button
              type="button"
              onClick={copyResult}
              disabled={!result}
              className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              {copied ? <Check size={16} /> : <Clipboard size={16} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div className="min-h-[520px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {result ||
              'O roteiro aparecerá aqui depois da geração. Escolha o tema, ajuste as cenas e clique em Gerar Roteiro.'}
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Novelinhas;
