import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Facebook,
  Instagram,
  Link2,
  Loader2,
  Music2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  Youtube,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type ViralProfile = {
  id: string;
  url: string;
  network: string;
  handle: string;
  name: string;
  avatarUrl?: string;
  followers?: string;
  niche?: string;
  notes?: string;
  createdAt?: string;
};

const NETWORK_LABEL: Record<string, { label: string; icon: any; color: string }> = {
  tiktok: { label: 'TikTok', icon: Music2, color: 'text-rose-400' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-fuchsia-400' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-400' },
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-400' },
  outro: { label: 'Outro', icon: Link2, color: 'text-slate-400' },
};

const ViralProfiles: React.FC = () => {
  const { isAdmin } = useAuth();

  const [profiles, setProfiles] = useState<ViralProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [url, setUrl] = useState('');
  const [niche, setNiche] = useState('');
  const [notes, setNotes] = useState('');
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [preview, setPreview] = useState<{
    network: string;
    handle: string;
    name: string;
    avatarUrl: string;
    followers?: string;
    notice?: string;
    needsManualAvatar: boolean;
  } | null>(null);

  const [avatarOverride, setAvatarOverride] = useState('');
  const [nameOverride, setNameOverride] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('viral_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      console.error(error);
      setProfiles([]);
      return;
    }

    setProfiles(data || []);
  };

  const callFetch = async () => {
    if (!url.trim() || fetching) return;

    setFetching(true);
    setMessage(null);
    setPreview(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || '';

      const response = await fetch('/api/agents/perfis-virais', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Nao consegui analisar esse link.');
      }

      setPreview(data);
      setNameOverride(data.name || '');
      setAvatarOverride(data.avatarUrl || '');
      setNotes((current) => (current.trim() ? current : data.followers || ''));
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao analisar o link.' });
    } finally {
      setFetching(false);
    }
  };

  const saveProfile = async () => {
    if (!preview) return;

    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        url: preview.handle
          ? url.trim()
          : url.trim(),
        network: preview.network,
        handle: preview.handle,
        name: nameOverride.trim() || preview.name || preview.handle,
        avatarUrl: avatarOverride.trim(),
        followers: preview.followers || '',
        niche: niche.trim(),
        notes: notes.trim(),
        created_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase.from('viral_profiles').update(payload).eq('id', editingId);

        if (error) throw new Error(error.message || 'Erro ao atualizar o perfil.');
      } else {
        const { error } = await supabase.from('viral_profiles').insert([payload]);

        if (error) throw new Error(error.message || 'Erro ao salvar o perfil.');
      }

      setMessage({ type: 'success', text: editingId ? 'Perfil atualizado.' : 'Perfil adicionado.' });

      setPreview(null);
      setUrl('');
      setNiche('');
      setNotes('');
      setAvatarOverride('');
      setNameOverride('');
      setEditingId(null);

      await loadProfiles();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (profile: ViralProfile) => {
    setEditingId(profile.id);
    setUrl(profile.url);
    setNiche(profile.niche || '');
    setNotes(profile.notes || '');
    setNameOverride(profile.name || '');
    setAvatarOverride(profile.avatarUrl || '');
    setPreview({
      network: profile.network,
      handle: profile.handle,
      name: profile.name,
      avatarUrl: profile.avatarUrl || '',
      followers: profile.followers || '',
      needsManualAvatar: profile.network === 'instagram',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeProfile = async (profile: ViralProfile) => {
    if (!confirm(`Remover o perfil @${profile.handle}?`)) return;

    const { error } = await supabase.from('viral_profiles').delete().eq('id', profile.id);

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao remover o perfil.' });
      return;
    }

    setMessage({ type: 'success', text: 'Perfil removido.' });
    await loadProfiles();
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-rose-500 text-white shadow-lg shadow-fuchsia-950/60">
            <Users size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Perfis Virais</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Biblioteca de perfis com nichos que estao viralizando. Cole o link e o sistema puxa nome e foto
              quando a rede permite.
            </p>
          </div>
        </header>

        {message && (
          <div
            className={`mt-6 flex items-start gap-2 rounded-2xl border p-4 text-sm font-semibold ${
              message.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                : 'border-red-500/40 bg-red-950/40 text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Cadastro (admin) */}
        {isAdmin && (
          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-300">
              <Plus size={16} className="text-fuchsia-400" />
              {editingId ? 'Editar perfil' : 'Adicionar perfil'}
            </h2>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.facebook.com/profile.php?id=... , tiktok.com/@perfil ou instagram.com/perfil"
                className="h-12 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-white outline-none focus:border-fuchsia-500"
              />

              <button
                type="button"
                onClick={callFetch}
                disabled={fetching || !url.trim()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-5 text-sm font-black text-white transition hover:bg-fuchsia-500 disabled:opacity-50"
              >
                {fetching ? <Loader2 size={17} className="animate-spin" /> : <Link2 size={17} />}
                {fetching ? 'Analisando...' : 'Puxar dados'}
              </button>
            </div>

            {preview && (
              <div className="mt-5 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-800 ring-2 ring-fuchsia-500/40">
                    {avatarOverride ? (
                      <img
                        src={avatarOverride}
                        alt={nameOverride}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          (event.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-black text-slate-500">
                        {(nameOverride || preview.handle).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-white">
                        {nameOverride || preview.handle}
                      </span>
                      <span className="text-xs font-bold text-slate-500">@{preview.handle}</span>
                      <span className={`text-xs font-bold ${NETWORK_LABEL[preview.network]?.color || 'text-slate-400'}`}>
                        {NETWORK_LABEL[preview.network]?.label || 'Rede'}
                      </span>
                    </div>

                    {preview.followers && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-300">
                        <Users size={12} className="text-fuchsia-400" />
                        {preview.followers}
                      </p>
                    )}

                    {preview.notice && (
                      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-amber-300/80">
                        {preview.notice}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={nameOverride}
                    onChange={(event) => setNameOverride(event.target.value)}
                    placeholder="Nome do perfil"
                    className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-fuchsia-500"
                  />

                  <input
                    type="url"
                    value={avatarOverride}
                    onChange={(event) => setAvatarOverride(event.target.value)}
                    placeholder="Link da foto (opcional)"
                    className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-fuchsia-500"
                  />

                  <input
                    type="text"
                    value={niche}
                    onChange={(event) => setNiche(event.target.value)}
                    placeholder="Nicho (ex: limpeza, gordos, novela)"
                    className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-fuchsia-500"
                  />

                  <input
                    type="text"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Observacao (ex: 2M seguidores, formato de gancho)"
                    className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-fuchsia-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-black uppercase tracking-wide text-black transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    {editingId ? 'Salvar alteracoes' : 'Adicionar a lista'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setEditingId(null);
                      setUrl('');
                      setNiche('');
                      setNotes('');
                      setAvatarOverride('');
                      setNameOverride('');
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Lista */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
              Perfis salvos ({profiles.length})
            </h2>

            <button
              type="button"
              onClick={loadProfiles}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-xs font-bold text-slate-300 transition hover:bg-slate-800 disabled:opacity-60"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">Carregando perfis...</p>
          ) : profiles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 p-10 text-center">
              <Users size={40} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-bold text-slate-400">Nenhum perfil salvo ainda.</p>
              <p className="mt-1 text-xs text-slate-500">
                {isAdmin ? 'Cole um link acima para comecar.' : 'O administrador ainda nao adicionou perfis.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => {
                const meta = NETWORK_LABEL[profile.network] || NETWORK_LABEL.outro;
                const Icon = meta.icon;

                return (
                  <article
                    key={profile.id}
                    className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg transition hover:border-fuchsia-500/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-800">
                        {profile.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt={profile.name}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              (event.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-black text-slate-500">
                            {(profile.name || profile.handle).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{profile.name || profile.handle}</p>
                        <p className="flex items-center gap-1 truncate text-xs font-semibold text-slate-500">
                          <Icon size={12} className={meta.color} />
                          @{profile.handle}
                        </p>
                        {profile.followers && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-slate-300">
                            <Users size={11} className="text-fuchsia-400" />
                            {profile.followers}
                          </p>
                        )}
                      </div>
                    </div>

                    {profile.niche && (
                      <span className="mt-3 w-fit rounded-full bg-fuchsia-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-fuchsia-300">
                        {profile.niche}
                      </span>
                    )}

                    {profile.notes && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-400">{profile.notes}</p>
                    )}

                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
                      >
                        <ExternalLink size={13} />
                        Abrir perfil
                      </a>

                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(profile)}
                            className="rounded-xl border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeProfile(profile)}
                            className="rounded-xl border border-slate-700 p-2 text-slate-400 transition hover:bg-red-950 hover:text-red-300"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ViralProfiles;