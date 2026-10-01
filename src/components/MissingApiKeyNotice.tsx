import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Settings, X } from 'lucide-react';
import { MISSING_API_KEY_EVENT, QUOTA_EXCEEDED_EVENT } from '../lib/missingApiKey';

type NoticeMode = 'missing' | 'quota';

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
};

const MissingApiKeyNotice: React.FC = () => {
  const [mode, setMode] = useState<NoticeMode | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMissing = () => setMode('missing');
    const handleQuota = () => setMode('quota');

    window.addEventListener(MISSING_API_KEY_EVENT, handleMissing);
    window.addEventListener(QUOTA_EXCEEDED_EVENT, handleQuota);

    return () => {
      window.removeEventListener(MISSING_API_KEY_EVENT, handleMissing);
      window.removeEventListener(QUOTA_EXCEEDED_EVENT, handleQuota);
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
            onClick={goToSettings}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            <Settings size={18} />
            Ir para Configuracoes
          </button>

          <button
            type="button"
            onClick={() => setMode(null)}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
          >
            Agora nao
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissingApiKeyNotice;