import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { motion } from 'motion/react';
import {
  Chrome,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
        email,
        password,
      });

      if (error) throw error;

      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.message || 'Erro ao fazer login. Verifique suas credenciais.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || 'Erro ao entrar com Google.'
      );

      setGoogleLoading(false);
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
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 outline-none transition-all focus:border-blue-500 focus:bg-white"
                  placeholder="••••••••"
                />
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 font-bold tracking-widest text-gray-400">
              Ou continue com
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-70"
        >
          {googleLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Chrome size={18} className="text-blue-500" />
              Login via Google
            </>
          )}
        </button>

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