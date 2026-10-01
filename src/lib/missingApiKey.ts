export const MISSING_API_KEY_EVENT = 'halamsilva:missing-api-key';

const MISSING_API_KEY_MARKERS = ['ia nao configurada'];

export const isMissingApiKeyPayload = (payload: unknown) => {
  if (!payload) return false;

  let raw = '';

  if (typeof payload === 'string') {
    raw = payload;
  } else {
    try {
      raw = JSON.stringify(payload);
    } catch {
      return false;
    }
  }

  const normalized = raw.toLowerCase();

  return MISSING_API_KEY_MARKERS.some((marker) => normalized.includes(marker));
};

export const notifyMissingApiKey = () => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(MISSING_API_KEY_EVENT));
};

export const installMissingApiKeyWatcher = () => {
  if (typeof window === 'undefined') return;

  const globalScope = window as typeof window & {
    __halamsilvaMissingApiKeyWatcher?: boolean;
  };

  if (globalScope.__halamsilvaMissingApiKeyWatcher) return;
  globalScope.__halamsilvaMissingApiKeyWatcher = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);

    try {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input?.url ?? '');

      if (url.includes('/api/agents/')) {
        response
          .clone()
          .json()
          .then((payload) => {
            if (isMissingApiKeyPayload(payload)) {
              notifyMissingApiKey();
            }
          })
          .catch(() => undefined);
      }
    } catch {
      // Nunca interrompe a requisição por causa da checagem.
    }

    return response;
  };
};