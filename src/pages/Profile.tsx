import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Camera, Save, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Meu Perfil</h2>
        <p className="text-gray-500">Gerencie suas informações pessoais e configurações de conta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm text-center">
            <div className="relative mx-auto w-32 h-32 mb-4">
              <div className="w-full h-full rounded-full border-4 border-blue-50 bg-blue-50 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-blue-300" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">
                <Camera size={16} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Usuário Aluno'}</h3>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">Plano Premium</p>
            <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-tighter">
                <Shield size={14} className="text-green-500" /> Conta Verificada
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    defaultValue={profile?.full_name || ''}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">E-mail</label>
                <div className="relative opacity-60">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Bio / Descrição</label>
              <textarea 
                placeholder="Conte-nos um pouco sobre você..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 outline-none focus:border-blue-500 focus:bg-white min-h-[100px] transition-all"
              />
            </div>

            <div className="pt-4 border-t border-gray-50 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-8 py-3.5 font-bold text-white transition-all active:scale-95",
                  success ? "bg-green-500" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                )}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  success ? <><Check size={20} /> Salvo!</> : <><Save size={20} /> Salvar Alterações</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import { cn } from '../lib/utils';
