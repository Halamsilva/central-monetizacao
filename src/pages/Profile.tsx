import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Shield,
  Camera,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Upload,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const Profile: React.FC = () => {
  const { user, profile } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setAvatarUrl(profile?.avatar_url || null);
  }, [profile]);

  const showSuccess = () => {
    setSuccess(true);
    setErrorMessage('');

    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccess(false);

    setTimeout(() => {
      setErrorMessage('');
    }, 4000);
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      setUploadingAvatar(true);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        showError('Erro ao enviar foto. Verifique o bucket avatars no Supabase.');
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(updateError);
        showError('Foto enviada, mas não foi possível salvar no perfil.');
        return;
      }

      showSuccess();
    } catch (err) {
      console.error(err);
      showError('Erro inesperado ao enviar foto.');
    } finally {
      setUploadingAvatar(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      showError('Usuário não encontrado.');
      return;
    }

    if (!fullName.trim()) {
      showError('Digite seu nome completo.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) {
        console.error(error);
        showError('Erro ao salvar alterações.');
        return;
      }

      showSuccess();
    } catch (err) {
      console.error(err);
      showError('Erro inesperado ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">
          Meu Perfil
        </h2>

        <p className="text-gray-500">
          Gerencie suas informações pessoais e configurações de conta.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <Check className="h-4 w-4" />
          Perfil atualizado com sucesso.
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-sm"
          >
            <div className="relative mx-auto mb-4 h-32 w-32">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-blue-50 bg-blue-50">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={64} className="text-blue-300" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-3 text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {uploadingAvatar ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              {fullName || profile?.full_name || 'Usuário Aluno'}
            </h3>

            <p className="mt-1 text-sm font-bold uppercase tracking-widest text-blue-600">
              Plano Premium
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mx-auto mt-5 flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              Alterar foto
            </button>

            <div className="mt-6 flex flex-col gap-2 border-t border-gray-50 pt-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tighter text-gray-400">
                <Shield size={14} className="text-green-500" />
                Conta Verificada
              </div>
            </div>
          </motion.div>
        </div>

        <div className="md:col-span-2">
          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSave}
            className="space-y-6 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Nome Completo
                </label>

                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />

                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 outline-none transition-all focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                  E-mail
                </label>

                <div className="relative opacity-60">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />

                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4 text-sm font-medium text-blue-700">
              A foto e o nome aparecem no seu perfil e na área lateral da plataforma.
            </div>

            <div className="flex justify-end border-t border-gray-50 pt-4">
              <button
                type="submit"
                disabled={loading || uploadingAvatar}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-8 py-3.5 font-bold text-white transition-all active:scale-95 disabled:cursor-not-allowed',
                  success
                    ? 'bg-green-500'
                    : 'bg-blue-600 shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-blue-300'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Salvando...
                  </>
                ) : success ? (
                  <>
                    <Check size={20} />
                    Salvo!
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default Profile;