import { GoogleGenAI, Type } from '@google/genai';
import { getActiveGeminiApiKey } from './gemini-key.js';
import { createServiceClient, isFirebaseAdminConfigured, isVerifiedOwner } from '../api/_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const clean = (value: unknown, maxLength = 300) =>
  String(value || '').trim().slice(0, maxLength);

const slugifyKey = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

const checkAdmin = async (serviceSupabase: any, token?: string) => {
  if (!token) return { ok: false as const, status: 401, error: 'Sessao expirada. Faca login novamente.' };

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    return { ok: false as const, status: 401, error: 'Sessao invalida. Faca login novamente.' };
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false as const, status: 500, error: 'Nao foi possivel conferir a permissao.' };
  }

  if (!profile || profile.role !== 'admin' || profile.access_status === 'blocked') {
    return { ok: false as const, status: 403, error: 'Apenas administradores podem importar agentes.' };
  }

  return { ok: true as const, user };
};

const INSTRUCTION = `Voce vai configurar um "agente interno" de uma plataforma de alunos a partir do codigo-fonte de um app do Google AI Studio (React + servidor Gemini).

Abaixo estao os arquivos do projeto (podem estar resumidos). Sua tarefa:
1. Entenda o que o app/agente faz (papel, objetivo, o que o usuario envia e o que ele devolve).
2. Escreva um "masterPrompt" completo EM PORTUGUES DO BRASIL: as instrucoes que um modelo Gemini deve seguir para reproduzir o comportamento do agente. Deve ser autossuficiente (papel, objetivo, formato exato da saida, regras, restricoes).
3. Defina os "campos" que o aluno preenche (de 1 a 5), no formato { key, label, type, required, placeholder, options }:
   - key: curta, minuscula, sem acento (ex: "produto", "idioma").
   - type: "text", "textarea" ou "select".
   - options: apenas para "select".
   - placeholder: uma dica curta em portugues.
4. Sugira title (curto), description (1-2 frases), category e outputTitle.

IMPORTANTE:
- O agente interno so recebe TEXTO e, opcionalmente, UMA IMAGEM. Ele NAO recebe video nem arquivos.
- Se o app original recebia VIDEO, adapte o masterPrompt para trabalhar a partir de uma DESCRICAO textual do video (cenas, personagens, falas, acao), deixando claro que o aluno cola a descricao.
- Nao invente recursos que o agente nao tem.
- Responda SOMENTE com JSON valido no formato pedido.`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({ error: 'Servico indisponivel.' });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const admin = await checkAdmin(serviceSupabase, token);
  if (!admin.ok) {
    return res.status(admin.status).json({ error: admin.error });
  }

  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  if (!files.length) {
    return res.status(400).json({ error: 'Nao recebi os arquivos do zip.' });
  }

  const apiKey = await getActiveGeminiApiKey(serviceSupabase, admin.user.id);
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY nao esta configurada.' });
  }

  let corpus = '';
  for (const file of files.slice(0, 40)) {
    const path = clean(file?.path, 200);
    const content = String(file?.content || '').slice(0, 14000);
    if (!content.trim()) continue;
    corpus += `\n\n===== ARQUIVO: ${path} =====\n${content}`;
    if (corpus.length > 130000) break;
  }

  if (!corpus.trim()) {
    return res.status(400).json({ error: 'Nao consegui ler o conteudo do zip.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: `${INSTRUCTION}\n\n${corpus}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            masterPrompt: { type: Type.STRING },
            outputTitle: { type: Type.STRING },
            acceptsImage: { type: Type.BOOLEAN },
            fields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: { type: Type.STRING },
                  required: { type: Type.BOOLEAN },
                  placeholder: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['key', 'label', 'type'],
              },
            },
          },
          required: ['title', 'description', 'masterPrompt', 'fields'],
        },
      },
    });

    const parsed = JSON.parse(result.text || '{}');
    const validTypes = ['text', 'textarea', 'select'];
    const fields = (Array.isArray(parsed.fields) ? parsed.fields : [])
      .map((field: any) => ({
        key: slugifyKey(field?.key || field?.label),
        label: clean(field?.label, 80) || 'Campo',
        type: validTypes.includes(field?.type) ? field.type : 'textarea',
        required: field?.required === true,
        placeholder: clean(field?.placeholder, 200) || undefined,
        options: Array.isArray(field?.options)
          ? field.options.map((option: unknown) => clean(option, 60)).filter(Boolean).slice(0, 20)
          : undefined,
      }))
      .filter((field: any) => field.key)
      .slice(0, 5);

    if (!fields.length) {
      fields.push({
        key: 'entrada',
        label: 'O que voce quer gerar',
        type: 'textarea',
        required: true,
        placeholder: 'Descreva o que voce precisa...',
      });
    }

    return res.status(200).json({
      ok: true,
      agent: {
        title: clean(parsed.title, 80) || 'Agente importado',
        description: clean(parsed.description, 400),
        category: clean(parsed.category, 60) || 'Agentes',
        masterPrompt: String(parsed.masterPrompt || '').trim(),
        fields,
        acceptsImage: parsed.acceptsImage === true,
        outputTitle: clean(parsed.outputTitle, 60) || 'Resultado gerado',
      },
    });
  } catch (error: any) {
    console.error('Import agent error:', error);
    return res.status(500).json({ error: 'Nao consegui montar o agente agora. Tente novamente.' });
  }
}
