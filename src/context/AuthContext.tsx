import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserProfile, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);
  const profileRef = useRef<UserProfile | null>(null);

  const setCurrentUser = (currentUser: User | null) => {
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

  const loadProfile = async (currentUser: User) => {
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
        setCurrentProfile(data);
        return;
      }

      const newProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.email?.split('@')[0] || 'Usuário',
        avatar_url: null,
        is_admin: false,
        role: 'student',
        access_status: 'pending',
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile);

      if (insertError) {
        console.error('Erro ao criar perfil:', insertError);
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

      setCurrentProfile(newProfile);
    } catch (err) {
      console.error('Falha geral ao carregar perfil:', err);

      setCurrentProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.email?.split('@')[0] || 'Usuário',
        avatar_url: null,
        is_admin: false,
        role: 'student',
        access_status: 'pending',
        created_at: new Date().toISOString(),
      });
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
        loadProfile(currentUser);
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
        isAdmin: profile?.role === 'admin',
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
