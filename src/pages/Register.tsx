import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { motion } from 'motion/react';
import { User, Mail, Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });

      if (signUpError) throw signUpError;
      
      if (data.user) {
        // Create profile in our table
        await supabase.from('users_profile').insert({
          id: data.user.id,
          email: email,
          full_name: name,
          is_admin: false
        });

        const sessionToken =
          data.session?.access_token ||
          (await supabase.auth.getSession()).data.session?.access_token;

        if (sessionToken) {
          fetch('/api/emails/registration', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({ email, name }),
          }).catch((emailError) => {
            console.error('Erro ao enviar e-mail de cadastro:', emailError);
          });
        }
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
      >
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">
            CRIAR <span className="text-blue-600">CONTA</span>
          </h2>
          <p className="mt-2 text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed px-4">
            Acesso exclusivo para alunos da Central Monetização
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleRegister}>
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 text-xs text-gray-500">
            <ShieldCheck size={14} className="text-green-500" />
            <span>Ao se cadastrar, você concorda com nossos termos.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:bg-blue-400"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                Finalizar Cadastro
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 font-medium">
          Já possui uma conta?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Fazer login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
