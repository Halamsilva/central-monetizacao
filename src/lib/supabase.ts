import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mocking some data for when Supabase is not connected
// We check if it's the default placeholder from .env.example or empty
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseUrl !== '';

// Use a placeholder if not configured to prevent "supabaseUrl is required" crash
const finalUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-app.supabase.co';
const finalKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(finalUrl, finalKey);

// Types based on the required schema
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  tag: 'NOVO' | 'ATUALIZADO' | 'PREMIUM' | 'EXCLUSIVO';
  is_published: boolean;
  external_link?: string;
  download_link?: string;
  created_at: string;
  updated_at: string;
}

export interface Download {
  id: string;
  title: string;
  description: string;
  file_url: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

export interface Update {
  id: string;
  title: string;
  content: string;
  version: string;
  is_published: boolean;
  created_at: string;
}
