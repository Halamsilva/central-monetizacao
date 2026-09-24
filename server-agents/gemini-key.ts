import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const cleanApiKey = (value: unknown) => String(value || '').trim();

export const maskGeminiApiKey = (value: unknown) => {
  const apiKey = cleanApiKey(value);
  if (!apiKey) return '';

  if (apiKey.length <= 10) return `${apiKey.slice(0, 2)}...${apiKey.slice(-2)}`;

  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
};

export const getStoredGeminiApiKey = async (serviceSupabase?: any) => {
  const supabase = serviceSupabase || getServiceSupabase();
  if (!supabase) return '';

  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'gemini_api_key')
    .maybeSingle();

  if (error) {
    const missingSettingsTable =
      ['PGRST205', '42P01'].includes(error.code) ||
      String(error.message || '').includes('app_settings');

    if (!missingSettingsTable) return '';

    const { data: fallback, error: fallbackError } = await supabase
      .from('agents')
      .select('prompt')
      .eq('category', '__system')
      .eq('title', '__app_setting:gemini_api_key')
      .maybeSingle();

    if (fallbackError || !fallback?.prompt) return '';

    try {
      return cleanApiKey(JSON.parse(fallback.prompt)?.apiKey);
    } catch {
      return '';
    }
  }

  return cleanApiKey(data?.value?.apiKey);
};

export const getActiveGeminiApiKey = async (serviceSupabase?: any) => {
  const storedKey = await getStoredGeminiApiKey(serviceSupabase);
  return storedKey || cleanApiKey(process.env.GEMINI_API_KEY);
};
