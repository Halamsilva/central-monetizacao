import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  ImagePlus,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  model: string;
  size: string;
  createdAt: string;
};

const MODELS = [
  { id: 'agnes-image-2.5-flash', label: 'Agnes Image 2.5 (recomendado)' },
  { id: 'agnes-image-2.1-flash', label: 'Agnes Image 2.1' },
  { id: 'agnes-image-2.0-flash', label: 'Agnes Image 2.0' },
];

const SIZES = [
  { id: '1024x1024', label: '1:1', hint: 'Quadrado' },
  { id: '720x1280', label: '9:16', hint: 'Vertical' },
  { id: '1024x1536', label: '2:3', hint: 'Retrato' },
  { id: '1536x1024', label: '3:2', hint: 'Paisagem' },
];

const EXAMPLES = [
  'Retrato cinematografico de uma mulher brasileira na cozinha, luz quente de fim de tarde, lente 85mm, alta detalhacao',
  'Personagem 3D estilo Pixar de um senhor rural sorrindo, fundo de fazenda, iluminacao suave',
  'Cena realista de uma mesa de cafe da manha com bolo caseiro, vapor saindo, luz natural entrando pela janela',
];

const ImagensIA: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(MODELS[0].id);
  const [size, setSize] = useState(SIZES[1].id);
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [current, setCurrent] = useState<GeneratedImage | null>(null);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const generate = async () => {
    if (generating) return;

    const text = prompt.trim();

    if (text.length < 5) {
      setError('Descreva a imagem que voce quer gerar.');
      return;
    }

    setGenerating(true);
    setError('');
    setElapsed(0);

    timerRef.current = window.setInterval(() => setElapsed((prev) => prev + 1), 1000);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || '';

      const response = await fetch('/api/agents/agnes-imagens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'generate', prompt: text, model, size }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Nao consegui gerar a imagem.');
      }

      const item: GeneratedImage = {
        id: `${Date.now()}`,
        url: String(data.url),
        prompt: text,
        model: String(data.model || model),
        size: String(data.size || size),
        createdAt: new Date().toISOString(),
      };

      setCurrent(item);
      setGallery((prev) => [item, ...prev].slice(0, 24));
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar a imagem.');
    } finally {
      stopTimer();
      setGenerating(false);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard bloqueado
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <ImagePlus size={24} />
            </span>
            <div>
              <h1 className="text-xl font-black sm:text-2xl">Gerador de Imagens IA</h1>
              <p className="text-xs font-semibold text-purple-100 sm:text-sm">
                Crie fotos, personagens e cenarios com a Agnes AI. Teste o estilo antes de levar para os videos.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide backdrop-blur">
            <Sparkles size={13} /> ~10s por imagem
          </span>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="whitespace-pre-line">{error}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Descreva a imagem
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Ex: Retrato cinematografico de uma mulher brasileira na cozinha, luz quente de fim de tarde, lente 85mm, alta detalhacao"
              className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPrompt(example)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-fuchsia-300 hover:text-fuchsia-700"
              >
                Exemplo {index + 1}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Modelo</label>
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-fuchsia-500"
              >
                {MODELS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Formato</label>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {SIZES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSize(item.id)}
                    className={`rounded-xl border px-1 py-2 text-center transition ${
                      size === item.id
                        ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-black">{item.label}</span>
                    <span className="block text-[9px] font-semibold uppercase">{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-600 text-sm font-black uppercase tracking-wide text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            {generating ? `Gerando... ${elapsed}s` : 'Gerar imagem'}
          </button>

          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold leading-relaxed text-amber-800">
            A Agnes libera 4.000 imagens por dia, mas com limite por minuto. Se der erro de limite, aguarde alguns
            instantes e tente de novo.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Resultado</h2>

          {current ? (
            <div className="mt-3 space-y-3">
              <a href={current.url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={current.url}
                  alt={current.prompt}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 object-contain"
                />
              </a>

              <div className="flex flex-wrap gap-2">
                <a
                  href={current.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-[11px] font-black text-white transition hover:bg-slate-800"
                >
                  <Download size={13} /> Baixar
                </a>

                <button
                  type="button"
                  onClick={() => copyUrl(current.url)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copiado' : 'Copiar link'}
                </button>

                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <ExternalLink size={13} /> Tamanho real
                </a>
              </div>

              <p className="text-[10px] font-semibold leading-relaxed text-slate-500">{current.prompt}</p>
            </div>
          ) : (
            <div className="mt-3 flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              {generating ? (
                <>
                  <Loader2 size={26} className="animate-spin" />
                  <span className="mt-2 text-[11px] font-bold">{elapsed}s</span>
                </>
              ) : (
                <>
                  <ImagePlus size={28} />
                  <span className="mt-2 text-[11px] font-bold">Sua imagem aparece aqui</span>
                </>
              )}
            </div>
          )}

          {generating && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <Clock size={12} /> Normal: 8 a 20 segundos
            </p>
          )}
        </section>
      </div>

      {gallery.length > 1 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Geradas nesta sessao ({gallery.length})
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {gallery.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrent(item)}
                className={`overflow-hidden rounded-xl border-2 transition ${
                  current?.id === item.id ? 'border-fuchsia-500' : 'border-transparent hover:border-slate-300'
                }`}
              >
                <img src={item.url} alt={item.prompt} className="h-28 w-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ImagensIA;
