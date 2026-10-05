import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { getActiveGeminiApiKey } from './gemini-key.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const app = express();

let ai!: GoogleGenAI;

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

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

// Helper to clean JSON strings wrapped in markdown blocks
function cleanJsonString(raw: string): string {
  if (!raw) return '{}';
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// Fallback & Retry helper with multiple models to prevent 503 UNAVAILABLE & 429 QUOTA errors
async function callGeminiWithFallbacks<T>(
  generateFn: (modelName: string) => Promise<T>,
  fallbackValueProvider?: () => T
): Promise<T> {
  const models = ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      return await generateFn(model);
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || 500;
      console.log(`[Gemini Engine] Notice: Model ${model} status ${status}. Cycling to next model...`);

      if (i < models.length - 1) {
        await new Promise((res) => setTimeout(res, 500));
      }
    }
  }

  if (fallbackValueProvider) {
    console.log('[Gemini Engine] Activating calibrated high-fidelity cleaning & housewives preset.');
    return fallbackValueProvider();
  }

  throw lastError || new Error('O modelo de IA está temporariamente ocupado. Por favor, tente novamente.');
}

// Sanitizer to enforce ad platform policies (Meta / Google / TikTok / Anvisa / Conar):
// Strictly forbids fake doctor claims, hazardous chemical mixes (e.g. bleach + ammonia/vinegar) and medical lab coats.
function sanitizeCleaningPrompts(data: any): any {
  if (typeof data === 'string') {
    let str: string = data;
    // Replace lab coat references
    str = str.replace(/jaleco\s+(branco|médico|clínico|de linho|premium|impecável|cirúrgico)?/gi, 'avental de linho elegante');
    str = str.replace(/jaleco/gi, 'avental de linho elegante');
    str = str.replace(/lab\s+coat/gi, 'tailored linen apron');
    str = str.replace(/white\s+coat/gi, 'stylish home organizer apron');
    str = str.replace(/medical\s+coat/gi, 'clean cotton tailored shirt');
    str = str.replace(/scrub\s+cirúrgico/gi, 'blusa prática de algodão');
    str = str.replace(/\bscrubs?\b/gi, 'casual linen shirt');

    // Replace stethoscope
    str = str.replace(/estetoscópio\s*(discreto)?/gi, '');
    str = str.replace(/\bstethoscope\b/gi, '');

    // Replace medical / chemical doctor claims
    str = str.replace(/\bDr\.\s*/g, '');
    str = str.replace(/\bDra\.\s*/g, '');
    str = str.replace(/\bdoctor\b/gi, 'home care specialist');
    str = str.replace(/médico\s+(pediatra|obstetra|ginecologista|nutrólogo|especialista)?/gi, 'especialista em cuidados do lar');
    str = str.replace(/médica\s+(pediatra|obstetra|ginecologista|nutróloga|especialista)?/gi, 'especialista em técnicas de limpeza');
    str = str.replace(/químico\s+industrial/gi, 'especialista em truques caseiros');
    str = str.replace(/médicos/gi, 'especialistas e donas de casa');
    str = str.replace(/médico/gi, 'especialista');
    str = str.replace(/médica/gi, 'especialista');

    // Replace clinic / medical office setting references
    str = str.replace(/consultório\s+(médico|pediátrico)?/gi, 'cozinha moderna e aconchegante');
    str = str.replace(/clínica/gi, 'cozinha residencial moderna');
    str = str.replace(/ambiente\s+hospitalar/gi, 'cozinha limpa e acolhedora');
    str = str.replace(/bancada\s+clínica/gi, 'bancada de granito polido');
    str = str.replace(/sala\s+clínica/gi, 'cozinha moderna');
    str = str.replace(/estúdio\s+clínico/gi, 'cozinha residencial impecável');
    str = str.replace(/monitores\s+médicos/gi, 'utensílios modernos de cozinha');
    str = str.replace(/livros\s+médicos/gi, 'frascos organizados e panos de microfibra');

    return str;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeCleaningPrompts(item));
  }

  if (data !== null && typeof data === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = sanitizeCleaningPrompts((data as any)[key]);
    }
    return cleaned;
  }

  return data;
}

// STRICT 9-SECOND SPEECH CALIBRATION & ENFORCEMENT HELPER
// At natural direct-response commercial pace in Portuguese (145-155 words/min, or ~2.4 words/sec),
// exactly 9.0 seconds corresponds strictly to 20 to 24 words.
function calibrateAndEnforceStrictNineSeconds(promptItem: any): any {
  if (!promptItem || typeof promptItem !== 'object') return promptItem;

  const rawScript = String(promptItem.spokenScript || '').trim();
  // Strip pause tokens like <pausa 0.5s> and punctuation when counting real spoken words
  const cleanForCounting = rawScript.replace(/<pausa[^>]*>/gi, ' ').replace(/[.,!?;:()"]/g, ' ').trim();
  const words = cleanForCounting.split(/\s+/).filter(Boolean);

  let finalScript = rawScript;
  let wordCount = words.length;

  // Strict 9-Second Calibration:
  // If words > 24, truncate strictly to 22-23 words with clean punctuation to prevent going over 9.0 seconds
  if (wordCount > 24) {
    const rawWords = rawScript.split(/\s+/).filter(Boolean);
    const trimmed = rawWords.slice(0, 22).join(' ');
    finalScript = trimmed.replace(/[,;:\s]+$/, '') + ' agora.';
    wordCount = finalScript.replace(/<pausa[^>]*>/gi, ' ').replace(/[.,!?;:()"]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  } else if (wordCount < 20 && wordCount > 0) {
    // If under 20 words, it will last under 9s; append natural Brazilian home care close
    const needed = 22 - wordCount;
    if (needed >= 6) {
      finalScript = finalScript.replace(/[.!?\s]+$/, '') + ' pra deixar tudo brilhando sem você cansar o braço.';
    } else {
      finalScript = finalScript.replace(/[.!?\s]+$/, '') + ' sem sofrer esfregando nada.';
    }
    wordCount = finalScript.replace(/<pausa[^>]*>/gi, ' ').replace(/[.,!?;:()"]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  }

  return {
    ...promptItem,
    spokenScript: finalScript,
    wordCount,
    duration: '00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)',
  };
}

// Helper to generate dynamic narrative structure instructions based on count for CLEANING & HOUSEWIVES NICHE
function getNarrativeStructureForCount(
  count: number,
  productName: string,
  ingredients?: string,
  niche?: string,
  bodyPartModel?: string,
  includeCTA: boolean = true
) {
  const prod = productName || 'DesengorduraMax Pro 4K';
  const ings = ingredients || 'Bicarbonato de sódio, Detergente neutro, Vinagre de álcool morno e Limão fresco';
  const rawList = ings
    .split(/(?:\s*,\s*|\s+\+\s+|\s+e\s+|\n+)/i)
    .map((s: string) => s.trim().replace(/^Extrato (puro|concentrado) de\s+/i, '').trim())
    .filter(Boolean);
  const singleIng = rawList[0] || 'Bicarbonato de sódio puro';

  const nicheLower = (niche || '').toLowerCase();
  const isGrease = nicheLower.includes('gordur') || nicheLower.includes('panela') || nicheLower.includes('fogão') || nicheLower.includes('queimad') || nicheLower.includes('fritad');
  const isGrout = nicheLower.includes('rejunte') || nicheLower.includes('mofo') || nicheLower.includes('azulejo') || nicheLower.includes('limo') || nicheLower.includes('banheiro');
  const isGlass = nicheLower.includes('box') || nicheLower.includes('vidro') || nicheLower.includes('embaçad') || nicheLower.includes('espelho') || nicheLower.includes('calcário');
  const isSofa = nicheLower.includes('sofá') || nicheLower.includes('sofa') || nicheLower.includes('colchão') || nicheLower.includes('colchao') || nicheLower.includes('estofad') || nicheLower.includes('ácaro') || nicheLower.includes('urina') || nicheLower.includes('pet');
  const isDrain = nicheLower.includes('ralo') || nicheLower.includes('sifão') || nicheLower.includes('sifao') || nicheLower.includes('entup') || nicheLower.includes('esgoto') || nicheLower.includes('cheiro');
  const isRust = nicheLower.includes('inox') || nicheLower.includes('ferrug') || nicheLower.includes('queimad') || nicheLower.includes('brilho');

  let hookInstruction = '';
  if (isGrease) {
    hookInstruction = `GANCHO FORTE COM A MAQUETE GIGANTE DE 1,20M DA GORDURA CARBONIZADA (FALA BRASILEIRA REAL, SEM CLICHÊS) (9s):
Foco visual primário na maquete gigante de 1,20m do fundo de panela ou trempe de fogão em corte transversal microscópico ampliado: camadas pretas de gordura polimerizada e resíduos carbonizados grudados com força nos microporos do metal. A especialista aponta para a crosta preta com espanto e cumplicidade de dona de casa para dona de casa.
FALA FALADA DE RIGOROSAMENTE 9 SEGUNDOS (20 a 24 palavras) EM PORTUGUÊS BRASILEIRO NATURAL E SEM CLICHÊ (ex: "Se o fundo da sua panela tá preto de gordura queimada, olha aqui dentro: essa crosta virou uma pedra grudada no metal!").`;
  } else if (isGrout) {
    hookInstruction = `GANCHO FORTE COM A MAQUETE GIGANTE DE 1,20M DO REJUNTE COM MOFO (FALA BRASILEIRA REAL, SEM CLICHÊS) (9s):
Foco visual primário na maquete gigante de 1,20m de uma junta de rejunte entre azulejos cerâmicos em corte transversal: estrutura porosa tomada por hifas pretas de fungos filamentosos e limo entranhado nos microporos do cimento. A especialista aponta indignada com o cansaço inútil de esfregar.
FALA FALADA DE RIGOROSAMENTE 9 SEGUNDOS (20 a 24 palavras) EM PORTUGUÊS BRASILEIRO NATURAL E SEM CLICHÊ (ex: "Se o rejunte do seu banheiro tá preto de mofo, não perca tempo esfregando. Olha aqui dentro: o fungo cria raízes no cimento!").`;
  } else if (isGlass) {
    hookInstruction = `GANCHO FORTE COM A MAQUETE GIGANTE DE 1,20M DO VIDRO DO BOX COM GORDURA (FALA BRASILEIRA REAL, SEM CLICHÊS) (9s):
Foco visual primário na maquete gigante de 1,20m de uma lâmina de vidro temperado em corte transversal: camadas de calcário cristalizado da água entrelaçadas com gordura corporal e restos de sabonete formando película esbranquiçada e opaca.
FALA FALADA DE RIGOROSAMENTE 9 SEGUNDOS (20 a 24 palavras) EM PORTUGUÊS BRASILEIRO NATURAL E SEM CLICHÊ (ex: "Se o vidro do seu box vive embaçado e cinzento, olha aqui dentro: isso não é sujeira comum, é calcário com gordura corporal grudada.").`;
  } else if (isSofa) {
    hookInstruction = `GANCHO FORTE COM A MAQUETE GIGANTE DE 1,20M DAS FIBRAS DO ESTOFADO COM ÁCAROS (FALA BRASILEIRA REAL, SEM CLICHÊS) (9s):
Foco visual primário na maquete gigante de 1,20m da trama têxtil de sofá e espuma de colchão em corte transversal: fibras impregnadas com uréia amarelada de suor, cristais de urina e dezenas de ácaros microscópicos com iluminação 8K.
FALA FALADA DE RIGOROSAMENTE 9 SEGUNDOS (20 a 24 palavras) EM PORTUGUÊS BRASILEIRO NATURAL E SEM CLICHÊ (ex: "Se o seu sofá tá com cheiro forte ou mancha amarela no colchão, olha aqui dentro: ácaros e cristais de suor entranhados na espuma!").`;
  } else if (isDrain) {
    hookInstruction = `GANCHO FORTE COM A MAQUETE GIGANTE DE 1,20M DA CURVA DO SIFÃO ENTUPIDO (FALA BRASILEIRA REAL, SEM CLICHÊS) (9s):
Foco visual primário na maquete gigante de 1,20m da curva do sifão de PVC em corte longitudinal: massa espessa e gelatinosa de gordura acumulada, restos de comida em decomposição e gases fétidos borbulhando.
FALA FALADA DE RIGOROSAMENTE 9 SEGUNDOS (20 a 24 palavras) EM PORTUGUÊS BRASILEIRO NATURAL E SEM CLICHÊ (ex: "Se a água da sua pia desce devagar e sobe cheiro ruim, olha aqui dentro: placas de gordura empedrada entupindo a curva do cano!").`;
  } else if (isRust) {
    hookInstruction = `GANCHO FORTE COM A MAQUETE GIGANTE DE 1,20M DO INOX OXIDADO (FALA BRASILEIRA REAL, SEM CLICHÊS) (9s):
Foco visual primário na maquete gigante de 1,20m de uma chapa de aço inoxidável em corte metalúrgico: microfissuras rompidas com óxido de ferro (ferrugem) e marcas de queimado sem brilho.
FALA FALADA DE RIGOROSAMENTE 9 SEGUNDOS (20 a 24 palavras) EM PORTUGUÊS BRASILEIRO NATURAL E SEM CLICHÊ (ex: "Se as suas panelas e a pia de inox tão manchadas e sem brilho, olha aqui dentro: a ferrugem corrói a camada protetora do metal.").`;
  } else {
    hookInstruction = `GANCHO FORTE COM A MAQUETE GIGANTE DE 1,20M (${bodyPartModel || 'da sujeira incrustada em corte transversal microscópico'}) (FALA BRASILEIRA REAL, SEM CLICHÊS) (9s):
Foco visual primário na maquete gigante de 1,20m com fidelidade hiper-realista exibindo a sujeira impregnada em corte transversal. A especialista aponta com indignação e cumplicidade.
FALA FALADA DE RIGOROSAMENTE 9 SEGUNDOS (20 a 24 palavras) EM PORTUGUÊS BRASILEIRO NATURAL, DIRETO E SEM CLICHÊS DE MARKETING.`;
  }

  const prompt4Instruction = `PROMPT 4: PRA QUE SERVE E COMO USAR NA PRÁTICA (REGRA RIGOROSA: FALA OBRIGATÓRIA DE PRA QUE SERVE E COMO USAR) (9s):
A especialista segura o borrifador ou a esponja sobre a bancada.
NA FALA FALADA DE SOMENTE 9 SEGUNDOS (RIGOROSAMENTE ENTRE 20 E 24 PALAVRAS), A ESPECIALISTA DEVE EXPLICAR DE FORMA DIRETA E COLOQUIAL:
1) PRA QUE SERVE (qual é o benefício prático imediato: dissolver a gordura velha, clarear o rejunte na hora, arrancar manchas de suor, desobstruir o ralo sem soda cáustica);
2) COMO USAR (a aplicação exata: borrifar na superfície seca, deixar agir 5 minutos e passar um paninho de microfibra sem esfregar).
LINGUAGEM 100% NATURAL BRASILEIRA, SEM CLICHÊS!`;

  if (includeCTA) {
    if (count === 3) {
      return `A ESTRUTURA DOS 3 PROMPTS (COM CTA) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Ingrediente Caseiro de Fácil Acesso da Despensa/Mercado + Como Fazer Rápido (9s).
  A especialista mostra na bancada o ingrediente (${singleIng}) e cita nominalmente em voz alta. Fala natural de dona de casa de 9s (20-24 palavras).
- PROMPT 3: Pra que Serve, Como Usar + Chamada Direta (CTA "EU QUERO") com Frasco de Limpeza em Mãos! (9s).
  A especialista explica pra que serve, como aplicar e pede para comentar "EU QUERO" nos comentários para receber a receita completa e o link no direct. Fala natural de 9s (20-24 palavras).`;
    }

    if (count === 4) {
      return `A ESTRUTURA DOS 4 PROMPTS (COM CTA) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Nome do Ingrediente Caseiro de Fácil Acesso da Despensa (${singleIng}) (9s).
  Apresentação na bancada do ingrediente barato que toda dona de casa tem no armário. Citar nominalmente em voz alta. Fala brasileira natural de 9s (20-24 palavras).
- PROMPT 3: Como Fazer o Preparo da Misturinha Passo a Passo & Tempo (5 minutos de ação sem esforço) (9s).
  Demonstração de como misturar na tigela ou borrifador e marcar cinco minutos para agir. Fala de 9s (20-24 palavras).
- PROMPT 4: ${prompt4Instruction} + Apresentação do Frasco de "${prod}" em Mãos e Chamada para Comentar "EU QUERO" no direct!`;
    }

    if (count === 5) {
      return `A ESTRUTURA DOS 5 PROMPTS (COM CTA) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Nome do Ingrediente Caseiro de Fácil Acesso da Despensa (${singleIng}) (9s).
- PROMPT 3: Como Fazer o Preparo Passo a Passo & Tempo para Ficar Pronto (5 Minutos de Ação) (9s).
- PROMPT 4: ${prompt4Instruction}
- PROMPT 5: Chamada Direta (CTA "EU QUERO") + Frasco do Produto de Limpeza em Mãos! (9s).
  A especialista segura o frasco spray virado para a lente e pede com naturalidade para comentar "EU QUERO" nos comentários para receber o link com desconto no direct. Fala de 9s (20-24 palavras).`;
    }

    if (count === 6) {
      return `A ESTRUTURA DOS 6 PROMPTS (COM CTA - PADRÃO DE ALTA CONVERSÃO BRASIL) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Nome do Ingrediente Caseiro de Fácil Acesso da Despensa (${singleIng}) (9s).
  Citação nominal em voz alta do ingrediente acessível que toda dona de casa tem. Fala brasileira natural de 9s (20-24 palavras).
- PROMPT 3: Como Fazer o Preparo da Misturinha Passo a Passo & Tempo para Ficar Pronto (5 Minutos de Ação) (9s).
  Demonstração de bancada: mistura rápida, efervescência ativada e repouso por exatamente 5 minutos. Fala de 9s (20-24 palavras).
- PROMPT 4: ${prompt4Instruction}
- PROMPT 5: Chamada Direta (CTA "EU QUERO") + Apresentação do Produto Concentrado em Mãos! (9s).
  A especialista segura o frasco "${prod}" com gatilho spray virado para a câmera, dizendo que a mesma fórmula potente foi concentrada ali, e pede para comentar "EU QUERO" para envio no direct. Fala de 9s (20-24 palavras).
- PROMPT 6: Resultado Real Sem Clichês & Casa Impecável Sem Cansar o Braço (9s).
  A especialista sorri satisfeita vendo a transformação real: panela brilhando, chão reluzindo ou banheiro sem limo, com a casa perfumada sem esforço. Fala de 9s (20-24 palavras).`;
    }

    if (count === 7) {
      return `A ESTRUTURA DOS 7 PROMPTS (COM CTA) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Nomes dos Ingredientes Caseiros da Despensa (${ings}) (9s).
- PROMPT 3: Como Fazer o Preparo Passo a Passo & Tempo de 5 Minutos (9s).
- PROMPT 4: ${prompt4Instruction}
- PROMPT 5: Quantidade Exata & Medidas Caseiras de Colher e Xícara (9s).
- PROMPT 6: Chamada Direta (CTA "EU QUERO") + Frasco em Mãos! (9s).
- PROMPT 7: Resultado Real com Brilho Espelhado e Casa Limpa Sem Esfregar (9s).`;
    }

    return `A ESTRUTURA DOS ${count} PROMPTS (COM CTA) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Nomes dos Ingredientes Caseiros da Despensa (${ings}) (9s).
- PROMPT 3: Como Fazer o Preparo Passo a Passo & Tempo (5 Minutos) (9s).
- PROMPT 4: ${prompt4Instruction}
- PROMPT 5: Quantidade Exata & Medidas de Cozinha (9s).
- PROMPT 6: A Química Doméstica Descomplicada Explicada Simples (9s).
- PROMPT 7: Chamada Direta (CTA "EU QUERO") + Frasco em Mãos! (9s).
- PROMPT 8: Transformação Real e Brilho Sem Esforço Físico (9s).
${count >= 9 ? `- PROMPT 9: Rotina Prática da Dona de Casa Moderna (9s).\n` : ''}
${count >= 10 ? `- PROMPT 10: Conclusão Calorosa de Dona de Casa para Dona de Casa (9s).\n` : ''}`;
  }

  // ELSE: SEM CTA (CONTEÚDO ORGÂNICO / EDUCATIVO PURO)
  if (count === 3) {
    return `A ESTRUTURA DOS 3 PROMPTS (SEM CTA) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Ingrediente Caseiro de Fácil Acesso + Preparo Passo a Passo em 5 Minutos (9s).
- PROMPT 3: Pra que Serve, Como Usar e Brilho Sem Venda (9s).`;
  }

  if (count === 4) {
    return `A ESTRUTURA DOS 4 PROMPTS (SEM CTA) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Nome do Ingrediente Caseiro de Fácil Acesso (${singleIng}) (9s).
- PROMPT 3: Como Fazer o Preparo Passo a Passo & Tempo de 5 Minutos (9s).
- PROMPT 4: ${prompt4Instruction} (Sem venda, apenas dica prática de dona de casa para facilitar a faxina).`;
  }

  if (count === 5) {
    return `A ESTRUTURA DOS 5 PROMPTS (SEM CTA) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Nome do Ingrediente de Fácil Acesso da Despensa (${singleIng}) (9s).
- PROMPT 3: Como Fazer o Preparo Passo a Passo & Tempo de 5 Minutos (9s).
- PROMPT 4: ${prompt4Instruction}
- PROMPT 5: Brilho Espelhado Real, Casa Limpa e Desfecho Satisfatório (Sem CTA) (9s).`;
  }

  if (count === 6) {
    return `A ESTRUTURA DOS 6 PROMPTS (SEM CTA) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Nome do Ingrediente Caseiro de Fácil Acesso (${singleIng}) (9s).
- PROMPT 3: Como Fazer o Preparo Passo a Passo & Tempo de 5 Minutos (9s).
- PROMPT 4: ${prompt4Instruction}
- PROMPT 5: Medidas Exatas de Colher e Dicas de Aplicação com Pano de Microfibra (9s).
- PROMPT 6: Resultado Real e Casa Perfumada Sem Cansar o Braço (Sem CTA / Sem Venda) (9s).`;
  }

  return `A ESTRUTURA DOS ${count} PROMPTS (SEM CTA) DEVE SER EXATAMENTE ESTA:
- PROMPT 1: ${hookInstruction}
- PROMPT 2: Nomes dos Ingredientes Caseiros da Despensa (${ings}) (9s).
- PROMPT 3: Como Fazer o Preparo Passo a Passo & Tempo de 5 Minutos (9s).
- PROMPT 4: ${prompt4Instruction}
- PROMPT 5: Quantidade Exata & Medidas de Cozinha (9s).
- PROMPT 6: Ação Desengordurante nos Microporos da Superfície (9s).
- PROMPT 7: Desfecho com Brilho Espelhado e Casa Pronta Sem Esforço (Sem CTA) (9s).
${count >= 8 ? `- PROMPT 8: Conclusão Amigável Sem Clichê (9s).\n` : ''}`;
}

// Helper to construct guaranteed dynamic cleaning VSL narrative adapted to count
function buildFallbackPromptsResponse(params: any) {
  const {
    productName,
    niche,
    bodyPartModel,
    ingredients,
    scientificBacking,
    characterDescription,
    supplementDescription,
    settingDescription,
    targetPlatform = 'kling',
    aspectRatio = '9:16',
    resolution = '4K UHD Master',
    promptCount = 6,
  } = params || {};

  const count = Math.min(Math.max(Number(promptCount) || 6, 3), 10);
  const charDesc = characterDescription || 'Dona Clara Menezes, especialista em organização doméstica e técnicas de limpeza pesada de 42 anos, camiseta de algodão cru e avental de linho cinza elegante (sem jaleco), feições amigáveis e acolhedoras com pele natural 8K e olhar de cumplicidade de dona de casa para dona de casa';
  const setDesc = settingDescription || 'Cozinha residencial moderna e impecável com bancada de granito preto São Gabriel polido, iluminação suave 5400K difusa e quente com fogão limpo e panos de microfibra organizados em desfoque cinematográfico f/1.8 ao fundo';
  const suppDesc = supplementDescription || 'Frasco borrifador spray âmbar escuro de 500ml com gatilho ergonômico preto fosco, bico dosador spray/stream e rótulo fosco minimalista';
  const prod = productName || 'DesengorduraMax Pro 4K';

  const nicheLower = (niche || '').toLowerCase();
  const isGrout = nicheLower.includes('rejunte') || nicheLower.includes('mofo') || nicheLower.includes('azulejo') || nicheLower.includes('limo') || nicheLower.includes('banheiro');
  const isGlass = nicheLower.includes('box') || nicheLower.includes('vidro') || nicheLower.includes('embaçad') || nicheLower.includes('espelho') || nicheLower.includes('calcário');
  const isSofa = nicheLower.includes('sofá') || nicheLower.includes('sofa') || nicheLower.includes('colchão') || nicheLower.includes('colchao') || nicheLower.includes('estofad') || nicheLower.includes('ácaro') || nicheLower.includes('urina');
  const isDrain = nicheLower.includes('ralo') || nicheLower.includes('sifão') || nicheLower.includes('sifao') || nicheLower.includes('entup') || nicheLower.includes('cheiro');
  const isRust = nicheLower.includes('inox') || nicheLower.includes('ferrug') || nicheLower.includes('queimad');

  let defaultModelDesc = 'Maquete gigante de 1,20m do fundo de uma panela de alumínio em corte transversal microscópico ampliado 1000x: camadas densas e pretas de gordura polimerizada e carbonizada fundidas nos microporos do metal, exibindo a película oleosa ressecada e impenetrável com reflexos opacos e textura áspera sob iluminação clínica 8K';
  let defaultHookScript = 'Se o fundo da sua panela tá preto de gordura queimada, olha aqui dentro: essa crosta virou uma pedra grudada no metal!';
  let defaultHookTitle = 'PROMPT 1: Gancho com a Maquete Gigante da Gordura (9s)';
  let defaultHookGoal = 'Foco óptico primário na maquete gigante de 1,20m revelando a crosta preta de gordura vegetal carbonizada fundida nos microporos da panela, gerando choque e conexão imediata com donas de casa';
  let defaultScientificBacking = scientificBacking || 'Comprovado por princípios de tensoativos e saponificação doméstica: A reação do bicarbonato com ácidos graxos polimerizados quebra as ligações éster da gordura, enquanto o ácido acético desincrusta minerais sem corroer o metal.';
  let defaultPurposeScript = 'Essa misturinha serve pra dissolver a gordura velha sem você esfregar. É só borrifar, esperar cinco minutos e passar um paninho.';

  if (isGrout) {
    defaultModelDesc = 'Maquete gigante de 1,20m de uma junta de rejunte entre dois azulejos cerâmicos em corte transversal ampliado: estrutura mineral porosa profundamente colonizada por hifas pretas de fungos filamentosos (mofo) e biofilme gelatinoso de limo entranhado nos poros microscópicos do cimento sob iluminação 8K';
    defaultHookScript = 'Se o rejunte do seu banheiro tá preto de mofo, não perca tempo esfregando. Olha aqui dentro: o fungo cria raízes no cimento!';
    defaultHookTitle = 'PROMPT 1: Gancho com a Maquete do Rejunte com Mofo (9s)';
    defaultHookGoal = 'Foco óptico primário na maquete gigante de 1,20m do rejunte com colônias de fungos entranhadas nos microporos do cimento';
    defaultScientificBacking = scientificBacking || 'Comprovado pela ação oxidante do peróxido de hidrogênio: O oxigênio ativo degrada os pigmentos escuros do mofo e elimina os esporos nos microporos.';
    defaultPurposeScript = 'Serve pra branquear o rejunte e matar o mofo pela raiz. Passe com uma trincha, espere cinco minutos e enxágue com água morna.';
  } else if (isGlass) {
    defaultModelDesc = 'Maquete gigante de 1,20m de uma lâmina de vidro temperado em corte transversal microscópico ampliado: superfície vítrea coberta por camadas sobrepostas de sais de cálcio e magnésio (calcário) cristalizados entrelaçados com sebo e gordura corporal oxidada, formando película rugosa e opaca sob iluminação 8K';
    defaultHookScript = 'Se o vidro do seu box vive embaçado e cinzento, olha aqui dentro: isso não é sujeira comum, é calcário com gordura corporal grudada.';
    defaultHookTitle = 'PROMPT 1: Gancho com a Maquete do Box com Gordura (9s)';
    defaultHookGoal = 'Foco óptico na maquete de 1,20m do vidro com crosta esbranquiçada de calcário e gordura de sabonete';
    defaultScientificBacking = scientificBacking || 'Comprovado pela reação ácida quelante: O ácido acético converte o carbonato de cálcio insolúvel em acetato solúvel, dissolvendo a opacidade sem riscar o vidro.';
    defaultPurposeScript = 'Serve pra tirar a névoa esbranquiçada e criar blindagem anti-gota. Borrife no vidro seco, deixe agir cinco minutos e passe microfibra.';
  } else if (isSofa) {
    defaultModelDesc = 'Maquete gigante de 1,20m da trama tridimensional de fibras de tecido de sofá e espuma de colchão em corte transversal: microfibras impregnadas com uréia amarelada de suor, cristais de urina de pet e ácaros microscópicos alojados na espuma sob iluminação 8K';
    defaultHookScript = 'Se o seu sofá tá com cheiro forte ou mancha amarela no colchão, olha aqui dentro: ácaros e cristais de suor entranhados na espuma!';
    defaultHookTitle = 'PROMPT 1: Gancho com a Maquete das Fibras do Sofá (9s)';
    defaultHookGoal = 'Foco na maquete de 1,20m mostrando os ácaros e manchas de suor entranhadas nas fibras do estofado';
    defaultScientificBacking = scientificBacking || 'Comprovado pela ação enzimática e osmótica: O álcool 70 rompe a cápsula lipídica dos ácaros e o bicarbonato neutraliza odores amoniacais.';
    defaultPurposeScript = 'Serve pra arrancar o amarelado antigo e matar os ácaros invisíveis. Borrife a vinte centímetros, aguarde cinco minutos e seque com pano limpo.';
  } else if (isDrain) {
    defaultModelDesc = 'Maquete gigante de 1,20m da curva de um sifão de PVC em corte longitudinal: acúmulo espesso de biofilme gelatinoso cinzento, gordura alimentar endurecida em placas e resíduos orgânicos em decomposição retendo gases fétidos sob iluminação de alerta 8K';
    defaultHookScript = 'Se a água da sua pia desce devagar e sobe cheiro ruim, olha aqui dentro: placas de gordura empedrada entupindo a curva do cano!';
    defaultHookTitle = 'PROMPT 1: Gancho com a Maquete do Sifão da Pia (9s)';
    defaultHookGoal = 'Foco na maquete gigante de 1,20m revelando o cano entupido por gordura e o lodo acumulado';
    defaultScientificBacking = scientificBacking || 'Comprovado pela termodinâmica da efervescência: A reação de bicarbonato com vinagre quente gera CO2 expansivo e dissolve gorduras por saponificação térmica.';
    defaultPurposeScript = 'Serve pra desmanchar a gordura presa e acabar com o mau cheiro. Despeje no ralo seco, espere cinco minutos e jogue água fervendo.';
  } else if (isRust) {
    defaultModelDesc = 'Maquete gigante de 1,20m de uma chapa de aço inoxidável em corte metalúrgico transversal ampliado: microfissuras superficiais com óxido de ferro avermelhado (ferrugem) rompendo a película protetora de cromo, com depósitos de queimado sem brilho';
    defaultHookScript = 'Se as suas panelas e a pia de inox tão manchadas e sem brilho, olha aqui dentro: a ferrugem corrói a camada protetora do metal.';
    defaultHookTitle = 'PROMPT 1: Gancho com a Maquete do Inox Oxidado (9s)';
    defaultHookGoal = 'Foco na maquete de 1,20m mostrando a oxidação superficial e a quebra da camada espelhada do metal';
    defaultScientificBacking = scientificBacking || 'Comprovado pela quelação de óxidos: O ácido cítrico dissolve o óxido férrico superficial, restaurando a camada passiva de cromo sem arranhar o acabamento escovado.';
    defaultPurposeScript = 'Serve pra tirar os pontinhos de ferrugem e dar brilho espelhado. Esfregue suavemente com o limão, deixe agir três minutos e seque.';
  }

  const modelDesc = bodyPartModel || defaultModelDesc;
  const hookScript = defaultHookScript;
  const hookTitle = defaultHookTitle;
  const hookGoal = defaultHookGoal;

  // Prompt 1: Hook (Zero clichês, fala brasileira real de dona de casa de 9s)
  const promptHook = {
    title: hookTitle,
    duration: '00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)',
    step: 1,
    goal: hookGoal,
    spokenScript: hookScript,
    wordCount: 22,
    voiceDirection: 'Tom sincero, direto e caloroso de dona de casa para dona de casa no Brasil, sem clichês dramáticos artificiais, fala clara com <pausa 0.5s>',
    facialExpressionsAndHumanRealism: 'Olhos expressivos com indignação bem-humorada e cumplicidade sincera, cenho atento e empático, postura ágil, pele hiper-realista 8K com textura natural sob luz 5400K.',
    handMovements: 'Mãos experientes apontando com o indicador diretamente para a crosta preta de sujeira entranhada na maquete gigante de 1,20m, 5 dedos anatômicos perfeitos.',
    cameraAndLighting: 'Enquadramento cinematográfico de alto impacto com FOCO ÓPTICO PRIMÁRIO NA MAQUETE GIGANTE DE 1,20M ocupando dois terços do quadro em primeiro plano. Push-in suave revelando em ultra-definição 8K as camadas de sujeira, porosidade e textura microscópica. Iluminação suave e quente 5400K com luz de recorte nos ombros da especialista ao lado.',
    videoPromptVisual: `Plano cinematográfico com FOCO CENTRAL E DESTACADO na MAQUETE GIGANTE DE 1,20M em primeiro plano proeminente: ${modelDesc}. A maquete possui acabamento de museu com texturas autênticas de sujeira, camadas estratificadas e profundidade macro. Ao lado da maquete, ${charDesc} no cenário ${setDesc} reage com olhar de pura cumplicidade e indignação de dona de casa, apontando diretamente para a sujeira presa nos poros.`,
    videoPromptEnglish: `Cinematic 4K UHD. Primary visual focus on the GIANT 1.2M HYPER-REALISTIC MACRO CROSS-SECTION MODEL dominating the foreground in breathtaking biological and structural fidelity: ${modelDesc}. Museum-grade craftsmanship displaying microscopic layers of grime, encrusted grease, and mineral pores with high tactile detail. Standing right beside it, ${charDesc} in ${setDesc} gestures with sincere domestic expertise and relatable empathy, pointing with firm hand directly at the encrusted layer. Warm directional studio lighting 5400K, shallow depth of field f/1.8, 8k resolution, raytracing.`,
    engineParameters: `--ar ${aspectRatio} --style raw --v 6.1 / Kling Pro 4K`,
    scientificBacking: defaultScientificBacking,
    recipeStepDetail: 'Apresentação visual da sujeira em corte transversal para contextualizar a ação da misturinha.',
    timeToReady: 'Etapa inicial da campanha',
  };

  const rawIngs = ingredients || 'Bicarbonato de sódio puro de cozinha, Detergente neutro transparente, Vinagre de álcool branco morno e Suco de meio Limão fresco';
  const cleanList = rawIngs
    .split(/(?:\s*,\s*|\s+\+\s+|\s+e\s+|\n+)/i)
    .map((s: string) => s.trim().replace(/^Extrato (puro|concentrado) de\s+/i, '').trim())
    .filter(Boolean);

  let citedNames = 'bicarbonato de sódio com vinagre morno';
  if (cleanList.length >= 2) {
    citedNames = `${cleanList[0].toLowerCase()} com ${cleanList[1].toLowerCase()}`;
  } else if (cleanList.length === 1) {
    citedNames = cleanList[0].toLowerCase();
  }

  // PROMPT 2: Falar os nomes dos ingredientes caseiros da despensa (FALA BRASILEIRA REAL SEM CLICHÊS)
  const promptIngredients = {
    title: 'PROMPT 2: Ingredientes Simples da Despensa ou Mercado (9s)',
    duration: '00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)',
    step: 2,
    goal: 'Apresentar e citar nominalmente em voz alta os ingredientes populares e baratos da despensa/mercado dispostos na bancada',
    spokenScript: `Pra descolar essa sujeira sem esforço, você só usa ${citedNames}, que você tem aí no armário de casa.`,
    wordCount: 21,
    voiceDirection: 'Tom entusiasmado, amigável e seguro, como quem ensina um truque de ouro de vizinha para vizinha na cozinha',
    facialExpressionsAndHumanRealism: 'Expressão de cumplicidade, olhos brilhantes e postura acolhedora demonstrando solução prática e acessível.',
    handMovements: 'Mãos ágeis e naturais com 5 dedos perfeitos sobre a bancada de granito polido, apresentando individualmente os potes e frascos com os ingredientes caseiros.',
    cameraAndLighting: 'Plano médio com leve tilt descendente focalizando os ingredientes na bancada e subindo para o rosto confiante da especialista.',
    videoPromptVisual: `${charDesc} no mesmo cenário ${setDesc}, com a bancada exibindo os ingredientes caseiros simples e acessíveis da despensa: ${rawIngs}. A especialista gesticula apresentando cada ingrediente nominalmente com naturalidade brasileira.`,
    videoPromptEnglish: `Cinematic 4K UHD. ${charDesc} in the identical ${setDesc}, standing behind a polished granite studio kitchen countertop displaying accessible domestic kitchen cleaning ingredients: ${rawIngs}. Host gestures warmly introducing each household item by name. Ultra photorealistic skin texture, soft warm lighting 5400K, 8k resolution.`,
    engineParameters: `--ar ${aspectRatio} --style raw --v 6.1 / Kling Pro 4K`,
    scientificBacking: defaultScientificBacking,
    recipeStepDetail: 'Apresentação dos ingredientes da despensa dispostos na bancada.',
    timeToReady: 'Separação dos ingredientes: 1 minuto',
  };

  // PROMPT 3: Como fazer a misturinha passo a passo & tempo de 5 minutos
  const promptPrep = {
    title: 'PROMPT 3: Como Fazer o Preparo Passo a Passo & Tempo (5 Minutos) (9s)',
    duration: '00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)',
    step: 3,
    goal: 'Demonstrar na bancada o modo de misturar passo a passo e afirmar claramente o tempo de 5 minutos de ação',
    spokenScript: 'Você só mistura tudo na tigelinha, passa na gordura e espera cinco minutos pra essa espuma soltar toda a crosta.',
    wordCount: 22,
    voiceDirection: 'Tom didático e prático, ritmo dinâmico e animado, marcando os cinco minutos com clareza',
    facialExpressionsAndHumanRealism: 'Olhar atento e concentrado na manipulação manual da mistura na tigela de vidro, feições serenas e satisfeitas.',
    handMovements: 'Mãos hábeis preparando a misturinha na tigela com colher, demonstrando a efervescência ativa sobre a bancada limpa com 5 dedos anatômicos perfeitos.',
    cameraAndLighting: 'Close-up cinematográfico na bancada e na tigela borbulhando a reação limpadora, iluminação difusa 5400K f/1.8 com profundidade de campo.',
    videoPromptVisual: `${charDesc} no mesmo ${setDesc}, mostrando o preparo passo a passo: misturando na tigela de vidro, observando a efervescência ativa e marcando cinco minutos para agir.`,
    videoPromptEnglish: `Cinematic 4K UHD. Close-up of ${charDesc} in ${setDesc} demonstrating the step-by-step cleaning paste preparation in a glass bowl: combining ingredients, showing the active foaming effervescence, and emphasizing the 5-minute activation time. Natural hand mechanics with 5 distinct fingers, shallow depth of field f/1.8, 24fps master shot.`,
    engineParameters: `--ar ${aspectRatio} --style raw --v 6.1 / Kling Pro 4K`,
    scientificBacking: defaultScientificBacking,
    recipeStepDetail: 'Preparo prático da pasta efervescente + tempo de repouso de 5 minutos.',
    timeToReady: 'Tempo de ação: exatamente 5 minutos',
  };

  // PROMPT 4: PRA QUE SERVE E COMO USAR NA PRÁTICA (REGRA EXPLÍCITA DO USUÁRIO)
  const promptPurposeAndHowToUse = {
    title: 'PROMPT 4: Pra que Serve e Como Usar na Prática (9s)',
    duration: '00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)',
    step: 4,
    goal: 'Explicar com extrema clareza e linguagem direta pra que serve a receita e o modo exato de aplicar e limpar sem esforço',
    spokenScript: defaultPurposeScript,
    wordCount: 22,
    voiceDirection: 'Tom seguro, didático e natural de dona de casa para dona de casa, sem rodeios e sem clichês, ritmo calmo com <pausa 0.5s>',
    facialExpressionsAndHumanRealism: 'Olhar firme e acolhedor direto nos olhos da espectadora, sorriso amigável de quem ensina uma solução que realmente funciona.',
    handMovements: 'Mãos segurando com firmeza o borrifador ou esponja macia na altura da bancada, gesticulando com naturalidade ao explicar a aplicação.',
    cameraAndLighting: 'Plano médio com enquadramento focado na especialista e na bancada de granito polido, iluminação suave 5400K.',
    videoPromptVisual: `${charDesc} no mesmo cenário ${setDesc}, demonstrando com simplicidade pra que serve a misturinha e como passar na superfície com pano de microfibra, sem esforço.`,
    videoPromptEnglish: `Cinematic 4K UHD. ${charDesc} in ${setDesc}, warmly demonstrating practical application with spray bottle and microfibre cloth on clean kitchen counter, explaining exact purpose and contact time. Natural Brazilian cadence, ultra photorealistic skin texture, warm studio light 5400K.`,
    engineParameters: `--ar ${aspectRatio} --style raw --v 6.1 / Kling Pro 4K`,
    scientificBacking: defaultScientificBacking,
    recipeStepDetail: 'Explicação direta de pra que serve a misturinha e modo de aplicação na rotina da casa.',
    timeToReady: 'Age em 5 minutos sem esfregar',
  };

  // PROMPT 5 (com CTA): Apresentação do Frasco em Mãos + Chamada "EU QUERO"
  const promptCTA = {
    title: 'PROMPT 5: Chamada com Frasco em Mãos (CTA "EU QUERO") (9s)',
    duration: '00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)',
    step: 5,
    goal: 'Apresentação do produto concentrado em mãos e chamada direta e simples pedindo para comentar "EU QUERO" nos comentários',
    spokenScript: `A gente concentrou essa mesma fórmula no frasco de ${prod}. Comenta EU QUERO aqui embaixo que te mando no direct agora!`,
    wordCount: 22,
    voiceDirection: 'Entonação de proximidade, cúmplice e direta, ênfase natural nas palavras "EU QUERO" e "mando no direct agora"',
    facialExpressionsAndHumanRealism: 'Olhar penetrante conectado com a câmera, sorriso franco e acolhedor, leve aproximação para a frente chamando quem está assistindo.',
    handMovements: `Mão esquerda segurando com firmeza o frasco do produto de limpeza ${suppDesc} com rótulo voltado perfeitamente para a câmera, enquanto a mão direita aponta com o indicador para a área dos comentários abaixo incentivando a digitar "EU QUERO".`,
    cameraAndLighting: 'Enquadramento fechado americano com foco cravado no rótulo do frasco e no olhar da especialista, reflexos nítidos no gatilho sob luz direcional e atmosfera acolhedora.',
    videoPromptVisual: `${charDesc} no mesmo cenário ${setDesc}, segurando com orgulho o frasco spray ${suppDesc} com rótulo nítido virado para a lente, enquanto aponta para baixo convidando a comentar "EU QUERO" para receber no direct.`,
    videoPromptEnglish: `Cinematic 4K UHD. Direct-response commercial framing. ${charDesc} in ${setDesc}, holding up firmly with one hand the exact cleaning spray bottle: ${suppDesc} with label clearly facing camera, while pointing with the other index finger downward toward the comments section, urging viewers to comment 'EU QUERO' so she can send the direct link. Crisp focus on the product, natural skin pores, dramatic studio lighting, 24fps high conversion VSL.`,
    engineParameters: `--ar ${aspectRatio} --style raw --v 6.1 / Kling Pro 4K`,
    scientificBacking: defaultScientificBacking,
    recipeStepDetail: 'Apresentação do frasco concentrado para quem busca praticidade sem fazer sujeira.',
    timeToReady: 'Uso imediato em spray',
  };

  // PROMPT 6: Resultado Real e Casa Brilhando Sem Cansar o Braço
  const promptTransformation = {
    title: 'PROMPT 6: Resultado Real e Casa Brilhando Sem Esforço (9s)',
    duration: '00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)',
    step: 6,
    goal: 'Sensação autêntica de satisfação, superfície espelhada impecável e tempo livre para aproveitar com a família',
    spokenScript: 'Assim você limpa sua casa em minutos, sem estragar as unhas nem cansar o braço, com tudo brilhando como espelho.',
    wordCount: 22,
    voiceDirection: 'Tom acolhedor e satisfeito, fechando o comercial com serenidade e sorriso verdadeiro de alívio doméstico',
    facialExpressionsAndHumanRealism: 'Sorriso franco e aliviado, olhos brilhantes de orgulho, pele iluminada com calor suave 5400K sem brilhos artificiais.',
    handMovements: `Especialista mantendo o frasco ${suppDesc} na altura do peito com segurança, acenando positivamente com a cabeça e admirando o reflexo da bancada.`,
    cameraAndLighting: 'Slow pull-out elegante revelando a especialista e a cozinha resplandecente em composição aconchegante de encerramento.',
    videoPromptVisual: `${charDesc} no mesmo cenário ${setDesc}, segurando o produto ${suppDesc} próximo ao peito com sorriso radiante e acolhedor, celebrando a cozinha reluzente e o tempo livre ganho.`,
    videoPromptEnglish: `Cinematic 4K UHD. Inspiring finale shot. ${charDesc} in identical ${setDesc}, holding ${suppDesc} near chest level with a warm, satisfied smile, admiring the mirror-like sparkle of the clean kitchen countertop. Slow cinematic zoom out, warm 5400K studio backlight, photorealistic 8K render, perfect hands, Master Commercial.`,
    engineParameters: `--ar ${aspectRatio} --style raw --v 6.1 / Kling Pro 4K`,
    scientificBacking: defaultScientificBacking,
    recipeStepDetail: 'Resultado final com brilho espelhado e satisfação doméstica completa.',
    timeToReady: 'Brilho espelhado imediato',
  };

  // Sem CTA closure
  const promptNoCTAClosure = {
    title: 'PROMPT 5: Brilho Real e Casa Limpa Sem Cansar o Braço (9s)',
    duration: '00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)',
    step: 5,
    goal: 'Fechamento focado nos efeitos limpadores da misturinha caseira natural e facilidade na rotina sem apelo comercial',
    spokenScript: 'Com esse truque simples na sua rotina, a sujeira pesada vai embora e sua casa fica limpinha sem você sofrer.',
    wordCount: 22,
    voiceDirection: 'Tom amigável e conclusivo, transmitindo paz e satisfação sem apelo de venda',
    facialExpressionsAndHumanRealism: 'Sorriso sereno e afetuoso, expressão relaxada de dever cumprido, olhar caloroso direto para a espectadora.',
    handMovements: 'Mãos abertas em gesto de satisfação diante da bancada reluzente, postura corporal leve e tranquila.',
    cameraAndLighting: 'Slow pull-out suave e cinematográfico, iluminação dourada quente 5400K, reflexos límpidos no granito.',
    videoPromptVisual: `${charDesc} no mesmo cenário ${setDesc}, com postura relaxada diante da bancada reluzente, sorrindo satisfeita ao concluir a orientação do truque caseiro de limpeza.`,
    videoPromptEnglish: `Cinematic 4K UHD. Inspiring finale shot without commercial pitch. ${charDesc} in ${setDesc}, warm reassuring smile, open hands in a welcoming gesture of home comfort and effortless cleanliness, slow cinematic zoom out, warm 5400K studio lighting, ultra-realistic skin texture, 24fps.`,
    engineParameters: `--ar ${aspectRatio} --style raw --v 6.1 / Kling Pro 4K`,
    scientificBacking: defaultScientificBacking,
    recipeStepDetail: 'Encerramento acolhedor da orientação caseira.',
    timeToReady: 'Uso diário ou semanal',
  };

  const includeCTA = params.includeCTA !== false;

  let selectedTemplates: any[] = [];
  if (count === 3) {
    selectedTemplates = [
      promptHook,
      promptIngredients,
      includeCTA ? promptCTA : promptNoCTAClosure,
    ];
  } else if (count === 4) {
    selectedTemplates = [
      promptHook,
      promptIngredients,
      promptPrep,
      includeCTA
        ? {
            ...promptPurposeAndHowToUse,
            spokenScript: `Essa receita serve pra descolar a gordura sem esfregar. Use com pano macio ou comenta EU QUERO pra receber no direct!`,
            wordCount: 22,
          }
        : promptPurposeAndHowToUse,
    ];
  } else if (count === 5) {
    selectedTemplates = [
      promptHook,
      promptIngredients,
      promptPrep,
      promptPurposeAndHowToUse,
      includeCTA ? promptCTA : promptNoCTAClosure,
    ];
  } else if (count === 6) {
    selectedTemplates = [
      promptHook,
      promptIngredients,
      promptPrep,
      promptPurposeAndHowToUse,
      includeCTA ? promptCTA : {
        ...promptTransformation,
        title: 'PROMPT 5: Brilho Espelhado e Casa Limpa (9s)',
      },
      includeCTA ? promptTransformation : promptNoCTAClosure,
    ];
  } else if (count === 7) {
    selectedTemplates = [
      promptHook,
      promptIngredients,
      promptPrep,
      promptPurposeAndHowToUse,
      {
        ...promptPrep,
        title: 'PROMPT 5: Medidas Exatas de Colher & Diluição (9s)',
        spokenScript: 'A dosagem certa são duas colheres de bicarbonato para cem ml de vinagre morno, mexendo até dissolver por completo.',
        wordCount: 21,
      },
      includeCTA ? promptCTA : promptNoCTAClosure,
      promptTransformation,
    ];
  } else {
    selectedTemplates = [
      promptHook,
      promptIngredients,
      promptPrep,
      promptPurposeAndHowToUse,
      {
        ...promptPrep,
        title: 'PROMPT 5: Medidas Exatas de Colher & Diluição (9s)',
        spokenScript: 'A dosagem certa são duas colheres de bicarbonato para cem ml de vinagre morno, mexendo até dissolver por completo.',
        wordCount: 21,
      },
      includeCTA ? promptCTA : promptNoCTAClosure,
      promptTransformation,
      {
        ...promptTransformation,
        title: `PROMPT 8: Conclusão e Casa Perfumada Sem Esforço (9s)`,
      },
    ];
  }

  const prompts = selectedTemplates.slice(0, count).map((t, idx) => {
    const stepNum = idx + 1;
    const cleanTitle = t.title.replace(/^PROMPT(\s+\d+)?:?\s*/i, '');
    return {
      ...t,
      step: stepNum,
      title: `PROMPT ${stepNum}: ${cleanTitle}`,
      duration: '00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)',
    };
  });

  return {
    campaignOverview: {
      productName: prod,
      niche: niche || 'Limpeza Pesada & Cuidados com o Lar',
      consistentCharacter: charDesc,
      consistentSetting: setDesc,
      bodyPartModel: modelDesc,
      ingredientsList: [ingredients || 'Bicarbonato de sódio puro, vinagre de álcool morno, detergente neutro e limão fresco'],
      bottleAppearance: suppDesc,
      technicalSpecs: `${String(targetPlatform).toUpperCase()} • ${aspectRatio} • ${resolution} • ${count} Cenas (${count * 9}s)`,
      scientificBacking: defaultScientificBacking,
    },
    prompts,
  };
}

// Endpoint to analyze character image (domestic cleaning specialist / homemaker)
app.post('/api/analyze-character', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem foi fornecida.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const fallbackCharacter = () => ({
      characterName: 'Dona Clara Menezes - Especialista em Limpeza Prática',
      shortSummary: 'Especialista em organização e truques de limpeza com camiseta de algodão e avental de linho elegante (sem jaleco)',
      detailedPromptDescription:
        'Dona Clara Menezes, especialista em organização doméstica e técnicas de limpeza pesada de 42 anos, camiseta de algodão cru e avental discreto de linho cinza elegante (sem jaleco, sem uniforme hospitalar), cabelos castanhos presos de forma natural, feições amigáveis e acolhedoras com pele hiper-realista 8K, poros visíveis e olhar de cumplicidade de dona de casa para dona de casa.',
      englishPromptDescription:
        'A warm and authoritative 42-year-old female domestic cleaning specialist and home organizer, dressed in a comfortable clean cotton t-shirt and an elegant tailored grey linen apron (no lab coat, no medical gear), natural hair neatly tied back, realistic 8K facial skin texture with visible pores and empathetic smile, friendly confident posture, high-end commercial home care aesthetic.',
      isFallbackNotice: 'Perfil de dona de casa e especialista doméstica configurado com padrão de alta fidelidade.',
    });

    const result = await callGeminiWithFallbacks(
      async (modelName) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: `Analise cuidadosamente a imagem desta pessoa para atuar como ESPECIALISTA EM LIMPEZA DOMÉSTICA, ORGANIZADORA E DONA DE CASA EXPERIENTE em comerciais de vídeo IA (Kling/Sora/Runway).
DIRETRIZES DE POLÍTICAS DE ANÚNCIOS (META / GOOGLE / TIKTOK) - REGRAS RÍGIDAS:
1. NUNCA mencione que ela é médica, química industrial com jaleco ou doutora.
2. NUNCA coloque jaleco branco, lab coat, scrub cirúrgico ou estetoscópio.
3. Descreva suas roupas como roupas práticas, elegantes e acolhedoras: camiseta de algodão limpa, avental de linho ou camisa de algodão casual (sem jaleco).

Retorne em formato JSON:
{
  "characterName": "Nome da especialista/dona de casa",
  "shortSummary": "Resumo de 1 linha com vestimenta prática sem jaleco",
  "detailedPromptDescription": "Descrição canônica em Português para consistência visual em todos os prompts",
  "englishPromptDescription": "Description in English tailored for Sora/Kling/Runway 4K with photorealistic facial details and realistic skin pores"
}`,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });

        return JSON.parse(cleanJsonString(response.text || '{}'));
      },
      fallbackCharacter
    );

    return res.json(sanitizeCleaningPrompts(result));
  } catch (error: any) {
    console.log('Serving fallback character analysis');
    return res.json(sanitizeCleaningPrompts({
      characterName: 'Dona Clara Menezes - Especialista em Limpeza Prática',
      shortSummary: 'Especialista em organização e truques de limpeza com camiseta de algodão e avental de linho elegante (sem jaleco)',
      detailedPromptDescription:
        'Dona Clara Menezes, especialista em organização doméstica e técnicas de limpeza pesada de 42 anos, camiseta de algodão cru e avental de linho cinza elegante (sem jaleco), cabelos castanhos presos de forma natural, feições amigáveis e acolhedoras com textura de pele natural 8K, poros visíveis e olhar de profunda empatia.',
      englishPromptDescription:
        'A warm and authoritative 42-year-old female domestic cleaning specialist, dressed in an elegant tailored grey linen apron over clean cotton t-shirt (no lab coat), natural hair tied back, realistic 8K facial skin texture with visible pores and soft empathetic expression, calm reassuring posture, high-end commercial aesthetic.',
      isFallbackNotice: 'Especialista em limpeza configurada com padrão de alta fidelidade.',
    }));
  }
});

// Endpoint to analyze product / bottle image (spray bottle, trigger cleaner, dispenser)
app.post('/api/analyze-supplement', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem foi fornecida.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const fallbackSupplement = () => ({
      productName: 'DesengorduraMax Pro 4K',
      visualSummary: 'Frasco spray borrifador âmbar escuro de 500ml com gatilho ergonômico preto fosco e rótulo minimalista',
      detailedBottleDescription:
        'Frasco borrifador spray âmbar escuro de 500ml com gatilho ergonômico preto fosco de alta pressão, bico com regulagem spray/stream e trava de segurança, rótulo fosco minimalista em tons grafite e verde-limão "DesengorduraMax Pro", contendo líquido límpido brilhante com microbolhas visíveis sob luz de estúdio.',
      englishBottleDescription:
        'A premium 500ml amber spray bottle with an ergonomic matte black trigger sprayer, adjustable nozzle tip, clean minimalist matte label with crisp typography, held firmly in hand facing camera with realistic studio specular highlights, 24fps.',
      isFallbackNotice: 'Embalagem de produto de limpeza configurada com padrão de alta fidelidade.',
    });

    const result = await callGeminiWithFallbacks(
      async (modelName) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: `Analise cuidadosamente o frasco ou embalagem deste PRODUTO DE LIMPEZA DOMÉSTICA (spray, desengordurante, concentrado ou dosador) para ser segurado nos prompts finais de CTA (Kling/Sora/Runway).
Descreva com precisão: cor do frasco (âmbar, fosco, translúcido, branco perolado), gatilho spray ou tampa dosadora, rótulo (cores, tipografia) e formato.
Retorne rigorosamente em JSON:
{
  "productName": "Nome do produto lido no rótulo ou inferido",
  "visualSummary": "Resumo visual em 1 linha",
  "detailedBottleDescription": "Descrição física completa em Português pronta para prompt de vídeo IA",
  "englishBottleDescription": "English description optimized for 4K video prompts (holding the spray bottle with label facing camera)"
}`,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });

        return JSON.parse(cleanJsonString(response.text || '{}'));
      },
      fallbackSupplement
    );

    return res.json(result);
  } catch (error: any) {
    console.log('Serving fallback cleaning bottle analysis');
    return res.json({
      productName: 'DesengorduraMax Pro 4K',
      visualSummary: 'Frasco borrifador spray âmbar de 500ml com gatilho preto fosco e rótulo moderno',
      detailedBottleDescription:
        'Frasco borrifador spray âmbar escuro de 500ml com gatilho ergonômico preto fosco, bico com regulagem spray e stream, rótulo fosco minimalista com tipografia clara, contendo líquido límpido com microbolhas visíveis sob a iluminação acolhedora da cozinha.',
      englishBottleDescription:
        'A premium 500ml amber cleaning spray bottle with ergonomic matte black trigger, fine mist nozzle, clean modern label, held firmly facing camera with studio reflections, 24fps.',
      isFallbackNotice: 'Embalagem do produto de limpeza configurada com padrão de alta fidelidade.',
    });
  }
});

// Endpoint to automatically fill all campaign fields based on user theme/niche in CLEANING & HOUSEWIVES
app.post('/api/autofill-theme', async (req: Request, res: Response) => {
  try {
    const { theme } = req.body;
    if (!theme || !theme.trim()) {
      return res.status(400).json({ error: 'Por favor, informe um problema ou dor do nicho de limpeza doméstica.' });
    }

    const prompt = `Você é o maior estrategista de Direct Response e diretor de arte para comerciais no NICHO DE LIMPEZA DOMÉSTICA, DONAS DE CASA E MISTURINHAS CASEIRAS no Brasil.
Com base no TEMA/PROBLEMA fornecido: "${theme.trim()}", preencha toda a estrutura da campanha com linguagem brasileira natural, autêntica e sem clichês.

REGRAS RÍGIDAS E INVIOLÁVEIS:
1. SEM FRASES CLICHÊS: NUNCA use chavões batidos como "pare tudo", "descubra o segredo milagroso", "fórmula mágica", "o segredo revelado", "sua casa vai virar um palácio". Use linguagem coloquial e empática de donas de casa reais do Brasil ("gordura que não sai nem com bombril", "rejunte encardido de limo", "amarelado de suor no colchão", "sem cansar o braço esfregando").
2. "ingredients": OBRIGATORIAMENTE INGREDIENTES CASEIROS REAIS, SEGUROS E DE FÁCIL ACESSO (da despensa, feira ou mercadinho: Bicarbonato de sódio, Vinagre de álcool branco, Detergente neutro, Limão fresco, Sal grosso, Água oxigenada 10 volumes, Álcool 70%, Sabão de coco ralado, Cravo-da-índia, Óleo de eucalipto). NUNCA misturar cloro/água sanitária com vinagre ou amônia!
3. "scientificBacking": Respaldo químico real (saponificação de ácidos graxos, ação quelante de cálcio pelo ácido acético, clareamento por oxigênio ativo, solvência de lipídios por álcool).
4. "bodyPartModel": MAQUETE GIGANTE DE 1,20M HIPER-REALISTA DA SUJEIRA / SUPERFÍCIE EM CORTE TRANSVERSAL MICROSCÓPICO (camadas de gordura carbonizada na panela, poros do rejunte tomados por hifas de mofo, calcário com sebo no box, fibras do sofá com ácaros e uréia).
5. "productName": Nome comercial forte para o produto de limpeza (DesengorduraMax Pro, RejunteBranco BioPower, CristalBox Anti-Gota, TiraOdor Estofados 360).
6. "characterDescription": Dona de casa ou especialista em organização doméstica com avental de linho elegante ou camiseta de algodão (sem jaleco, sem estetoscópio, sem menção a médico ou cientista industrial).
7. "settingDescription": Cozinha residencial moderna e impecável com bancada de granito polido e iluminação quente 5400K (nunca hospital ou laboratório).

Responda rigorosamente em JSON no formato:
{
  "productName": "string",
  "niche": "string",
  "bodyPartModel": "string",
  "ingredients": "string (ingredientes caseiros de fácil acesso)",
  "scientificBacking": "string",
  "characterDescription": "string",
  "supplementDescription": "string",
  "settingDescription": "string",
  "narratorTone": "string"
}`;

    const result = await callGeminiWithFallbacks(
      async (modelName) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        return sanitizeCleaningPrompts(JSON.parse(cleanJsonString(response.text || '{}')));
      },
      () => {
        const cleanTheme = theme.trim();
        const tLower = cleanTheme.toLowerCase();
        const isGrease = tLower.includes('gordur') || tLower.includes('panela') || tLower.includes('fogão') || tLower.includes('fogao') || tLower.includes('queimad');
        const isGrout = tLower.includes('rejunte') || tLower.includes('mofo') || tLower.includes('azulejo') || tLower.includes('limo');
        const isGlass = tLower.includes('box') || tLower.includes('vidro') || tLower.includes('embaçad') || tLower.includes('calcário');

        if (isGrease) {
          return {
            productName: 'DesengorduraMax Pro 4K',
            niche: 'Crosta preta de gordura vegetal carbonizada no fundo da panela e trempes do fogão que não saem nem com palha de aço',
            bodyPartModel: 'Maquete gigante de 1,20m do fundo de uma panela de alumínio em corte transversal microscópico ampliado 1000x: camadas densas e pretas de gordura polimerizada e carbonizada fundidas nos microporos do metal, exibindo a película oleosa ressecada e impenetrável com textura áspera sob iluminação clínica 8K',
            ingredients: 'Bicarbonato de sódio puro de cozinha, Detergente neutro transparente, Vinagre de álcool branco morno e Suco de meio Limão fresco',
            scientificBacking: 'Comprovado por princípios de química dos tensoativos e saponificação doméstica: A reação do bicarbonato com os ácidos graxos polimerizados quebra as ligações éster da gordura, enquanto o ácido acético desincrusta minerais sem corroer a liga do metal.',
            characterDescription: 'Dona Clara Menezes, especialista em organização doméstica e técnicas de limpeza pesada de 42 anos, camiseta de algodão cru e avental de linho cinza elegante (sem jaleco), feições amigáveis e acolhedoras com pele natural 8K e olhar de cumplicidade de dona de casa para dona de casa',
            supplementDescription: 'Frasco borrifador spray âmbar escuro de 500ml com gatilho ergonômico preto fosco, bico dosador spray/stream e rótulo fosco minimalista "DesengorduraMax Pro", líquido límpido com microbolhas ativas',
            settingDescription: 'Cozinha residencial moderna e impecável com bancada de granito preto São Gabriel polido, fogão cooktop limpo ao fundo e iluminação difusa quente 5400K com bokeh elegante f/1.8',
            narratorTone: 'Prático, Entusiasmado, Cúmplice e Seguro (Ritmo VSL Direct Response Limpeza)',
          };
        }

        if (isGrout) {
          return {
            productName: 'RejunteBranco BioPower 4K',
            niche: 'Rejuntes de azulejo encardidos de preto, mofo impregnado pela umidade do banho e limo persistente',
            bodyPartModel: 'Maquete gigante de 1,20m de uma junta de rejunte entre dois azulejos cerâmicos em corte transversal ampliado: estrutura mineral porosa profundamente colonizada por hifas pretas de fungos filamentosos (mofo) e biofilme gelatinoso de limo entranhado nos poros microscópicos do cimento sob iluminação 8K',
            ingredients: 'Bicarbonato de sódio, Água oxigenada 10 volumes líquida, Vinagre de álcool branco e gotas de detergente neutro',
            scientificBacking: 'Comprovado pela liberação catalítica de oxigênio ativo: O peróxido de hidrogênio decompõe a parede celular dos fungos e degrada a melanina do mofo nos poros do cimento sem corroer o rejunte.',
            characterDescription: 'Dona Vilma Santana, consultora de cuidados com o lar e higienização de 45 anos, blusa leve de linho bege, cabelos presos com grampo natural, olhar empático de quem sabe o cansaço de esfregar azulejo à toa e textura de pele natural 8K',
            supplementDescription: 'Frasco dosador ergonômico branco perolado com bico aplicador de precisão para rejuntes, tampa hermética e rótulo "RejunteBranco BioPower" com detalhes em verde e dourado',
            settingDescription: 'Lavanderia e bancada de apoio moderna com revestimento em porcelanato claro, luz suave difusa 5400K, cestos de fibra natural e detalhes em desfoque cinematográfico ao fundo',
            narratorTone: 'Acolhedor, Revelador, Dinâmico e Convincente (Ritmo VSL Direct Response)',
          };
        }

        if (isGlass) {
          return {
            productName: 'CristalBox Anti-Gota 4K',
            niche: 'Vidro do box esbranquiçado e opaco por acúmulo de gordura corporal, restos de sabonete e manchas de calcário que não saem com água',
            bodyPartModel: 'Maquete gigante de 1,20m de uma lâmina de vidro temperado em corte transversal microscópico ampliado: superfície vítrea coberta por camadas sobrepostas de sais de cálcio e magnésio (calcário) cristalizados entrelaçados com sebo e gordura corporal oxidada, formando película rugosa e opaca sob iluminação 8K',
            ingredients: 'Vinagre de álcool branco concentrado, Detergente neutro transparente, Álcool líquido 70% e 1 colher de Lustra-móveis tradicional para selagem hidrofóbica',
            scientificBacking: 'Comprovado pela ação quelante inorgânica: O ácido acético converte o carbonato de cálcio insolúvel em acetato solúvel em água, enquanto o selante cria tensão superficial hidrofóbica que repele futuras gotas.',
            characterDescription: 'Dona Clara Menezes, especialista em truques caseiros e limpeza prática de 42 anos, camiseta de algodão cru e avental discreto de linho, feições amigáveis, sorriso caloroso e postura ágil',
            supplementDescription: 'Frasco borrifador spray translúcido acetinado com tecnologia anti-gotejamento, gatilho ergonômico preto e rótulo "CristalBox Anti-Gota", líquido cristalino com reflexos azulados límpidos',
            settingDescription: 'Banheiro contemporâneo com bancada de mármore e espelho cristalino com luz difusa quente 5400K, toalhas macias enroladas e vidrarias delicadas em desfoque suave ao fundo',
            narratorTone: 'Prático, Animado, Revelador e Seguro (Ritmo VSL Direct Response)',
          };
        }

        return {
          productName: `${cleanTheme.split(' ')[0]}Max Pro 4K`,
          niche: `Eliminação definitiva e rápida de ${cleanTheme} sem precisar esfregar nem cansar o braço`,
          bodyPartModel: `Maquete gigante de 1,20m de altura hiper-realista exibindo as camadas microscópicas e porosidades de ${cleanTheme} em corte transversal com textura tátil 8K`,
          ingredients: 'Bicarbonato de sódio puro de cozinha, Vinagre de álcool branco morno, Detergente neutro e Suco de Limão fresco',
          scientificBacking: 'Comprovado pelos princípios da química doméstica e tensoativos biodegradáveis: A reação efervescente quebra as forças de adesão da sujeira na superfície, facilitando o enxágue sem abrasão física destrutiva.',
          characterDescription: 'Dona Clara Menezes, especialista em organização doméstica de 42 anos, camiseta de algodão e avental de linho elegante (sem jaleco), olhar amigável e empático com textura de pele natural 8K',
          supplementDescription: 'Frasco borrifador spray âmbar escuro de 500ml com gatilho ergonômico preto fosco e rótulo moderno',
          settingDescription: 'Cozinha residencial moderna e impecável com bancada de granito polido, iluminação suave 5400K difusa e quente e desfoque f/1.8 ao fundo',
          narratorTone: 'Prático, Entusiasmado, Cúmplice e Seguro (Ritmo VSL Direct Response)',
        };
      }
    );

    return res.json(sanitizeCleaningPrompts(result));
  } catch (error: any) {
    console.log('Serving fallback autofill theme data');
    return res.json(sanitizeCleaningPrompts({
      productName: 'DesengorduraMax Pro 4K',
      niche: 'Gordura queimada em panelas e fogão, crosta preta difícil e cansaço de esfregar',
      bodyPartModel: 'Maquete gigante de 1,20m do fundo de panela em corte transversal com camadas pretas de gordura polimerizada e carbonizada fundidas no metal',
      ingredients: 'Bicarbonato de sódio puro, vinagre de álcool morno, detergente neutro e limão fresco',
      scientificBacking: 'Ação desengordurante por saponificação de ácidos graxos e efervescência de CO2.',
      characterDescription: 'Dona Clara Menezes, dona de casa e especialista em limpeza prática de 42 anos, avental de linho elegante (sem jaleco), olhar acolhedor e empático',
      supplementDescription: 'Frasco borrifador spray âmbar escuro de 500ml com gatilho ergonômico preto fosco',
      settingDescription: 'Cozinha moderna impecável com bancada de granito polido e iluminação suave difusa 5400K',
      narratorTone: 'Prático, Entusiasmado, Cúmplice e Seguro (Ritmo VSL Direct Response)',
    }));
  }
});

// Main endpoint to generate the video prompts for CLEANING & HOUSEWIVES
app.post('/api/generate-prompts', async (req: Request, res: Response) => {
  try {
    const {
      productName,
      niche,
      bodyPartModel,
      ingredients,
      scientificBacking,
      characterDescription,
      supplementDescription,
      settingDescription,
      targetPlatform = 'kling',
      aspectRatio = '9:16',
      resolution = '4K UHD Master',
      narratorTone = 'Prático, Entusiasmado, Cúmplice e Seguro (Ritmo VSL Direct Response Limpeza)',
      promptCount = 6,
      includeCTA = true,
    } = req.body;

    const count = Math.min(Math.max(Number(promptCount) || 6, 3), 10);
    const hasCTA = includeCTA !== false;
    const narrativePlan = getNarrativeStructureForCount(count, productName, ingredients, niche, bodyPartModel, hasCTA);

    const systemPrompt = `Você é o maior especialista mundial em criação de Prompts de Vídeo IA (Kling 1.5/2.0, Sora, Runway Gen-3 Alpha, Luma Ray 2) para Vídeos de Vendas (VSL) e Conteúdo de Alta Conversão no MERCADO DE LIMPEZA DOMÉSTICA, DONAS DE CASA E MISTURINHAS CASEIRAS NO BRASIL.

========================================================================
AS 6 REGRAS DE OURO INVIOLÁVEIS DO AGENTE:
========================================================================
REGRA 1: NÃO FALE FRASES CLICHÊS DE FORMA ALGUMA!
- É expressamente PROIBIDO usar chavões batidos como: "pare tudo", "descubra o segredo milagroso", "fórmula mágica", "o segredo revelado", "sua casa vai virar um palácio", "devolver o equilíbrio com amor", "restaure a paz que você merece".
- Use falas reais, sinceras, olho no olho, como uma dona de casa experiente conversa de verdade com outra no Brasil ("gordura preta empedrada", "sem cansar o braço esfregando", "rejunte encardido de limo", "amarelado de suor no colchão", "vidro do box embaçado de sabonete").

REGRA 2: FALAS PARA O PÚBLICO DO BRASIL (PORTUGUÊS BRASILEIRO COLOQUIAL E NATURAL)!
- Use o vocabulário e a cadência real das donas de casa e famílias brasileiras: "panela queimada que não sai nem com bombril", "rejunte preto de mofo no cantinho do box", "gordura grudenta da fritura", "cheiro de xixi de pet no sofá", "crosta no fundo da panela", "ingrediente que você tem aí no armário de casa".
- O texto falado deve soar 100% natural ao ser falado em voz alta.

REGRA 3: NO PROMPT 4, FALE OBRIGATORIAMENTE PRA QUE SERVE E COMO USAR!
- No PROMPT 4, a especialista DEVE EXPLICAR DIRETAMENTE:
  1) PRA QUE SERVE (qual é a função prática da receita: dissolver a gordura velha sem esforço, clarear o rejunte na hora, arrancar manchas de suor do colchão, desobstruir o sifão da pia);
  2) COMO USAR (a aplicação exata e rotina: borrifar na superfície seca, esperar cinco minutos para a espuma agir e passar um paninho de microfibra macio).
- O texto falado do Prompt 4 DEVE TER RIGOROSAMENTE SOMENTE 9 SEGUNDOS (20 a 24 palavras no total)!

REGRA 4: CADA FALA DEVE TER RIGOROSAMENTE SOMENTE 9 SEGUNDOS (NEM MAIS, NEM MENOS)!
- OBRIGAÇÃO MATEMÁTICA: Cada fala (spokenScript) DEVE ter OBRIGATORIAMENTE entre 20 e 24 palavras no total (cadência comercial de 150 palavras por minuto em português brasileiro com pausas naturais de respiração).
- NUNCA ultrapasse 24 palavras nem use menos de 20 palavras.
- Duração exata de 9.0 segundos.

REGRA 5: TODAS AS RECEITAS E MISTURINHAS DEVEM SER 100% REAIS E FUNCIONAIS!
- Proibido inventar receitas perigosas ou inexistentes. Nunca misturar cloro/água sanitária com vinagre ou amônia.
- Baseado em química doméstica real comprovada: bicarbonato, vinagre de álcool branco, detergente neutro, água oxigenada 10 vol, limão, sal grosso, álcool 70%, sabão de coco.

REGRA 6: SEMPRE INGREDIENTES CASEIROS DE FÁCIL ACESSO!
- Apenas ingredientes populares que qualquer dona de casa brasileira tem no armário ou compra no mercadinho da esquina por poucos reais.

DIRETRIZES DE POLÍTICAS DE ANÚNCIOS (META / GOOGLE / TIKTOK / CONAR):
- NUNCA ADICIONE JALECO NO PERSONAGEM NEM FALE QUE ELE É MÉDICO OU CIENTISTA INDUSTRIAL!
- Proibido: "médico", "médica", "doutor", "doutora", "jaleco", "lab coat", "scrub", "estetoscópio".
- Descreva como DONA DE CASA EXPERIENTE OU ESPECIALISTA EM ORGANIZAÇÃO DOMÉSTICA vestindo avental de linho elegante sobre camiseta de algodão (sem jaleco).
- Cenário: COZINHA RESIDENCIAL MODERNA E IMPECÁVEL COM BANCADA DE GRANITO PRETO SÃO GABRIEL POLIDO (nunca laboratório ou consultório).

Sua missão é gerar rigorosamente ${count} PROMPTS SEQUENCIAIS com narrativa cinematográfica perfeita:
- PROMPT 1: Gancho com a Maquete Gigante de 1,20m da sujeira/gordura/rejunte (Foco na dor real sem clichê) (9s • 20-24 palavras)
- PROMPT 2: Nomes dos Ingredientes Caseiros da Despensa (citados em voz alta) (9s • 20-24 palavras)
- PROMPT 3: Como Fazer o Preparo da Misturinha Passo a Passo & Tempo (5 minutos de ação) (9s • 20-24 palavras)
- PROMPT 4: PRA QUE SERVE E COMO USAR NA PRÁTICA (Obrigatório falar pra que serve e como aplicar sem esforço) (9s • 20-24 palavras)
- PROMPT 5 ${hasCTA ? ': Chamada com Frasco de Limpeza em Mãos (CTA "EU QUERO" no direct)' : ': Brilho Espelhado e Casa Limpa Sem Esforço'} (9s • 20-24 palavras)
${count >= 6 ? `- PROMPT 6: Resultado Real e Brilho Espelhado Sem Cansar o Braço (Sem clichê) (9s • 20-24 palavras)` : ''}

${narrativePlan}

DADOS DA CAMPANHA DE LIMPEZA DOMÉSTICA:
- Quantidade de Cenas: ${count} Cenas (Duração Total: ${count * 9} Segundos • SOMENTE 9s POR CENA)
- Produto de Limpeza: ${productName || 'DesengorduraMax Pro 4K'}
- Nicho / Dor da Dona de Casa: ${niche || 'Gordura queimada em panelas e crosta preta no fogão'}
- Maquete Gigante de 1,20m: ${bodyPartModel || 'Maquete gigante de 1,20m do fundo de panela em corte transversal com gordura carbonizada fundida nos microporos do metal'}
- Ingredientes Caseiros de Fácil Acesso: ${ingredients || 'Bicarbonato de sódio puro, detergente neutro, vinagre de álcool morno e limão fresco'}
- Respaldo Químico / Comprovação Real: ${scientificBacking || 'Comprovado por princípios de tensoativos e saponificação de ácidos graxos'}
- Descrição da Personagem: ${characterDescription || 'Dona Clara Menezes, especialista em organização doméstica de 42 anos, camiseta de algodão cru e avental de linho elegante (sem jaleco), olhar amigável e empático'}
- Descrição da Embalagem/Frasco: ${supplementDescription || 'Frasco borrifador spray âmbar escuro de 500ml com gatilho ergonômico preto fosco e rótulo moderno'}
- Cenário: ${settingDescription || 'Cozinha residencial moderna e impecável com bancada de granito preto São Gabriel polido, iluminação suave difusa 5400K e fogão limpo ao fundo em desfoque'}
- Plataforma Alvo: ${targetPlatform}
- Proporção: ${aspectRatio}
- Resolução: ${resolution}
- Tom da Narração: ${narratorTone}

Você deve gerar a resposta rigorosamente em formato JSON com o seguinte schema contendo EXATAMENTE ${count} prompts no array:
{
  "campaignOverview": {
    "productName": "string",
    "niche": "string",
    "consistentCharacter": "string (descrição canônica da dona de casa/especialista usada em todos os prompts, sem jaleco)",
    "consistentSetting": "string (descrição canônica da cozinha acolhedora usada em todos os prompts)",
    "bodyPartModel": "string",
    "ingredientsList": ["string"],
    "bottleAppearance": "string",
    "technicalSpecs": "string",
    "scientificBacking": "string (respaldo químico/físico comprovando a eficácia real dos ingredientes)",
    "recipeStepByStep": {
      "prepTime": "string (ex: 2 minutos de mistura)",
      "totalReadyTime": "string (ex: Pronto em exatamente 5 minutos de ação sem esfregar)",
      "difficulty": "string (ex: Muito Fácil • Ingredientes que você tem na despensa)",
      "servings": "string (ex: Rende 500ml de solução potente ou 1 aplicação completa)",
      "ingredientsWithMeasurements": ["string com quantidades e medidas de colher/xícara"],
      "steps": [
        {
          "stepNumber": 1,
          "title": "string",
          "instruction": "string detalhada de como fazer passo a passo",
          "timeEstimate": "string",
          "keyIngredient": "string"
        }
      ],
      "howToConsume": "string detalhando como aplicar na superfície, tempo de espera e remoção com pano",
      "safetyNotice": "string com segurança para as superfícies e ausência de vapores tóxicos",
      "scientificBacking": "string com respaldo técnico da reação"
    }
  },
  "prompts": [
    {
      "step": 1,
      "title": "string",
      "duration": "00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)",
      "goal": "string",
      "spokenScript": "Falas exatas em Português do Brasil sem clichês (RIGOROSAMENTE ENTRE 20 E 24 PALAVRAS PARA DURAR SOMENTE 9 SEGUNDOS)",
      "wordCount": 22,
      "voiceDirection": "string",
      "facialExpressionsAndHumanRealism": "string",
      "handMovements": "string",
      "cameraAndLighting": "string",
      "videoPromptVisual": "string",
      "videoPromptEnglish": "string",
      "engineParameters": "string",
      "scientificBacking": "string",
      "recipeStepDetail": "string",
      "timeToReady": "string"
    }
  ]
}`;

    const parsed = await callGeminiWithFallbacks(
      async (modelName) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });
        const rawJson = sanitizeCleaningPrompts(JSON.parse(cleanJsonString(response.text || '{}')));
        if (rawJson && Array.isArray(rawJson.prompts)) {
          rawJson.prompts = rawJson.prompts.map((p: any) => calibrateAndEnforceStrictNineSeconds(p));
        }
        return rawJson;
      },
      () => {
        const fallback = sanitizeCleaningPrompts(buildFallbackPromptsResponse(req.body));
        if (fallback && Array.isArray(fallback.prompts)) {
          fallback.prompts = fallback.prompts.map((p: any) => calibrateAndEnforceStrictNineSeconds(p));
        }
        return fallback;
      }
    );

    return res.json(parsed);
  } catch (error: any) {
    console.log('Serving guaranteed prompts on exception');
    const fallback = sanitizeCleaningPrompts(buildFallbackPromptsResponse(req.body));
    if (fallback && Array.isArray(fallback.prompts)) {
      fallback.prompts = fallback.prompts.map((p: any) => calibrateAndEnforceStrictNineSeconds(p));
    }
    return res.json(fallback);
  }
});

// Endpoint to refine a specific prompt
app.post('/api/refine-prompt', async (req: Request, res: Response) => {
  try {
    const { promptData, instruction, characterDescription, settingDescription, supplementDescription } = req.body;

    const result = await callGeminiWithFallbacks(
      async (modelName) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Você é um diretor de vídeo IA para VSL do nicho de limpeza doméstica, donas de casa e cuidados com o lar no Brasil.
REGRA INVIOLÁVEL 1: NUNCA USE FRASES CLICHÊS! Use linguagem brasileira coloquial, natural e empática de dona de casa para dona de casa.
REGRA INVIOLÁVEL 2: A fala DEVE ter RIGOROSAMENTE SOMENTE 9 SEGUNDOS (entre 20 e 24 palavras no total).
REGRA INVIOLÁVEL 3: Se for o PROMPT 4, explique expressamente PRA QUE SERVE E COMO USAR.
REGRA INVIOLÁVEL 4: NUNCA adicione jaleco no personagem nem fale que ele é médico ou cientista industrial!
REGRA INVIOLÁVEL 5: Use SEMPRE ingredientes caseiros de fácil acesso e receitas seguras e reais.

Instrução do usuário: "${instruction}"

Dados atuais do Prompt:
${JSON.stringify(promptData, null, 2)}

Personagem obrigatória: ${characterDescription}
Cenário obrigatório: ${settingDescription}
Produto de limpeza: ${supplementDescription}

Retorne em JSON com o mesmo formato do prompt:
{
  "step": ${promptData.step},
  "title": "${promptData.title}",
  "duration": "00:00 - 00:09 (SOMENTE 9 SEGUNDOS EXATOS)",
  "goal": "${promptData.goal}",
  "spokenScript": "Falas em Português do Brasil sem clichês (RIGOROSAMENTE ENTRE 20 E 24 PALAVRAS PARA SOMENTE 9s)",
  "wordCount": 22,
  "voiceDirection": "Direção vocal de dona de casa",
  "facialExpressionsAndHumanRealism": "Realismo humano atualizado",
  "handMovements": "Movimentos das mãos",
  "cameraAndLighting": "Câmera e iluminação",
  "videoPromptVisual": "Prompt visual refinado em Português",
  "videoPromptEnglish": "Prompt visual refinado em Inglês 4K",
  "engineParameters": "${promptData.engineParameters}",
  "scientificBacking": "${promptData.scientificBacking || 'Comprovado por princípios de tensoativos e saponificação'}",
  "recipeStepDetail": "${promptData.recipeStepDetail || 'Etapa da misturinha'}",
  "timeToReady": "${promptData.timeToReady || 'Pronto em 5 minutos'}"
}`,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const refined = sanitizeCleaningPrompts(JSON.parse(cleanJsonString(response.text || '{}')));
        return calibrateAndEnforceStrictNineSeconds(refined);
      },
      () => calibrateAndEnforceStrictNineSeconds(sanitizeCleaningPrompts({
        ...promptData,
        videoPromptVisual: `${promptData.videoPromptVisual} [Ajuste solicitado: ${instruction}]`,
        videoPromptEnglish: `${promptData.videoPromptEnglish} (Enhanced visual detail: ${instruction})`,
      }))
    );

    return res.json(sanitizeCleaningPrompts(result));
  } catch (error: any) {
    console.log('Serving fallback refined prompt');
    const { promptData, instruction } = req.body || {};
    return res.json(calibrateAndEnforceStrictNineSeconds(sanitizeCleaningPrompts({
      ...(promptData || {}),
      videoPromptVisual: `${promptData?.videoPromptVisual || ''} [Ajuste: ${instruction || ''}]`,
      videoPromptEnglish: `${promptData?.videoPromptEnglish || ''} (Enhanced visual: ${instruction || ''})`,
    })));
  }
});

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
    return res.status(400).json({
      error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.',
    });
  }

  ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  return app(req, res);
}
