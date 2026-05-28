import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Image,
  Loader2,
  Palette,
  RotateCcw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const draftKey = 'gerador-imagens-draft';

const styles = [
  'Realista cinematográfico',
  'Foto de produto premium',
  'Thumbnail viral',
  'Ilustração 3D',
  'Anime / cartoon',
  'Editorial luxo',
  'Dark dramatic',
  'Minimalista',
];

const ratios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

const GeradorImagens: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [details, setDetails] = useState('');
  const [style, setStyle] = useState(styles[0]);
  const [ratio, setRatio] = useState('1:1');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
      if (typeof draft.prompt === 'string') setPrompt(draft.prompt);
      if (typeof draft.details === 'string') setDetails(draft.details);
      if (typeof draft.style === 'string') setStyle(draft.style);
      if (typeof draft.ratio === 'string') setRatio(draft.ratio);
      if (typeof draft.image === 'string') setImage(draft.image);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ prompt, details, style, ratio, image }));
  }, [prompt, details, style, ratio, image]);

  const reset = () => {
    setPrompt('');
    setDetails('');
    setStyle(styles[0]);
    setRatio('1:1');
    setImage('');
    setError('');
    localStorage.removeItem(draftKey);
  };

  const generate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError('');
    setImage('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error('Faça login novamente para usar este agente.');
      }

      const response = await fetch('/api/agents/gerador-imagens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, details, style, ratio }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível gerar a imagem.');
      }

      setImage(payload.image || '');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar imagem.');
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = async () => {
    const fullPrompt = `${prompt}\n\nEstilo: ${style}\nFormato: ${ratio}\nDetalhes: ${details || 'Nenhum'}`;
    await navigator.clipboard.writeText(fullPrompt.trim());
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
                <Image size={14} />
                Gerador visual
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
                Gerador de Imagens
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-400 sm:text-base">
                Crie imagens para posts, thumbnails, anúncios, capas e cenas usando prompt em português.
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

        <section className="grid gap-5 lg:grid-cols-[0.47fr_0.53fr]">
          <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Wand2 size={18} className="text-orange-400" />
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Prompt da imagem</h2>
            </div>

            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
              Ideia principal
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={7}
              maxLength={1500}
              placeholder="Ex: Uma capa viral de vídeo mostrando um artesão transformando pneus velhos em uma poltrona moderna..."
              className="w-full resize-y rounded-2xl border border-zinc-800 bg-black p-4 text-sm font-semibold leading-relaxed text-white outline-none placeholder:text-zinc-600 focus:border-orange-500"
            />

            <label className="mb-2 mt-4 block text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
              Detalhes extras
            </label>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Cores, iluminação, cenário, emoção, produto, público..."
              className="w-full resize-y rounded-2xl border border-zinc-800 bg-black p-4 text-sm font-semibold leading-relaxed text-white outline-none placeholder:text-zinc-600 focus:border-orange-500"
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                  <Palette size={13} />
                  Estilo
                </label>
                <select
                  value={style}
                  onChange={(event) => setStyle(event.target.value)}
                  className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-3 text-sm font-black text-white outline-none focus:border-orange-500"
                >
                  {styles.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                  Formato
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {ratios.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRatio(item)}
                      className={`h-12 rounded-xl text-xs font-black ${
                        ratio === item
                          ? 'bg-orange-500 text-black'
                          : 'border border-zinc-800 bg-black text-zinc-400 hover:border-orange-500'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={generate}
                disabled={!prompt.trim() || loading}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-xs font-black uppercase tracking-widest text-black shadow-[0_18px_60px_rgba(249,115,22,0.25)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {loading ? 'Gerando...' : 'Gerar imagem'}
              </button>

              <button
                type="button"
                onClick={copyPrompt}
                disabled={!prompt.trim()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-5 text-xs font-black uppercase tracking-wide text-white hover:border-orange-500 disabled:opacity-40"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar prompt'}
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-[#070707] p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Resultado</p>
                <h2 className="text-xl font-black text-white">Imagem gerada</h2>
              </div>
              {image && (
                <a
                  href={image}
                  download="imagem-gerada.png"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 text-xs font-black uppercase tracking-wide text-orange-100 hover:bg-orange-500/20"
                >
                  <Download size={15} />
                  Baixar
                </a>
              )}
            </div>

            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-zinc-800 bg-black p-4">
              {loading ? (
                <div className="text-center">
                  <Loader2 className="mx-auto mb-4 animate-spin text-orange-400" size={36} />
                  <p className="text-sm font-black text-white">Gerando imagem...</p>
                  <p className="mt-1 text-xs font-bold text-zinc-500">Isso pode levar alguns segundos.</p>
                </div>
              ) : image ? (
                <img
                  src={image}
                  alt="Imagem gerada"
                  className="max-h-[680px] w-full rounded-2xl object-contain"
                />
              ) : (
                <div className="max-w-sm text-center text-sm font-bold leading-relaxed text-zinc-500">
                  A imagem aparece aqui depois da geração. Use prompts claros para thumbnails, produtos, capas ou cenas.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GeradorImagens;
