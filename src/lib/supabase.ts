import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseUrl !== '';

const finalUrl = isSupabaseConfigured
  ? supabaseUrl
  : 'https://placeholder-app.supabase.co';

const finalKey = isSupabaseConfigured
  ? supabaseAnonKey
  : 'placeholder-anon-key';

export const supabase = createClient(finalUrl, finalKey);

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_admin?: boolean;
  role?: 'admin' | 'student';
  access_status?: 'pending' | 'active' | 'blocked';
  approved_at?: string | null;
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

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

export interface GenerationJob {
  id: string;
  user_id: string;
  type: 'video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  model: string;
  result_url?: string | null;
  metadata: Record<string, any>;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationWorkerStatus {
  id: string;
  status: 'online' | 'offline' | 'working';
  message?: string | null;
  flow_project_url?: string | null;
  current_job_id?: string | null;
  online_until?: string | null;
  updated_at: string;
}
