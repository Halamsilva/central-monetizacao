import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  Clipboard,
  Film,
  Loader2,
  Palette,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const themes = [
  { label: 'Racismo', icon: '✊' },
  { label: 'Preconceito', icon: '🚫' },
  { label: 'Humilhação', icon: '🧍' },
  { label: 'Injustiça', icon: '⚖️' },
  { label: 'Abuso de Poder', icon: '👑' },
  { label: 'Desigualdade Social', icon: '🏚️' },
  { label: 'Superação', icon: '✨' },
  { label: 'Deuses Gregos', icon: '⚡' },
  { label: 'Dorama', icon: '💗' },
  { label: 'Infantil', icon: '🎈' },
  { label: 'Vida de Jesus', icon: '🙏' },
  { label: 'Roça', icon: '🤠' },
  { label: 'Comédia Br', icon: '😂' },
  { label: 'Frutas', icon: '🍎' },
  { label: 'Soldado voltando da guerra', icon: '🪖' },
  { label: 'Viagem no Tempo', icon: '⌛' },
  { label: 'Dramas Emocionantes', icon: '✨' },
  { label: 'Jesus: Milagres e Ressurreição', icon: '🙏' },
  { label: 'Traição', icon: '💔' },
  { label: 'Outro', icon: '✍️' },
];

const countries = ['Brasil', 'EUA', 'Espanha', 'México'];

const tones = [
  'Dramático e ultra-realista',
  'Emocionante e familiar',
  'Suspense com virada',
  'Comédia popular',
  'Cinematográfico sombrio',
];

const Novelinhas: React.FC = () => {
  const [theme, setTheme] = useState('Dramas Emocionantes');
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
    <div className="-mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-black px-4 py-8 text-white sm:-mx-6 sm:-my-6 sm:px-8 sm:py-10 lg:-mx-8 lg:-my-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.28em] text-orange-400">
            <Film size={14} />
            Agente cinematográfico
          </div>

          <h1 className="mx-auto max-w-5xl text-5xl font-black leading-none text-white sm:text-7xl lg:text-8xl">
            Dramáticos Realistas
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-relaxed text-zinc-400 sm:text-xl">
            Crie roteiros visuais ultra-realistas com foco em microtexturas de
            pele, iluminação cinematográfica e diálogos impactantes.
          </p>
        </motion.section>

        <section className="space-y-8">
          <div>
            <div className="mb-5 flex items-center gap-3 text-lg font-black text-white">
              <Palette size={22} className="text-orange-500" />
              Selecione o Tema
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {themes.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setTheme(item.label)}
                  className={`group flex aspect-[1.15] min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border p-3 text-center transition ${
                    theme === item.label
                      ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_0_1px_rgba(249,115,22,0.35),0_18px_60px_rgba(249,115,22,0.18)]'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600 hover:bg-zinc-900'
                  }`}
                >
                  <span className="text-2xl transition group-hover:scale-110">
                    {item.icon}
                  </span>
                  <span
                    className={`text-xs font-black uppercase tracking-wider ${
                      theme === item.label ? 'text-orange-300' : 'text-zinc-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/40 sm:p-7">
            <label className="mb-4 flex items-center gap-3 text-lg font-black text-white">
              <WandSparkles size={22} className="text-orange-500" />
              Contexto do Vídeo (Opcional)
            </label>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-zinc-500">
              Adicione detalhes específicos para a história
            </p>
            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              rows={5}
              maxLength={900}
              placeholder="Ex: A cena deve acontecer em um hospital e um dos personagens deve ser um médico arrogante..."
              className="w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-900 p-5 text-base font-semibold leading-relaxed text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1.15fr]">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <label className="mb-4 block text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                Estilo das falas
              </label>
              <div className="grid grid-cols-2 gap-2">
                {countries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCountry(item)}
                    className={`h-12 rounded-xl border px-4 text-sm font-black transition ${
                      country === item
                        ? 'border-orange-500 bg-orange-500/10 text-orange-300'
                        : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <label className="mb-4 block text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                Tom do roteiro
              </label>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm font-black text-zinc-100 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              >
                {tones.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                  <SlidersHorizontal size={15} className="text-orange-500" />
                  Quantidade de cenas
                </label>
                <span className="text-2xl font-black text-orange-400">{scenes}</span>
              </div>
              <input
                type="range"
                min={4}
                max={60}
                value={scenes}
                onChange={(event) => setScenes(Number(event.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="mt-2 flex justify-between text-[11px] font-bold text-zinc-600">
                <span>4 cenas</span>
                <span>60 cenas</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={generateScript}
            disabled={!canGenerate}
            className="mx-auto flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-orange-600 px-8 text-sm font-black uppercase tracking-wide text-white shadow-2xl shadow-orange-950/40 transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {loading ? 'Gerando...' : 'Gerar Roteiro'}
          </button>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/40 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-400">
                Resultado
              </p>
              <h2 className="text-2xl font-black text-white">Roteiro gerado</h2>
            </div>

            <button
              type="button"
              onClick={copyResult}
              disabled={!result}
              className="flex h-11 items-center gap-2 rounded-xl border border-zinc-700 px-4 text-xs font-black text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-40"
            >
              {copied ? <Check size={16} /> : <Clipboard size={16} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div className="min-h-72 rounded-2xl border border-zinc-800 bg-black p-5 text-zinc-300 sm:p-7">
            {result ? (
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h3 className="mb-4 text-3xl font-black text-white">{children}</h3>
                  ),
                  h2: ({ children }) => (
                    <h3 className="mb-3 mt-7 text-2xl font-black text-white">{children}</h3>
                  ),
                  h3: ({ children }) => (
                    <h4 className="mb-2 mt-6 text-lg font-black text-orange-300">
                      {children}
                    </h4>
                  ),
                  h4: ({ children }) => (
                    <h5 className="mb-2 mt-5 text-base font-black text-white">
                      {children}
                    </h5>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-sm font-medium leading-7 text-zinc-300 sm:text-base">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-black text-white">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-300 sm:text-base">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-zinc-300 sm:text-base">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                  hr: () => <div className="my-6 h-px bg-zinc-800" />,
                }}
              >
                {result}
              </ReactMarkdown>
            ) : (
              <div className="flex min-h-60 items-center justify-center text-center text-sm font-semibold leading-relaxed text-zinc-500">
                O roteiro aparecerá aqui depois da geração. Escolha o tema,
                ajuste as cenas e clique em Gerar Roteiro.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Novelinhas;
