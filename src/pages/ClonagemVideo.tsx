import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Copy,
  FileVideo,
  KeyRound,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { describeHttpError } from '../lib/httpError';
import { useAuth } from '../context/AuthContext';

const SMALL_LIMIT = 3.2 * 1024 * 1024;
const FILE_LIMIT = 500 * 1024 * 1024;

const LANGUAGES = [
  { value: 'brasil', label: 'Português (Brasil)' },
  { value: 'estados_unidos', label: 'English (United States)' },
  { value: 'mexico', label: 'Español (México)' },
];

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Nao consegui ler o arquivo.'));
    reader.readAsDataURL(file);
  });

const uploadToGemini = async (
  file: File,
  key: string,
  onProgress?: (percent: number) => void
) => {
  const startUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(key)}`;

  const startResponse = await fetch(startUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(file.size),
      'X-Goog-Upload-Header-Content-Type': file.type || 'video/mp4',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: 'clonagem-video' } }),
  });

  if (!startResponse.ok) {
    let detail = '';
    try {
      const payload = await startResponse.json();
      detail = payload?.error?.message || '';
    } catch {
      detail = '';
    }
    if (startResponse.status === 403 || detail.toLowerCase().includes('blocked')) {
      throw new Error(
        'Sua chave do Google AI Studio bloqueia o upload de arquivos. Crie uma chave nova (sem restricoes) em aistudio.google.com/app/apikey.'
      );
    }
    throw new Error(detail || 'Falha ao iniciar o upload do video.');
  }

  const uploadUrl = startResponse.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Nao consegui iniciar o upload do video.');

  const fileUri = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('X-Goog-Upload-Command', 'upload, finalize');
    xhr.setRequestHeader('X-Goog-Upload-Offset', '0');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error('Falha ao enviar o video. Tente novamente.'));
        return;
      }
      try {
        const payload = JSON.parse(xhr.responseText);
        const uri = payload?.file?.uri;
        if (uri) resolve(String(uri));
        else reject(new Error('O upload nao retornou o arquivo.'));
      } catch {
        reject(new Error('Resposta de upload invalida.'));
      }
    };

    xhr.onerror = () => reject(new Error('Falha de rede no upload do video.'));

    xhr.send(file);
  });

  return fileUri;
};

const ClonagemVideo: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [language, setLanguage] = useState('brasil');
  const [file, setFile] = useState<File | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  React.useEffect(() => {
    const loadKey = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('user_secrets')
          .select('gemini_api_key')
          .eq('id', user.id)
          .maybeSingle();
        setHasKey(Boolean(data?.gemini_api_key));
      } catch {
        setHasKey(false);
      }
    };
    loadKey();
  }, [user?.id]);

  const blocks = useMemo(
    () =>
      result
        .split(/\n\s*-{3,}\s*\n/g)
        .map((block) => block.trim())
        .filter(Boolean),
    [result]
  );

  const getKey = async () => {
    if (!user?.id) return '';
    const { data } = await supabase
      .from('user_secrets')
      .select('gemini_api_key')
      .eq('id', user.id)
      .maybeSingle();
    return String(data?.gemini_api_key || '').trim();
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Escolha um video primeiro.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setStatus('Preparando...');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Faca login novamente.');

      const body: Record<string, unknown> = {
        language,
        mimeType: file.type || 'video/mp4',
      };

      if (file.size <= SMALL_LIMIT) {
        setStatus('Preparando o video...');
        body.videoBase64 = await readBase64(file);
      } else {
        if (file.size > FILE_LIMIT) {
          throw new Error(
            `Video muito grande (${formatSize(file.size)}). Use um clipe de ate ${formatSize(FILE_LIMIT)}.`
          );
        }
        const key = await getKey();
        if (!key) {
          throw new Error(
            'Para videos maiores, adicione sua chave do Google AI Studio em Configuracoes.'
          );
        }
        setStatus('Enviando o vídeo... 0%');
        body.fileUri = await uploadToGemini(file, key, (percent) =>
          setStatus(`Enviando o vídeo... ${percent}%`)
        );
      }

      setStatus('Analisando o video (pode levar 1-2 minutos)...');

      const response = await fetch('/api/agents/clonagem-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(await describeHttpError(response));

      const payload = await response.json().catch(() => ({}));
      if (!payload.result) throw new Error('A IA nao retornou o resultado.');

      setResult(payload.result);
      setStatus('');
    } catch (err: any) {
      setError(err?.message || 'Nao consegui analisar o video agora.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <FileVideo size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Clonagem de Vídeo
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Envie um vídeo e receba os prompts cinematográficos por blocos de 8 segundos,
              prontos para clonar no Kling, Runway, Sora, Luma e Wan.
            </p>
          </div>
        </div>
      </section>

      {hasKey === false && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold leading-relaxed text-amber-900 sm:text-sm">
            Vídeos grandes usam a sua chave do Google AI Studio. Você ainda não cadastrou
            uma — clipes de até {formatSize(SMALL_LIMIT)} funcionam sem ela.
          </p>
          <Link
            to="/settings"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 text-xs font-black text-white transition hover:bg-amber-600"
          >
            <KeyRound size={14} />
            Colocar minha chave
          </Link>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Idioma das falas
              </span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white"
              >
                {LANGUAGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Vídeo
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  setResult('');
                  setError('');
                  event.target.value = '';
                }}
              />

              {!file ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm font-black text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
                >
                  <Upload size={26} />
                  Escolher vídeo
                  <span className="text-xs font-semibold text-slate-400">
                    MP4, MOV, AVI ou WEBM
                  </span>
                </button>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileVideo className="shrink-0 text-blue-600" size={22} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
                      <p className="text-xs font-semibold text-slate-400">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setResult('');
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 transition hover:bg-slate-100"
                    aria-label="Remover vídeo"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {status && (
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{status}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !file}
              className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {loading ? 'Analisando...' : 'Analisar vídeo'}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-900">
              {blocks.length > 1 ? `${blocks.length} blocos gerados` : 'Resultado'}
            </h2>

            {result && (
              <button
                type="button"
                onClick={() => copy(result, 'all')}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50"
              >
                {copiedKey === 'all' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedKey === 'all' ? 'Copiado' : 'Copiar tudo'}
              </button>
            )}
          </div>

          {result ? (
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-600">
                      Bloco {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(block, String(index))}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-100"
                    >
                      {copiedKey === String(index) ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedKey === String(index) ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">
                    {block}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-center text-sm font-bold text-slate-400">
              O resultado por blocos de 8 segundos vai aparecer aqui.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClonagemVideo;
