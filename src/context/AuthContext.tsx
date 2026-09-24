import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, UserProfile, isSupabaseConfigured, type AppUser } from '../lib/supabase';

interface AuthContextType {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);
  const profileRef = useRef<UserProfile | null>(null);
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'silvahalam@gmail.com').toLowerCase();

  const setCurrentUser = (currentUser: AppUser | null) => {
    userIdRef.current = currentUser?.id ?? null;
    setUser(currentUser);
  };

  const setCurrentProfile = (currentProfile: UserProfile | null) => {
    profileRef.current = currentProfile;
    setProfile(currentProfile);
  };

  const syncKiwifyAccess = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) return null;

      const response = await fetch('/api/access/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return null;

      return response.json();
    } catch (err) {
      console.error('Erro ao sincronizar acesso Kiwify:', err);
      return null;
    }
  };

  const loadProfile = async (currentUser: AppUser) => {
    try {
      await syncKiwifyAccess();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
      }

      if (data) {
        if (currentUser.emailVerified && currentUser.email?.toLowerCase() === adminEmail && data.role !== 'admin') {
          const { error: promotionError } = await supabase.from('profiles').update({
            role: 'admin', is_admin: true, access_status: 'active',
          }).eq('id', currentUser.id);
          if (!promotionError) {
            setCurrentProfile({ ...data, role: 'admin', is_admin: true, access_status: 'active' });
            return;
          }
          console.error('Erro ao ativar administrador verificado:', promotionError);
        }
        setCurrentProfile(data);
        return;
      }

      const isBootstrapAdmin = currentUser.emailVerified && currentUser.email?.toLowerCase() === adminEmail;
      const newProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name:
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split('@')[0] ||
          'Usuário',
        avatar_url: null,
        is_admin: isBootstrapAdmin,
        role: isBootstrapAdmin ? 'admin' : 'student',
        access_status: isBootstrapAdmin ? 'active' : 'pending',
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile);

      if (insertError) {
        console.error('Erro ao criar perfil:', insertError);
        setCurrentProfile(null);
        return;
      }

      await syncKiwifyAccess();

      const { data: refreshedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (refreshedProfile) {
        setCurrentProfile(refreshedProfile);
        return;
      }

      setCurrentProfile(null);
    } catch (err) {
      console.error('Falha geral ao carregar perfil:', err);

      setCurrentProfile(null);
    }
  };

  const initAuth = async () => {
    try {
      if (!isSupabaseConfigured) {
        setCurrentUser(null);
        setCurrentProfile(null);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;

      setCurrentUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setCurrentProfile(null);
      }
    } catch (err) {
      console.error('Erro ao iniciar autenticação:', err);
      setCurrentUser(null);
      setCurrentProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // initAuth already handles the initial session. Token refreshes do not
      // change the profile and must not trigger another Kiwify synchronization.
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;

      const currentUser = session?.user ?? null;
      const isSameUser = Boolean(currentUser?.id && currentUser.id === userIdRef.current);
      const hasProfileLoaded = Boolean(profileRef.current);

      setCurrentUser(currentUser);

      if (!currentUser) {
        setCurrentProfile(null);
        setLoading(false);
        return;
      }

      if (isSameUser && hasProfileLoaded) {
        return;
      }

      setLoading(true);

      setTimeout(async () => {
        await loadProfile(currentUser);
        setLoading(false);
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: Boolean(user?.emailVerified && user.email?.toLowerCase() === adminEmail && profile?.role === 'admin'),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
