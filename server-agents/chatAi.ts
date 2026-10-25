import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getGeminiApiKeyCandidates, describeGeminiError } from './gemini-key.js';

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

const MODELS = [
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
];

const SYSTEM_PROMPT = `Voce e o Assistente da Central Monetizacao, um consultor de conteudo viral para criadores brasileiros.

Regras:
- Responda sempre em portugues do Brasil, direto ao ponto, sem enrolacao.
- Voce ajuda a criar roteiros, novelinhas, ganchos, prompts de video, legendas, hashtags, ideias e estrategias de monetizacao.
- Quando o pedido for um roteiro, use formato de cenas (Cena 1, Cena 2...), com fala, acao e duracao.
- Quando o pedido for prompt de video, escreva em ingles tecnico (e o que as IAs de video entendem melhor), com camera, luz, movimento e formato 9:16.
- Se faltar contexto (tema, produto, personagem), faca no maximo 1 pergunta curta OU entregue uma versao generica ja pronta e pergunte se quer ajustar.
- Nao invente dados, numeros ou promessas de resultado. Seja honesto sobre limitacoes.
- Use listas curtas e negrito para destacar o que importa. Nunca use emojis.`;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

const clean = (value: unknown, max = 200) => String(value || '').trim().slice(0, max);

const normalizeTurns = (input: unknown): ChatTurn[] => {
  if (!Array.isArray(input)) return [];

  return input
    .slice(-30)
    .map((item: any) => {
      const role = item?.role === 'assistant' || item?.role === 'model' ? 'assistant' : 'user';
      const content = clean(item?.content, 8000);

      return content ? { role: role as ChatTurn['role'], content } : null;
    })
    .filter(Boolean) as ChatTurn[];
};

const buildContents = (turns: ChatTurn[]) =>
  turns.map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  }));

const checkAccess = async (serviceSupabase: any, req: any, res: any) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: 'Sessao invalida. Faca login novamente.' });
    return null;
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    res.status(500).json({ error: 'Erro ao conferir acesso.' });
    return null;
  }

  const canUse =
    profile?.role === 'admin' || (profile?.role === 'student' && profile?.access_status === 'active');

  if (!canUse) {
    res.status(403).json({ error: 'Acesso ainda nao liberado.' });
    return null;
  }

  return user;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();

  if (!serviceSupabase) {
    return res.status(500).json({ error: 'Servico indisponivel.' });
  }

  const user = await checkAccess(serviceSupabase, req, res);
  if (!user) return;

  const turns = normalizeTurns(req.body?.messages);

  if (!turns.length || turns[turns.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Escreva uma mensagem para o chat.' });
  }

  const apiKeys = await getGeminiApiKeyCandidates(serviceSupabase, user.id);

  if (!apiKeys.length) {
    return res.status(400).json({
      error:
        'Nenhuma chave de IA disponivel. Cadastre sua chave do Google AI Studio em Configuracoes para usar o chat.',
    });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let lastError = '';
  let wroteAny = false;

  const send = (payload: unknown) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      // cliente desconectou
    }
  };

  for (const apiKey of apiKeys) {
    for (const model of MODELS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 110000);
      let streamedThisTry = false;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: buildContents(turns),
              generationConfig: { temperature: 0.8, topP: 0.95, maxOutputTokens: 4096 },
            }),
            signal: controller.signal,
          }
        );

        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => '');
          lastError = `${response.status} ${detail.slice(0, 300)}`;
          clearTimeout(timer);
          continue;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const event of events) {
            const dataLine = event.split('\n').find((line) => line.startsWith('data: '));
            if (!dataLine) continue;

            const raw = dataLine.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;

            try {
              const parsed = JSON.parse(raw);
              const text = (parsed?.candidates?.[0]?.content?.parts || [])
                .map((part: any) => part?.text || '')
                .join('');

              if (text) {
                streamedThisTry = true;
                wroteAny = true;
                send({ text });
              }
            } catch {
              // ignora eventos parciais
            }
          }
        }

        clearTimeout(timer);

        if (streamedThisTry) {
          send('[DONE]');
          res.end();
          return;
        }

        lastError = 'Resposta vazia do modelo.';
      } catch (err: any) {
        clearTimeout(timer);
        lastError = String(err?.message || err);

        if (streamedThisTry || wroteAny) {
          send({ error: 'A conexao caiu no meio da resposta. Tente novamente.' });
          res.end();
          return;
        }
      }
    }
  }

  const friendly = describeGeminiError(new Error(lastError));
  send({ error: friendly.message });
  res.end();
}
