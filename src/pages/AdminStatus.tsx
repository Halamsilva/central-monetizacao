import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  Video,
  Webhook,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type SystemStatus = {
  ok: boolean;
  checked_at: string;
  services: Record<string, {
    ok: boolean;
    label: string;
    detail?: string;
    data?: any;
  }>;
  tables: Array<{
    table: string;
    ok: boolean;
    count: number | null;
    error: string | null;
    code: string | null;
  }>;
};

const serviceIcons: Record<string, React.ElementType> = {
  supabase: Database,
  kiwifyWebhook: Webhook,
  resend: Mail,
  gemini: KeyRound,
  flowWorker: Video,
};

const AdminStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatus = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error('Faca login novamente para ver o status.');
      }

      const response = await fetch('/api/admin/system-status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao carregar status.');
      }

      setStatus(payload);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const serviceEntries = status ? Object.entries(status.services) : [];
  const okServices = serviceEntries.filter(([, service]) => service.ok).length;
  const okTables = status?.tables.filter((table) => table.ok).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Status do sistema</h1>
          <p className="mt-2 text-slate-500">
            Confira rapidamente se Supabase, Kiwify, e-mail e gerador de videos estao prontos.
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          Atualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading && !status ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          <Loader2 className="mx-auto mb-3 animate-spin text-blue-600" size={34} />
          Carregando status...
        </div>
      ) : status ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase text-slate-400">Servicos OK</p>
              <h2 className="mt-2 text-3xl font-black text-emerald-600">
                {okServices}/{serviceEntries.length}
              </h2>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase text-slate-400">Tabelas OK</p>
              <h2 className="mt-2 text-3xl font-black text-blue-600">
                {okTables}/{status.tables.length}
              </h2>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase text-slate-400">Ultima checagem</p>
              <h2 className="mt-2 text-lg font-black text-slate-900">
                {new Date(status.checked_at).toLocaleString('pt-BR')}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {serviceEntries.map(([key, service]) => {
              const Icon = serviceIcons[key] || Activity;
              const isOk = service.ok;

              return (
                <div
                  key={key}
                  className={`rounded-3xl border bg-white p-5 shadow-sm ${
                    isOk ? 'border-emerald-200' : 'border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        isOk ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900">{service.label}</h2>
                        <p className="text-sm font-semibold text-slate-500">
                          {service.detail || (isOk ? 'Funcionando' : 'Precisa de atencao')}
                        </p>
                      </div>
                    </div>

                    {isOk ? (
                      <CheckCircle2 className="text-emerald-500" size={24} />
                    ) : (
                      <AlertCircle className="text-amber-500" size={24} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Banco de dados</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {status.tables.map((table) => (
                <div key={table.table} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-slate-900">{table.table}</p>
                    {table.ok ? (
                      <CheckCircle2 className="text-emerald-500" size={18} />
                    ) : (
                      <AlertCircle className="text-red-500" size={18} />
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {table.ok ? `${table.count ?? 0} registro(s)` : table.error || table.code}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminStatus;
