import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { motion } from 'motion/react';
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

const getFriendlyAuthError = (err: any) => {
  const message = String(err?.message || err || '');
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid-credential') || normalized.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Se este for seu primeiro acesso no sistema novo, use “Esqueceu?” para definir sua senha.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar na plataforma.';
  }

  if (normalized.includes('too many requests') || normalized.includes('rate limit')) {
    return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.';
  }

  return message || 'Erro ao fazer login. Verifique suas credenciais.';
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
      }, 1000);

      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      navigate('/dashboard');
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <span className="text-2xl font-black">C</span>
          </div>

          <h2 className="mt-6 text-3xl font-black tracking-tight text-gray-900 uppercase">
            CENTRAL <span className="text-blue-600">MONETIZAÇÃO</span>
          </h2>

          <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
            Redes Sociais
          </p>
        </div>

        <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left">
          <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={18} />
          <p className="text-sm font-semibold leading-relaxed text-blue-900">
            Use o mesmo e-mail da compra na Kiwify. E-mails diferentes ficam
            em análise até a confirmação do acesso.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                E-mail
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
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 outline-none transition-all focus:border-blue-500 focus:bg-white"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Senha
                </label>

                <Link
                  to="/recovery"
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Esqueceu?
                </Link>
              </div>

              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-12 outline-none transition-all focus:border-blue-500 focus:bg-white"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(current => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:bg-blue-400"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Entrar na Plataforma

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </form>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <p className="font-bold">A senha antiga não funciona no sistema novo.</p>
          <p className="mt-1">
            Se você já tinha conta, use “Recuperar senha” com o mesmo e-mail
            da compra para definir uma nova senha. Novos alunos podem se cadastrar.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 font-bold">
            <Link to="/register" className="text-blue-700 hover:underline">
              Criar novo acesso
            </Link>
            <Link to="/recovery" className="text-blue-700 hover:underline">
              Recuperar senha
            </Link>
          </div>
        </div>

        <p className="text-center text-sm font-medium text-gray-500">
          Ainda não tem acesso?{' '}
          <Link
            to="/register"
            className="font-bold text-blue-600 hover:underline"
          >
            Cadastrar-se
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
