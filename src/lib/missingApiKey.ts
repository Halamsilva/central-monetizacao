export const MISSING_API_KEY_EVENT = 'halamsilva:missing-api-key';
export const QUOTA_EXCEEDED_EVENT = 'halamsilva:quota-exceeded';

const MISSING_API_KEY_MARKERS = ['ia nao configurada'];

const QUOTA_MARKERS = [
  'limite de uso da ia',
  'limite de ia',
  'limite de uso',
  'cota diaria',
  'cota',
  'quota',
  'resource_exhausted',
  'insufficient account funds',
  'exceeded your current quota',
];

const includesAnyMarker = (raw: string, markers: string[]) => {
  const normalized = raw.toLowerCase();
  return markers.some((marker) => normalized.includes(marker));
};

const stringifyPayload = (payload: unknown) => {
  if (!payload) return '';

  if (typeof payload === 'string') return payload;

  try {
    return JSON.stringify(payload);
  } catch {
    return '';
  }
};

// Para cota, olhamos SOMENTE a mensagem que o usuario ve (error/message).
// O campo "detail" traz o texto cru do Google e podia conter "429" em erros que
// nao eram de cota, causando falso positivo no aviso.
const messageOnly = (payload: unknown) => {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;

  try {
    const record = payload as Record<string, unknown>;
    const message = record.error || record.message;

    if (typeof message === 'string' && message.trim()) return message;
  } catch {
    return '';
  }

  return stringifyPayload(payload);
};

export const isMissingApiKeyPayload = (payload: unknown) =>
  includesAnyMarker(stringifyPayload(payload), MISSING_API_KEY_MARKERS);

export const isQuotaExceededPayload = (payload: unknown) =>
  includesAnyMarker(messageOnly(payload), QUOTA_MARKERS);

const dispatch = (eventName: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(eventName));
};

export const notifyMissingApiKey = () => dispatch(MISSING_API_KEY_EVENT);
export const notifyQuotaExceeded = () => dispatch(QUOTA_EXCEEDED_EVENT);

const EDGE_TIMEOUT_EVENT = 'halamsilva:edge-timeout';

const isEdgeTimeoutStatus = (status: number) => status === 524 || status === 502 || status === 504;

export const notifyEdgeTimeout = () => dispatch(EDGE_TIMEOUT_EVENT);

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
        if (isEdgeTimeoutStatus(response.status)) {
          notifyEdgeTimeout();
          return response;
        }

        response
          .clone()
          .json()
          .then((payload) => {
            if (isMissingApiKeyPayload(payload)) {
              notifyMissingApiKey();
              return;
            }

            if (isQuotaExceededPayload(payload)) {
              notifyQuotaExceeded();
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