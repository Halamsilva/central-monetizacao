import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  Clipboard,
  Copy,
  Film,
  Loader2,
  Palette,
  RotateCcw,
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

type PromptBlock = {
  title: string;
  content: string;
  dialogue: string | null;
};

const ensureFinalPunctuation = (text: string) => {
  const trimmed = text.trim();
  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const normalizeFalaLines = (text: string) =>
  text.replace(/^(\s*FALA:\s*)(["“]?)(.+?)(["”]?)\s*$/gim, (_match, prefix, _openQuote, rawText) => {
    const fala = String(rawText || '')
      .replace(/^["“]|["”]$/g, '')
      .trim();

    if (!fala) return `${prefix}""`;
    return `${prefix}"${ensureFinalPunctuation(fala)}"`;
  });

const cleanText = (text: string) => normalizeFalaLines(text.replace(/\*\*/g, '').trim());

const parsePromptBlocks = (text: string): PromptBlock[] => {
  const markerRegex =
    /(?:^|\n)\s*(PROMPT\s+(?:GANCHO\s+CHAMATIVO\s+CENA\s+\d+|CENA\s+(?:EXTRA\s+DE\s+GANCHO|EXTRA\s+DE\s+CTA|\d+)|EXTRA\s+DE\s+CTA)|CENA\s+\d+):?\s*/gi;
  const matches = Array.from(text.matchAll(markerRegex)) as RegExpMatchArray[];

  if (!matches.length) return [];

  return matches
    .map((match, index) => {
      const next = matches[index + 1];
      const start = (match.index || 0) + match[0].length;
      const end = next?.index ?? text.length;
      const title = cleanText(match[1] || `PROMPT CENA ${index}`);
      const content = cleanText(text.slice(start, end));
      const dialogueMatch =
        content.match(/(?:di[aá]logo sugerido|fala)\s*:\s*["“]?([^\n"”]+)["”]?/i) ||
        content.match(/[A-Za-zÀ-ÿ\s]+fala[^:]*:\s*["“]?([^\n"”]+)["”]?/i);

      return {
        title,
        content,
        dialogue: dialogueMatch ? cleanText(dialogueMatch[1]) : null,
      };
    })
    .filter((block) => block.content);
};

const visualOnlyText = (text: string) =>
  cleanText(text)
    .replace(/^\s*DIALOGO SUGERIDO:\s*["“]?[^\n"”]+["”]?\s*\n?/i, '')
    .replace(/^\s*DIÁLOGO SUGERIDO:\s*["“]?[^\n"”]+["”]?\s*\n?/i, '');

const Novelinhas: React.FC = () => {
  const [theme, setTheme] = useState('Dramas Emocionantes');
  const [country, setCountry] = useState('Brasil');
  const [tone, setTone] = useState(tones[0]);
  const [scenes, setScenes] = useState(6);
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPartTwo, setIsPartTwo] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const canGenerate = useMemo(() => !loading && theme.trim(), [loading, theme]);
  const [promptsPart, seoPart = ''] = result.split(/---SEO-START---/i);
  const promptBlocks = useMemo(() => parsePromptBlocks(promptsPart || ''), [promptsPart]);

  const copyToClipboard = async (key: string, text: string) => {
    if (!text) return;

    await navigator.clipboard.writeText(cleanText(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2200);
  };

  const resetGenerator = () => {
    setResult('');
    setError('');
    setCopiedKey('');
    setIsPartTwo(false);
  };

  const generateScript = async (previousResult?: string) => {
    if (!canGenerate) return;

    setLoading(true);
    setIsPartTwo(Boolean(previousResult));
    setError('');
    setCopiedKey('');
    if (!previousResult) setResult('');

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
        body: JSON.stringify({
          theme,
          country,
          tone,
          scenes,
          context,
          previousStory: previousResult || '',
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível gerar os prompts.');
      }

      const nextText = payload.text || '';
      setResult((current) => {
        if (!previousResult) return nextText;

        const [currentPrompts] = current.split(/---SEO-START---/i);
        return `${currentPrompts.trim()}\n\n${nextText}`.trim();
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar prompts.');
    } finally {
      setLoading(false);
      setIsPartTwo(false);
    }
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
            Gere prompts cinematográficos separados por cena, prontos para copiar e usar em vídeo.
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

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => generateScript()}
              disabled={!canGenerate}
              className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-orange-300/70 bg-orange-500 px-8 text-sm font-black uppercase tracking-wide text-black shadow-[0_18px_60px_rgba(249,115,22,0.28)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 sm:w-auto"
            >
              {loading && !isPartTwo ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {loading && !isPartTwo ? 'Gerando...' : result ? 'Gerar novo roteiro' : 'Gerar roteiro'}
            </button>

            {result && (
              <button
                type="button"
                onClick={() => generateScript(result)}
                disabled={!canGenerate}
                className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-orange-400/70 bg-orange-500/20 px-8 text-sm font-black uppercase tracking-wide text-orange-100 shadow-[0_14px_45px_rgba(249,115,22,0.14)] transition hover:bg-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {loading && isPartTwo ? <Loader2 className="animate-spin" size={20} /> : <Film size={20} />}
                {loading && isPartTwo ? 'Criando parte 2...' : 'Continuar como parte 2'}
              </button>
            )}

            {(result || context) && (
              <button
                type="button"
                onClick={resetGenerator}
                disabled={loading}
                className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-red-400/60 bg-red-500/20 px-8 text-sm font-black uppercase tracking-wide text-red-100 shadow-[0_14px_45px_rgba(239,68,68,0.12)] transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <RotateCcw size={20} />
                Limpar
              </button>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/40 sm:p-7">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-400">
                Prompts de Cena
              </p>
              <h2 className="text-2xl font-black text-white">
                {promptBlocks.length ? `${promptBlocks.length} prompts separados` : 'Pronto para gerar'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard('all', promptsPart)}
              disabled={!result}
              className="flex h-11 items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900 px-4 text-xs font-black text-white shadow-lg shadow-black/25 transition hover:border-orange-500/60 hover:bg-zinc-800 disabled:opacity-40"
            >
              {copiedKey === 'all' ? <Check size={16} /> : <Copy size={16} />}
              {copiedKey === 'all' ? 'Copiado' : 'Copiar Prompts'}
            </button>
          </div>

          {result && promptBlocks.length > 0 ? (
            <div className="space-y-6">
              {promptBlocks.map((block, index) => {
                const blockText = `${block.title}\n${block.content}`;
                const key = `prompt-${index}`;

                return (
                  <motion.article
                    key={`${block.title}-${index}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group relative rounded-2xl border border-zinc-700 bg-black/45 p-5 transition hover:border-orange-500/40 hover:bg-zinc-900/70 sm:p-6"
                  >
                    <div className="absolute -left-1 top-5 bottom-5 w-1 rounded-full bg-orange-500/50 transition group-hover:bg-orange-400" />

                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.42em] text-orange-400">
                          {block.title}
                        </p>
                        <h3 className="text-sm font-black text-zinc-500">
                          Segmento Cinematográfico {index + 1}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(key, blockText)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-orange-400/60 bg-orange-500/15 px-4 text-[11px] font-black uppercase tracking-wider text-orange-100 shadow-lg shadow-black/25 transition hover:bg-orange-500/25"
                      >
                        {copiedKey === key ? <Check size={14} /> : <Clipboard size={14} />}
                        {copiedKey === key ? 'Copiado' : 'Copiar Prompt'}
                      </button>
                    </div>

                    {block.dialogue && (
                      <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-orange-400">
                          Diálogo sugerido
                        </p>
                        <p className="text-base font-black italic leading-relaxed text-white">
                          “{block.dialogue}”
                        </p>
                      </div>
                    )}

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                        Instruções visuais
                      </p>
                      <pre className="whitespace-pre-wrap font-mono text-[12px] leading-6 text-zinc-300 sm:text-[13px]">
                        {visualOnlyText(block.content)}
                      </pre>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          ) : result ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-black p-6 text-center text-sm font-semibold text-zinc-500">
              O formato dos prompts não foi reconhecido. Tente gerar novamente.
            </div>
          ) : (
            <div className="flex min-h-60 items-center justify-center rounded-2xl border border-zinc-800 bg-black p-5 text-center text-sm font-semibold leading-relaxed text-zinc-500 sm:p-7">
              Os prompts separados aparecerão aqui. Escolha o tema, ajuste as cenas e clique em Gerar roteiro.
            </div>
          )}
        </section>

        {seoPart.trim() && (
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/40 sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-400">
                  SEO
                </p>
                <h2 className="text-2xl font-black text-white">Legenda e hashtags</h2>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard('seo', seoPart)}
                className="flex h-11 items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900 px-4 text-xs font-black text-white shadow-lg shadow-black/25 transition hover:border-orange-500/60 hover:bg-zinc-800"
              >
                {copiedKey === 'seo' ? <Check size={16} /> : <Clipboard size={16} />}
                {copiedKey === 'seo' ? 'Copiado' : 'Copiar SEO'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-black p-5 font-mono text-[13px] leading-7 text-zinc-300">
              {cleanText(seoPart)}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
};

export default Novelinhas;
