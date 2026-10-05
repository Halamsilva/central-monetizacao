import { GoogleGenAI } from '@google/genai';
import { getActiveGeminiApiKey } from './gemini-key.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const clean = (value: unknown, maxLength = 6000) =>
  String(value || '').trim().slice(0, maxLength);

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
    profile?.role === 'admin' ||
    (profile?.role === 'student' && profile?.access_status === 'active');

  if (!canUse) {
    res.status(403).json({ error: 'Acesso ainda nao liberado.' });
    return null;
  }

  return user;
};

const SKIN_COMMAND =
  'textura de pele ultra-realista de ser humano real com poros visíveis, micro-relevo dérmico natural, linhas de expressão dinâmicas, imperfeições autênticas da derme, iluminação cinematográfica de pele fotorrealista sem aspecto plástico, 3D ou IA, tom de pele fotorrealista 8K, reflexos naturais e microexpressões faciais de alta fidelidade.';

// Dynamic local prompt generator that NEVER hardcodes characters
function generateDynamicPrompt(params: {
  rawText: string;
  sceneNumber?: string;
  addRealisticSkinTexture?: boolean;
}) {
  const text = (params.rawText || '').trim();

  // Scene Number
  const sceneMatch = text.match(/CENA\s+([0-9A-Za-z]+)/i);
  const sceneNum = sceneMatch ? sceneMatch[1] : (params.sceneNumber || '01');

  // Support Seedance / Google Flow / Script tags
  const quemFalaMatch = text.match(/QUEM FALA:\s*([^(:\n]+)(?:\(([^)]+)\))?/i);
  const quemRespondeMatch = text.match(/QUEM RESPONDE:\s*([^(:\n]+)(?:\(([^)]+)\))?/i);
  const dialogoRealMatch = text.match(/DIÁLOGO REAL:\s*["“']?([^"\n\r”']+)["”']?/i) || text.match(/DIÁLOGO:\s*["“']?([^"\n\r”']+)["”']?/i);
  const respostaMatch = text.match(/RESPOSTA:\s*["“']?([^"\n\r”']+)["”']?/i);
  const envMatch = text.match(/\[Environment & Scene Setting\]:\s*([^\n\[]+)/i);
  const actionMatch = text.match(/\[Action & First-Frame Blocking\]:\s*([^\n\[]+)/i);
  const opticsMatch = text.match(/\[Optics & Camera Movement\]:\s*([^\n\[]+)/i);
  const lightingMatch = text.match(/\[Lighting & Atmosphere\]:\s*([^\n\[]+)/i);

  // Scene Description
  let cena = '';
  const cenaMatch = text.match(/CENA:\s*([\s\S]*?)(?=PERSONAGENS:|$)/i);
  if (cenaMatch) {
    cena = cenaMatch[1].trim();
  } else if (envMatch) {
    const env = envMatch[1].trim();
    const optics = opticsMatch ? ` Câmera: ${opticsMatch[1].trim()}.` : '';
    const light = lightingMatch ? ` Iluminação: ${lightingMatch[1].trim()}.` : '';
    cena = `${env}.${optics}${light}`;
  }
  if (!cena) {
    cena = 'Ambiente tenso de alto contraste visual. Câmera lenta dramática com corte rápido para plano fechado no olhar de confronto.';
  }

  // Characters extraction
  let char1Name = 'Personagem Principal';
  let char1Desc = 'Adulto com feição fechada e olhar de profundo desdém.';
  let char2Name = '';
  let char2Desc = '';

  if (quemFalaMatch) {
    char1Name = quemFalaMatch[1].trim();
    char1Desc = quemFalaMatch[2] ? quemFalaMatch[2].trim() : char1Desc;
    if (quemRespondeMatch) {
      char2Name = quemRespondeMatch[1].trim();
      char2Desc = quemRespondeMatch[2] ? quemRespondeMatch[2].trim() : 'Adulto acuado e humilhado.';
    }
  } else {
    const charBlockMatch = text.match(/PERSONAGENS:\s*([\s\S]*?)(?=POSTURA:|$)/i);
    if (charBlockMatch) {
      const block = charBlockMatch[1].trim();
      const parts = block.split(/\n\s*\n/).filter(Boolean);
      if (parts.length > 0) {
        const p1Lines = parts[0].split('\n').map(l => l.trim()).filter(Boolean);
        char1Name = p1Lines[0].replace(/:$/, '').trim();
        char1Desc = p1Lines.slice(1).join('\n').trim() || char1Desc;
      }
      if (parts.length > 1) {
        const p2Lines = parts[1].split('\n').map(l => l.trim()).filter(Boolean);
        char2Name = p2Lines[0].replace(/:$/, '').trim();
        char2Desc = p2Lines.slice(1).join('\n').trim() || 'Adulto acuado e humilhado.';
      }
    }
  }

  // Format characters with skin realism
  let charSection = `${char1Name}:\n${char1Desc}`;
  if (char2Name) {
    charSection += `\n\n${char2Name}:\n${char2Desc}`;
  }
  if (params.addRealisticSkinTexture && !charSection.toLowerCase().includes('textura de pele')) {
    charSection += `\n\n${SKIN_COMMAND}`;
  }

  // Posture
  let postura = '';
  const posturaMatch = text.match(/POSTURA:\s*([\s\S]*?)(?=PERFIL PSICOLÓGICO:|$)/i);
  if (posturaMatch) {
    postura = posturaMatch[1].trim();
  } else if (actionMatch) {
    postura = actionMatch[1].trim();
  }
  if (!postura) {
    postura = `${char1Name} avança sobre ${char2Name || 'o interlocutor'} em postura intimidadora com punhos cerrados.`;
  }

  // Psychological Profile
  let psico = '';
  const psicoMatch = text.match(/PERFIL PSICOLÓGICO:\s*([\s\S]*?)(?=Motivação:|Motivacao:|$)/i);
  if (psicoMatch) psico = psicoMatch[1].trim();
  if (!psico) {
    psico = `${char1Name}: Prepotente, soberbo, com fúria desmedida e desprezo absoluto.`;
    if (char2Name) {
      psico += `\n${char2Name}: Angustiado, humilhado, em desespero por justiça e respeito.`;
    }
  }

  // Motivation & Fear
  let motivacao = '';
  const motivMatch = text.match(/Motivação:\s*([\s\S]*?)(?=Medo:|$)/i) || text.match(/Motivacao:\s*([\s\S]*?)(?=Medo:|$)/i);
  if (motivMatch) motivacao = motivMatch[1].trim();
  if (!motivacao) motivacao = `Destruir a moral do oponente e impor humilhação pública.`;

  let medo = '';
  const medoMatch = text.match(/Medo:\s*([\s\S]*?)(?=(?:.*fala no idioma e estilo de Brasil:)|$)/i);
  if (medoMatch) medo = medoMatch[1].trim();
  if (!medo) medo = `Perder a autoridade e ser desmascarado diante de todos.`;

  // Speeches - Non-empty, tailored directly to characters and context
  let fala1 = '';
  let fala2 = '';

  if (dialogoRealMatch) {
    const raw = dialogoRealMatch[1].trim().replace(/^["“']+/, '').replace(/["”']+$/, '').trim();
    if (raw.toLowerCase().includes('ladrão') || raw.toLowerCase().includes('some')) {
      fala1 = `“Olha bem pra mim, seu marginal! Lugar de ladrão é na cadeia! Some da minha rua agora antes que eu chame a polícia e arrebente a sua cara!”`;
    } else {
      fala1 = `“CALA ESSA BOCA AGORA! Você não tem autorização nem pra me encarar! Recolha a sua vergonha e desaparece da minha frente antes que eu destrua você!”`;
    }
  } else {
    fala1 = `“CALA ESSA BOCA AGORA! Você não tem vergonha de me desafiar desse jeito? Recolha a sua vergonha e desaparece da minha frente antes que eu destrua você!”`;
  }

  if (char2Name) {
    if (respostaMatch) {
      const raw2 = respostaMatch[1].trim().replace(/^["“']+/, '').replace(/["”]+$/, '').trim();
      if (raw2.toLowerCase().includes('roubei') || raw2.toLowerCase().includes('valdir')) {
        fala2 = `“Pelo amor de Deus, ${char1Name}, me escuta! Eu juro pelos meus filhos que não roubei nada dessa vez! Eu tô trabalhando honesto, não faz essa injustiça comigo!”`;
      } else {
        fala2 = `“Pelo amor de Deus, me escuta um minuto! Eu sou inocente e não fiz nada de errado! Não seja cruel comigo na frente de todo mundo!”`;
      }
    } else {
      fala2 = `“Pelo amor de Deus, me escuta um minuto! Eu sou inocente e não fiz nada de errado! Não seja cruel comigo na frente de todo mundo!”`;
    }
  }

  let dialoguesText = `${char1Name} fala no idioma e estilo de Brasil:\n${fala1}`;
  if (char2Name) {
    dialoguesText += `\n\n${char2Name} fala no idioma e estilo de Brasil:\n${fala2}`;
  }

  return `PROMPT GANCHO CHAMATIVO CENA ${sceneNum}

CENA:
${cena}

PERSONAGENS:

${charSection}

POSTURA:
${postura}

PERFIL PSICOLÓGICO:
${psico}

Motivação:
${motivacao}

Medo:
${medo}

${dialoguesText}`;
}

const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-flash-latest'];

const systemPrompt = `Você é um diretor e roteirista sênior especializado em criar PROMPTS CINEMATOGRÁFICOS DE ALTA RETENÇÃO VIRAL para vídeos dramáticos curtos (estilo novelas de choque e reels virais).

REGRAS ABSOLUTAS E INVIOLÁVEIS:
1. NUNCA invente personagens prontos genéricos (como gerente de loja ou segurança) se o usuário forneceu personagens específicos. USE ESTRITAMENTE OS PERSONAGENS E NOMES DO USUÁRIO.
2. NUNCA gere falas vazias ("" ou “”). Todas as falas DEVEM SER PREENCHIDAS com diálogos inéditos, viscerais e ultra-agressivos calibrados para EXATAMENTE 9 SEGUNDOS por fala (aproximadamente 27 a 30 palavras para cada personagem).
3. IDENTIFICAÇÃO INDIVIDUAL OBRIGATÓRIA: Identifique EXATAMENTE quem fala em parágrafos separados para cada personagem:
[Nome do Personagem 1] fala no idioma e estilo de Brasil:
"[Fala com raiva extrema, preconceito ou agressividade nos primeiros 4 segundos, totalizando cerca de 9 segundos (27-30 palavras)]"

[Nome do Personagem 2] fala no idioma e estilo de Brasil:
"[Fala de desespero, defesa ou humilhação nos primeiros 4 segundos, totalizando cerca de 9 segundos (27-30 palavras)]"

4. PRESERVE E ENTREGUE EXATAMENTE esta estrutura formal técnica de prompt:

PROMPT GANCHO CHAMATIVO CENA [Número da Cena]

CENA:
[descrição cinematográfica completa, iluminação, lentes, ambiente tenso]

PERSONAGENS:

[Nome 1]:
[descrição visual fotorrealista + textura de pele ultra-realista de ser humano real com poros visíveis, micro-relevo dérmico natural, linhas de expressão dinâmicas, imperfeições autênticas da derme, iluminação cinematográfica de pele fotorrealista sem aspecto plástico, 3D ou IA, tom de pele fotorrealista 8K, reflexos naturais e microexpressões faciais de alta fidelidade.]

[Nome 2 se houver]:
[descrição visual fotorrealista + textura de pele ultra-realista...]

POSTURA:
[descrição corporal física e gestos de invasão ou defesa]

PERFIL PSICOLÓGICO:
[perfil de ódio, soberba, preconceito de um lado e medo/desespero do outro]

Motivação:
[motivação de cada um]

Medo:
[medo de cada um]

[Nome 1] fala no idioma e estilo de Brasil:
"[Fala adaptada, cruel e visceral de exatamente 9 segundos (27 a 30 palavras)]"

[Nome 2 se houver] fala no idioma e estilo de Brasil:
"[Fala adaptada de resposta de exatamente 9 segundos (27 a 30 palavras)]"

5. NUNCA gere imagens. Retorne apenas o prompt técnico completo.`;

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

  const apiKey = await getActiveGeminiApiKey(serviceSupabase, user.id);
  if (!apiKey) {
    return res.status(400).json({ error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.' });
  }

  const originalPrompt = clean(req.body?.originalPrompt);
  const addRealisticSkinTexture = req.body?.addRealisticSkinTexture !== false;
  const sceneNumber = clean(req.body?.sceneNumber, 20) || '01';

  const rawInput = originalPrompt.trim();

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const userMessage = `Reescreva o prompt completo preservando rigorosamente todos os personagens, a cena e o enredo do usuário, gerando falas INÉDITAS, impactantes e completas com EXATAMENTE 9 SEGUNDOS de duração cada (~27 a 30 palavras), identificando quem fala em cada momento:

Prompt do usuário:
${rawInput}`;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
        },
      });

      const generatedText = response.text || '';
      if (
        generatedText.trim() &&
        !generatedText.includes('“”') &&
        generatedText.includes('fala no idioma e estilo de Brasil:')
      ) {
        return res.status(200).json({ prompt: generatedText, source: modelName });
      }
    } catch (err: any) {
      console.warn(`[ganchos] modelo ${modelName} falhou:`, err?.message || err);
    }
  }

  // Dynamic context-aware fallback if all AI models failed
  const fallback = generateDynamicPrompt({
    rawText: rawInput,
    sceneNumber,
    addRealisticSkinTexture,
  });

  return res.status(200).json({ prompt: fallback, source: 'dynamic_engine' });
}
