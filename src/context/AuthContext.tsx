import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const loadProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
      }

      if (data) {
        setProfile(data);
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

      setProfile(newProfile);
    } catch (err) {
      console.error('Falha geral ao carregar perfil:', err);

      setProfile({
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
        setUser(null);
        setProfile(null);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Erro ao iniciar autenticação:', err);
      setUser(null);
      setProfile(null);
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

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
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
    setUser(null);
    setProfile(null);
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