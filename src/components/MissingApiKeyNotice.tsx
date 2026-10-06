import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Settings, X } from 'lucide-react';
import { MISSING_API_KEY_EVENT, QUOTA_EXCEEDED_EVENT } from '../lib/missingApiKey';
import { supabase } from '../lib/supabase';

type NoticeMode = 'missing' | 'quota' | 'quotaOwn' | 'timeout';

const copy: Record<
  NoticeMode,
  { title: string; description: string; steps: string[] }
> = {
  missing: {
    title: 'Cadastre sua chave de IA',
    description:
      'Para usar os agentes voce precisa da sua propria chave do Google AI Studio (ela e gratuita e fica na sua conta). Assim cada aluno usa a propria API e a cota do administrador nunca e gasta.',
    steps: [
      '1. Crie a chave em ai.google.dev (Free).',
      '2. No painel, va em Configuracoes e cole a chave.',
      '3. Volte aqui e gere novamente.',
    ],
  },
  quota: {
    title: 'A cota da plataforma acabou',
    description:
      'A chave da plataforma chegou no limite de uso do plano. Cadastre a sua propria chave do Google AI Studio (gratuita) para continuar usando todos os agentes agora mesmo.',
    steps: [
      '1. Crie sua chave gratuita em ai.google.dev.',
      '2. No painel, va em Configuracoes e cole a chave.',
      '3. Volte aqui e continue usando sem interrupcao.',
    ],
  },
  quotaOwn: {
    title: 'A cota da sua chave de IA acabou',
    description:
      'A sua chave do Google AI Studio atingiu o limite de uso gratuito. O Google limita poucas geracoes por dia para cada chave/Conta Google (a cota renova automaticamente todo dia).',
    steps: [
      '1. Aguarde a renovacao diaria da cota gratuita e tente novamente.',
      '2. Ou crie uma chave nova em OUTRA Conta Google e cole em Configuracoes.',
      '3. Para uso intenso, ative o faturamento (plano pago) no Google AI Studio.',
    ],
  },
  timeout: {
    title: 'A geracao demorou demais',
    description:
      'A resposta da IA ultrapassou o limite de tempo da rede. Isso nao e erro seu: normalmente significa que o conteudo era grande demais para o tempo disponivel.',
    steps: [
      '1. Clique em Tentar Novamente no agente.',
      '2. Se repetir, gere com menos cenas ou um clipe mais curto.',
      '3. Aguarde alguns instantes e tente de novo.',
    ],
  },
};

const EDGE_TIMEOUT_EVENT = 'halamsilva:edge-timeout';

const userHasOwnKey = async () => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return false;

    const { data } = await supabase
      .from('user_secrets')
      .select('gemini_api_key')
      .eq('id', userId)
      .maybeSingle();

    return Boolean(String(data?.gemini_api_key || '').trim());
  } catch {
    return false;
  }
};

const MissingApiKeyNotice: React.FC = () => {
  const [mode, setMode] = useState<NoticeMode | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMissing = () => setMode('missing');

    const handleQuota = async () => {
      const hasOwn = await userHasOwnKey();
      setMode(hasOwn ? 'quotaOwn' : 'quota');
    };

    const handleTimeout = () => setMode('timeout');

    window.addEventListener(MISSING_API_KEY_EVENT, handleMissing);
    window.addEventListener(QUOTA_EXCEEDED_EVENT, handleQuota);
    window.addEventListener(EDGE_TIMEOUT_EVENT, handleTimeout);

    return () => {
      window.removeEventListener(MISSING_API_KEY_EVENT, handleMissing);
      window.removeEventListener(QUOTA_EXCEEDED_EVENT, handleQuota);
      window.removeEventListener(EDGE_TIMEOUT_EVENT, handleTimeout);
    };
  }, []);

  if (!mode) return null;

  const { title, description, steps } = copy[mode];

  const goToSettings = () => {
    setMode(null);
    navigate('/settings');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <KeyRound size={24} />
          </span>

          <button
            type="button"
            onClick={() => setMode(null)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar aviso"
          >
            <X size={20} />
          </button>
        </div>

        <h2 className="mt-4 text-lg font-black text-slate-900">{title}</h2>

        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
          {description}
        </p>

        <ol className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-xs font-medium leading-relaxed text-slate-600">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={mode === 'timeout' ? () => setMode(null) : goToSettings}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            {mode === 'timeout' ? (
              <>
                <X size={18} />
                Entendi
              </>
            ) : (
              <>
                <Settings size={18} />
                Ir para Configuracoes
              </>
            )}
          </button>

          {mode !== 'timeout' && (
            <button
              type="button"
              onClick={() => setMode(null)}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
            >
              Agora nao
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissingApiKeyNotice;