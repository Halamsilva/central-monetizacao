import { supabase } from '../../lib/supabase';
import { describeHttpError } from '../../lib/httpError';

export const callLimpezaAgent = async (action: string, payload: Record<string, unknown> = {}) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || '';

  const response = await fetch('/api/agents/limpeza', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...payload, action }),
  });

  if (!response.ok) {
    throw new Error(await describeHttpError(response));
  }

  return response.json();
};
