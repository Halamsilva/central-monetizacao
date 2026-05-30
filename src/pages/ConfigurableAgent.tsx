import React, { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Bot, Check, Copy, ImagePlus, Loader2, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parseConfigurableAgent, slugifyAgentTitle, type ConfigurableAgentConfig } from '../lib/configurableAgent';

type Agent = {
  id: string;
  title: string;
  description: string;
  image?: string;
  prompt: string;
  is_published?: boolean;
};

const readImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ConfigurableAgent: React.FC = () => {
  const { slug = '' } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [config, setConfig] = useState<ConfigurableAgentConfig | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadAgent = async () => {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('agents')
        .select('*')
        .neq('is_published', false);

      if (fetchError) {
        setError('Nao foi possivel carregar este agente.');
        setLoading(false);
        return;
      }

      const found = (data || []).find((item: Agent) => slugifyAgentTitle(item.title) === slug);
      const parsed = parseConfigurableAgent(found?.prompt);

      if (!found || !parsed) {
        setError('Agente interno nao encontrado ou ainda nao configurado.');
        setLoading(false);
        return;
      }

      setAgent(found);
      setConfig(parsed);
      setValues(
        parsed.fields.reduce((next, field) => {
          next[field.key] = field.type === 'select' ? field.options?.[0] || '' : '';
          return next;
        }, {} as Record<string, string>)
      );
      setLoading(false);
    };

    loadAgent();
  }, [slug]);

  const canGenerate = useMemo(() => {
    if (!config) return false;
    return config.fields.every((field) => !field.required || values[field.key]?.trim());
  }, [config, values]);

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Envie uma imagem valida.');
      return;
    }
    setImage(await readImage(file));
  };

  const generate = async () => {
    if (!agent || !config) return;

    setGenerating(true);
    setError('');
    setResult('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) throw new Error('Faca login novamente.');

      const response = await fetch('/api/agents/configurable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agentId: agent.id,
          values,
          image: image || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Erro ao gerar resposta.');
      setResult(payload.text || '');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar resposta.');
    } finally {
      setGenerating(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!agent || !config) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-8 text-center text-red-700">
        <AlertCircle className="mx-auto mb-3 h-8 w-8" />
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase text-blue-700">
              <Bot className="h-4 w-4" />
              Agente interno configuravel
            </div>
            <h1 className="text-3xl font-black text-slate-900">{agent.title}</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
              {agent.description || 'Preencha os campos abaixo para gerar o resultado.'}
            </p>
          </div>
          {agent.image && <img src={agent.image} alt="" className="h-24 w-40 rounded-2xl object-cover" />}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            {config.fields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                  {field.label}{field.required ? ' *' : ''}
                </span>
                {field.type === 'textarea' ? (
                  <textarea
                    value={values[field.key] || ''}
                    onChange={(event) => updateValue(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={values[field.key] || ''}
                    onChange={(event) => updateValue(field.key, event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    {(field.options || []).map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={values[field.key] || ''}
                    onChange={(event) => updateValue(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                )}
              </label>
            ))}
          </div>

          {config.acceptsImage && (
            <div className="mt-5">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {!image ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm font-black text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
                >
                  <ImagePlus className="h-5 w-5" />
                  Enviar imagem opcional
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200">
                  <img src={image} alt="Imagem enviada" className="h-40 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={!canGenerate || generating}
            onClick={generate}
            className="mt-5 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {generating ? 'Gerando...' : 'Gerar resultado'}
          </button>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-900">{config.outputTitle || 'Resultado gerado'}</h2>
            {result && (
              <button
                type="button"
                onClick={copyResult}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            )}
          </div>

          {result ? (
            <div className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm font-semibold leading-relaxed text-slate-700">
              {result}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-center text-sm font-bold text-slate-400">
              O resultado vai aparecer aqui.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ConfigurableAgent;
