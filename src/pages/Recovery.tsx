import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { motion } from 'motion/react';
import {
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

const Recovery: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;

        const hasRecoveryType =
          hash.includes('type=recovery') || search.includes('type=recovery');

        const hasAccessToken =
          hash.includes('access_token') || search.includes('access_token');

        if (hasRecoveryType || hasAccessToken) {
          setIsPasswordRecovery(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingLink(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handleSendRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setLoading(false);
        setSuccessMessage(
          'Se este e-mail estiver cadastrado, você receberá um link em alguns instantes.'
        );
      }, 1000);
      return;
    }

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/recovery`,
        });

      if (resetError) throw resetError;

      setSuccessMessage(
        'Se este e-mail estiver cadastrado, você receberá um link em alguns instantes.'
      );
    } catch (err: any) {
      setError(
        err.message || 'Erro ao enviar e-mail. Verifique o endereço digitado.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setLoading(false);
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError('As senhas não conferem.');
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccessMessage('Senha atualizada com sucesso.');

      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }, 1800);
    } catch (err: any) {
      setError(
        err.message ||
        'Não foi possível atualizar a senha. Solicite um novo link.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingLink) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-5 text-sm font-bold text-slate-600 shadow-xl shadow-slate-200/60">
          <Loader2 className="animate-spin text-blue-600" size={20} />
          Verificando link de recuperação...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl rounded-[32px] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/60"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-3xl font-black text-white shadow-lg shadow-blue-200">
            C
          </div>

          <h2 className="text-4xl font-black tracking-tight text-gray-900 uppercase">
            {isPasswordRecovery ? 'Nova ' : 'Recuperar '}
            <span className="text-blue-600">Senha</span>
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm font-bold uppercase leading-relaxed tracking-widest text-gray-400">
            {isPasswordRecovery
              ? 'Digite sua nova senha para concluir a recuperação'
              : 'Enviaremos um link para resetar sua senha'}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-semibold text-green-700">
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {isPasswordRecovery ? (
          <form className="space-y-5" onSubmit={handleUpdatePassword}>
            <div className="space-y-1">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                Nova senha
              </label>

              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-base outline-none transition-all focus:border-blue-500 focus:bg-white"
                  placeholder="Digite a nova senha"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                Confirmar senha
              </label>

              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-base outline-none transition-all focus:border-blue-500 focus:bg-white"
                  placeholder="Confirme a nova senha"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:bg-blue-400"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Salvando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </button>

            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-gray-500 transition-colors hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Voltar ao login
            </Link>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleSendRecoveryEmail}>
            <div className="space-y-1">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                E-mail de cadastro
              </label>

              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-base outline-none transition-all focus:border-blue-500 focus:bg-white"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:bg-blue-400"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Enviar Link de Recuperação'
              )}
            </button>

            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-gray-500 transition-colors hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Voltar ao login
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Recovery;