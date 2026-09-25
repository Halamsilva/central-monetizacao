import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
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
  geminiSettings?: GeminiSettings;
  menuSettings?: MenuSettings;
};

type GeminiSettings = {
  configured: boolean;
  usingStoredKey: boolean;
  maskedKey: string;
  fallbackConfigured: boolean;
};

type MenuSettings = {
  hiddenTabs: string[];
};

const removableTabs = [
  { title: 'Comece Aqui', path: '/comece-aqui', section: 'Principal' },
  { title: 'Agentes IA', path: '/agents', section: 'Estratégias' },
  { title: 'Loja VIP', path: '/shop-vip', section: 'Estratégias' },
  { title: 'Downloads', path: '/downloads', section: 'Estratégias' },
  { title: 'Menina da Roça', path: '/menina-da-roca', section: 'Vídeos' },
  { title: 'Prompts Virais', path: '/viral-prompts', section: 'Redes Sociais' },
  { title: 'Radar TikTok Shop', path: '/radar-tiktok-shop', section: 'Redes Sociais' },
  { title: 'TikTok Shop', path: '/tiktok-shop', section: 'Redes Sociais' },
  { title: 'Facebook', path: '/facebook', section: 'Redes Sociais' },
  { title: 'YouTube e Shorts', path: '/youtube-shorts', section: 'Redes Sociais' },
  { title: 'Ferramentas IA', path: '/tools-ia', section: 'Ferramentas' },
  { title: 'Tutoriais', path: '/tutoriais', section: 'Ferramentas' },
];

const serviceIcons: Record<string, React.ElementType> = {
  supabase: Database,
  kiwifyWebhook: Webhook,
  resend: Mail,
  gemini: KeyRound,
};

const friendlyAdminError = (message: string) => {
  if (/exceed_cached_egress_quota|restricted due to|spend caps|egress/i.test(message)) {
    return 'O servidor bloqueou temporariamente o projeto por limite de trafego de arquivos. O caminho gratis e usar YouTube para aulas e evitar MP4 pesado.';
  }

  if (/Failed to fetch|NetworkError/i.test(message)) {
    return 'Nao consegui falar com o servidor agora. Recarregue em alguns segundos e confira se o servidor e o Firebase estao respondendo.';
  }

  return message;
};

const AdminStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [geminiSettings, setGeminiSettings] = useState<GeminiSettings | null>(null);
  const [menuSettings, setMenuSettings] = useState<MenuSettings>({ hiddenTabs: [] });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

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
      setGeminiSettings(payload.geminiSettings || null);
      setMenuSettings(payload.menuSettings || { hiddenTabs: [] });
    } catch (err: any) {
      setError(friendlyAdminError(err.message || 'Erro ao carregar status.'));
    } finally {
      setLoading(false);
    }
  };

  const saveGeminiKey = async () => {
    setSavingKey(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) throw new Error('Faca login novamente para salvar a chave.');

      const response = await fetch('/api/admin/system-status', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKeyInput }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao salvar chave.');
      }

      setGeminiSettings(payload.geminiSettings || null);
      setApiKeyInput('');
      await loadStatus();
      setSuccess('Chave Gemini salva. Os agentes ja vao usar essa chave nova.');
    } catch (err: any) {
      setError(friendlyAdminError(err.message || 'Erro ao salvar chave.'));
    } finally {
      setSavingKey(false);
    }
  };

  const clearGeminiKey = async () => {
    const confirmed = window.confirm('Remover a chave salva no painel e voltar para a chave da Vercel?');
    if (!confirmed) return;

    setSavingKey(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) throw new Error('Faca login novamente para remover a chave.');

      const response = await fetch('/api/admin/system-status', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao remover chave.');
      }

      setGeminiSettings(payload.geminiSettings || null);
      await loadStatus();
      setSuccess('Chave do painel removida. O sistema voltou para a chave da Vercel, se ela estiver configurada.');
    } catch (err: any) {
      setError(friendlyAdminError(err.message || 'Erro ao remover chave.'));
    } finally {
      setSavingKey(false);
    }
  };

  const toggleHiddenTab = async (path: string) => {
    setSavingMenu(true);
    setError('');
    setSuccess('');

    const hiddenTabs = menuSettings.hiddenTabs.includes(path)
      ? menuSettings.hiddenTabs.filter((item) => item !== path)
      : [...menuSettings.hiddenTabs, path];

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) throw new Error('Faca login novamente para alterar as abas.');

      const response = await fetch('/api/admin/system-status', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hiddenTabs }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao salvar abas.');
      }

      setMenuSettings(payload.menuSettings || { hiddenTabs });
      setSuccess('Menu atualizado. Recarregue a pagina para conferir a sidebar.');
    } catch (err: any) {
      setError(friendlyAdminError(err.message || 'Erro ao salvar abas.'));
    } finally {
      setSavingMenu(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const serviceEntries: Array<[string, SystemStatus['services'][string]]> = status
    ? Object.entries(status.services)
    : [];
  const okServices = serviceEntries.filter(([, service]) => service.ok).length;
  const okTables = status?.tables.filter((table) => table.ok).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Status do sistema</h1>
          <p className="mt-2 text-slate-500">
            Confira rapidamente se banco de dados, Kiwify, e-mail e agentes IA estao prontos.
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

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {loading && !status ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          <Loader2 className="mx-auto mb-3 animate-spin text-blue-600" size={34} />
          Carregando status...
        </div>
      ) : status ? (
        <>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold leading-relaxed text-orange-800">
              Para manter no gratis: use YouTube nao listado para videos de aula e evite colocar MP4 pesado direto no servidor.
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700">
                  <KeyRound size={14} />
                  Chave dos agentes
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-900">Trocar API Gemini</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
                  Cole uma nova chave quando acabar o credito. Ela fica salva no servidor e substitui a chave da Vercel para os agentes da plataforma.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                Atual: {geminiSettings?.maskedKey || 'nenhuma'}
                <span className="ml-2 text-xs text-slate-400">
                  {geminiSettings?.usingStoredKey ? 'painel admin' : 'Vercel'}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(event) => setApiKeyInput(event.target.value)}
                placeholder="Cole aqui a nova API key do Gemini"
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={saveGeminiKey}
                disabled={savingKey || !apiKeyInput.trim()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {savingKey ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                Salvar chave
              </button>

              <button
                type="button"
                onClick={clearGeminiKey}
                disabled={savingKey || !geminiSettings?.usingStoredKey}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Usar Vercel
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">
                  <EyeOff size={14} />
                  Menu dos alunos
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-900">Remover ou mostrar abas</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
                  Use para esconder uma aba da sidebar quando nao quiser que ela apareca para os alunos. Para trazer de volta, clique em Mostrar.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                {menuSettings.hiddenTabs.length} aba(s) oculta(s)
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {removableTabs.map((tab) => {
                const hidden = menuSettings.hiddenTabs.includes(tab.path);

                return (
                  <div
                    key={tab.path}
                    className={`rounded-2xl border p-4 transition ${
                      hidden ? 'border-slate-200 bg-slate-50 opacity-80' : 'border-emerald-100 bg-white'
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{tab.section}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">{tab.title}</p>
                        <p className="truncate text-xs font-semibold text-slate-400">{tab.path}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleHiddenTab(tab.path)}
                        disabled={savingMenu}
                        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          hidden
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                        {hidden ? 'Mostrar' : 'Ocultar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
