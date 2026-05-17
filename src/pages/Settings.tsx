import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Shield,
  Globe,
  Crown,
  Save,
  RotateCcw,
  AlertTriangle,
  Check,
  Loader2,
  Mail,
  Lock,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Preferences = {
  emailNotifications: boolean;
  noticeNotifications: boolean;
  updateNotifications: boolean;
  showProfileInfo: boolean;
  compactMode: boolean;
  language: string;
};

const preferencesKey = 'central_user_settings';

const defaultPreferences: Preferences = {
  emailNotifications: true,
  noticeNotifications: true,
  updateNotifications: true,
  showProfileInfo: true,
  compactMode: false,
  language: 'pt-BR',
};

const Settings: React.FC = () => {
  const { profile } = useAuth();

  const [preferences, setPreferences] = useState<Preferences>(() => {
    const savedPreferences = localStorage.getItem(preferencesKey);

    if (!savedPreferences) return defaultPreferences;

    try {
      return {
        ...defaultPreferences,
        ...JSON.parse(savedPreferences),
      };
    } catch {
      return defaultPreferences;
    }
  });

  const [saving, setSaving] = useState(false);
  const [sendingRecovery, setSendingRecovery] = useState(false);

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [securityMessage, setSecurityMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  const updatePreference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const savePreferences = () => {
    setSaving(true);

    setTimeout(() => {
      localStorage.setItem(preferencesKey, JSON.stringify(preferences));
      setSaving(false);
      setMessage({
        type: 'success',
        text: 'Configurações salvas com sucesso.',
      });
    }, 600);
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.setItem(preferencesKey, JSON.stringify(defaultPreferences));

    setMessage({
      type: 'success',
      text: 'Configurações restauradas para o padrão.',
    });
  };

  const sendPasswordRecovery = async () => {
    setSecurityMessage(null);

    if (!profile?.email) {
      setSecurityMessage({
        type: 'error',
        text: 'Não encontramos um e-mail válido para esta conta.',
      });
      return;
    }

    try {
      setSendingRecovery(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        profile.email,
        {
          redirectTo: `${window.location.origin}/recovery`,
        }
      );

      if (error) {
        console.error(error);

        const isRateLimit =
          error.message.toLowerCase().includes('rate limit') ||
          error.message.toLowerCase().includes('too many requests') ||
          error.message.toLowerCase().includes('security purposes');

        const translatedMessage = isRateLimit
          ? 'Você pediu muitos links em pouco tempo. Aguarde de 5 a 10 minutos e tente novamente apenas uma vez.'
          : `Não foi possível enviar o link: ${error.message}`;

        setSecurityMessage({
          type: 'error',
          text: translatedMessage,
        });

        return;
      }

      setSecurityMessage({
        type: 'success',
        text: `Link enviado para ${profile.email}. Abra seu e-mail e clique em Redefinir senha.`,
      });
    } catch (err: any) {
      console.error(err);

      setSecurityMessage({
        type: 'error',
        text: err?.message
          ? `Não foi possível enviar o link: ${err.message}`
          : 'Erro inesperado ao enviar o link de recuperação.',
      });
    } finally {
      setSendingRecovery(false);
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return 'Ainda não disponível';

    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getAccessText = () => {
    if (profile?.access_status === 'active') return 'Ativo';
    if (profile?.access_status === 'blocked') return 'Bloqueado';
    return 'Em análise';
  };

  const getAccessColor = () => {
    if (profile?.access_status === 'active') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }

    if (profile?.access_status === 'blocked') {
      return 'bg-red-50 text-red-700 border-red-100';
    }

    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-all ${checked ? 'bg-blue-600' : 'bg-slate-200'
        }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'
          }`}
      />
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Configurações
        </h2>

        <p className="mt-2 text-slate-500">
          Ajuste a plataforma de acordo com suas preferências.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold ${message.type === 'success'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-red-100 bg-red-50 text-red-700'
            }`}
        >
          {message.type === 'success' ? (
            <Check size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}

          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2"
        >
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Bell size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Notificações
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Escolha como deseja acompanhar avisos e atualizações.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-bold text-slate-900">
                  Receber notificações por e-mail
                </p>
                <p className="text-sm text-slate-500">
                  Envia novidades importantes para seu e-mail.
                </p>
              </div>

              <Toggle
                checked={preferences.emailNotifications}
                onChange={(value) =>
                  updatePreference('emailNotifications', value)
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-bold text-slate-900">
                  Avisos da plataforma
                </p>
                <p className="text-sm text-slate-500">
                  Mostra comunicados publicados pela equipe.
                </p>
              </div>

              <Toggle
                checked={preferences.noticeNotifications}
                onChange={(value) =>
                  updatePreference('noticeNotifications', value)
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-bold text-slate-900">
                  Atualizações de conteúdo
                </p>
                <p className="text-sm text-slate-500">
                  Avisa quando novos agentes e materiais forem liberados.
                </p>
              </div>

              <Toggle
                checked={preferences.updateNotifications}
                onChange={(value) =>
                  updatePreference('updateNotifications', value)
                }
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Crown size={24} />
          </div>

          <h3 className="text-xl font-black text-slate-900">
            Assinatura
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Informações atuais do seu acesso premium.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Plano
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">
                Premium
              </p>
            </div>

            <div className={`rounded-2xl border p-4 ${getAccessColor()}`}>
              <p className="text-xs font-black uppercase tracking-widest opacity-70">
                Status
              </p>
              <p className="mt-1 text-lg font-black">{getAccessText()}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Aprovado em
              </p>
              <p className="mt-1 text-sm font-bold text-slate-700">
                {formatDate(profile?.approved_at)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Shield size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Privacidade
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Controle como suas informações aparecem na plataforma.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-bold text-slate-900">
                  Mostrar dados do perfil
                </p>
                <p className="text-sm text-slate-500">
                  Permite exibir seu nome e foto na área lateral.
                </p>
              </div>

              <Toggle
                checked={preferences.showProfileInfo}
                onChange={(value) =>
                  updatePreference('showProfileInfo', value)
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-bold text-slate-900">
                  Modo compacto
                </p>
                <p className="text-sm text-slate-500">
                  Preferência visual para telas com menos espaço.
                </p>
              </div>

              <Toggle
                checked={preferences.compactMode}
                onChange={(value) => updatePreference('compactMode', value)}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Lock size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Segurança
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Proteja sua conta e gerencie recuperação de acesso.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail size={18} />
              <span className="truncate text-sm font-bold">
                {profile?.email || 'E-mail não encontrado'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={sendPasswordRecovery}
            disabled={sendingRecovery}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-70"
          >
            {sendingRecovery ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Enviando link...
              </>
            ) : (
              <>
                <Lock size={18} />
                Enviar link para trocar senha
              </>
            )}
          </button>

          {securityMessage && (
            <div
              className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${securityMessage.type === 'success'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-red-100 bg-red-50 text-red-700'
                }`}
            >
              {securityMessage.type === 'success' ? (
                <Check size={18} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              )}

              <span>{securityMessage.text}</span>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
            <Globe size={24} />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-900">
              Idioma
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Escolha o idioma principal da interface.
            </p>
          </div>
        </div>

        <select
          value={preferences.language}
          onChange={(event) =>
            updatePreference('language', event.target.value)
          }
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
        >
          <option value="pt-BR">Português Brasil</option>
          <option value="en-US">Inglês Estados Unidos</option>
          <option value="es-ES">Espanhol</option>
        </select>
      </motion.div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={resetPreferences}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
        >
          <RotateCcw size={18} />
          Restaurar padrão
        </button>

        <button
          type="button"
          onClick={savePreferences}
          disabled={saving}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-70"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Salvando...
            </>
          ) : (
            <>
              <Save size={18} />
              Salvar Configurações
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;