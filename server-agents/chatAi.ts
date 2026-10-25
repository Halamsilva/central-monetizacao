import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getGeminiApiKeyCandidates, describeGeminiError } from './gemini-key.js';

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
];

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

const OPENROUTER_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemini-2.0-flash-exp:free',
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

type AttemptResult = { streamed: boolean; error: string };

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

// Le o corpo em SSE aceitando tanto \n\n quanto \r\n\r\n e processando o ultimo
// bloco que sobra no buffer (o Gemini manda CRLF, o que quebrava o parser antigo).
const readSseText = async (
  body: ReadableStream<Uint8Array>,
  extract: (payload: any) => string,
  onText: (text: string) => void
) => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleBlock = (block: string) => {
    for (const line of block.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue;

      const raw = line.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;

      try {
        const text = extract(JSON.parse(raw));
        if (text) onText(text);
      } catch {
        // eventos parciais / keep-alive
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    blocks.forEach(handleBlock);
  }

  if (buffer.trim()) handleBlock(buffer);
};

const streamGemini = async (
  apiKey: string,
  model: string,
  turns: ChatTurn[],
  onText: (text: string) => void
): Promise<AttemptResult> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: turns.map((turn) => ({
            role: turn.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: turn.content }],
          })),
          generationConfig: { temperature: 0.8, topP: 0.95, maxOutputTokens: 4096 },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => '');
      console.warn(`[chat] gemini ${model} falhou: ${response.status} ${detail.slice(0, 160)}`);
      return { streamed: false, error: `${response.status} ${detail.slice(0, 200)}` };
    }

    let streamed = false;

    await readSseText(
      response.body,
      (payload) =>
        (payload?.candidates?.[0]?.content?.parts || []).map((part: any) => part?.text || '').join(''),
      (text) => {
        streamed = true;
        onText(text);
      }
    );

    return { streamed, error: streamed ? '' : 'Resposta vazia do Gemini.' };
  } catch (err: any) {
    console.warn(`[chat] gemini ${model} erro:`, String(err?.message || err).slice(0, 160));
    return { streamed: false, error: String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
};

const streamOpenAiCompatible = async (
  provider: 'groq' | 'openrouter',
  apiKey: string,
  model: string,
  turns: ChatTurn[],
  onText: (text: string) => void
): Promise<AttemptResult> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);

  const baseUrl = provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://openrouter.ai/api/v1';

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(provider === 'openrouter'
          ? { 'HTTP-Referer': 'https://www.halamsilva.com.br', 'X-Title': 'Central Monetizacao' }
          : {}),
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.8,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...turns.map((turn) => ({ role: turn.role, content: turn.content })),
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => '');
      console.warn(`[chat] ${provider} ${model} falhou: ${response.status} ${detail.slice(0, 160)}`);
      return { streamed: false, error: `${response.status} ${detail.slice(0, 200)}` };
    }

    let streamed = false;

    await readSseText(
      response.body,
      (payload) => payload?.choices?.[0]?.delta?.content || '',
      (text) => {
        streamed = true;
        onText(text);
      }
    );

    return { streamed, error: streamed ? '' : `Resposta vazia do ${provider}.` };
  } catch (err: any) {
    console.warn(`[chat] ${provider} ${model} erro:`, String(err?.message || err).slice(0, 160));
    return { streamed: false, error: String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
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

  const geminiKeys = await getGeminiApiKeyCandidates(serviceSupabase, user.id);
  const groqKey = String(process.env.GROQ_API_KEY || '').trim();
  const openrouterKey = String(process.env.OPENROUTER_API_KEY || '').trim();

  if (!geminiKeys.length && !groqKey && !openrouterKey) {
    return res.status(400).json({
      error:
        'Nenhum provedor de IA configurado. Cadastre sua chave do Google AI Studio em Configuracoes ou peca ao admin para configurar Groq/OpenRouter.',
    });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let lastError = '';

  const send = (payload: unknown) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      // cliente desconectou
    }
  };

  const onText = (text: string) => send({ text });

  const finish = () => {
    send('[DONE]');
    res.end();
  };

  // 1) Gemini (chave do aluno, chave da plataforma ou variavel de ambiente).
  for (const apiKey of geminiKeys) {
    for (const model of GEMINI_MODELS) {
      const result = await streamGemini(apiKey, model, turns, onText);
      if (result.streamed) return finish();
      lastError = result.error || lastError;
    }
  }

  // 2) Groq (OpenAI compativel, tier gratuito rapido).
  if (groqKey) {
    for (const model of GROQ_MODELS) {
      const result = await streamOpenAiCompatible('groq', groqKey, model, turns, onText);
      if (result.streamed) return finish();
      lastError = result.error || lastError;
    }
  }

  // 3) OpenRouter (modelos :free).
  if (openrouterKey) {
    for (const model of OPENROUTER_MODELS) {
      const result = await streamOpenAiCompatible('openrouter', openrouterKey, model, turns, onText);
      if (result.streamed) return finish();
      lastError = result.error || lastError;
    }
  }

  const friendly = describeGeminiError(new Error(lastError || 'Nenhum provedor respondeu.'));
  send({ error: friendly.message });
  res.end();
}
