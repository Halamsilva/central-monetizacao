import { Agent } from './supabase';

export const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    title: 'Roteirista de TikTok Shop',
    description: 'Cria roteiros altamente persuasivos para vídeos de venda de produtos no TikTok Shop.',
    prompt: 'Atue como um especialista em TikTok Shop. Seu objetivo é criar um roteiro de 30 a 60 segundos para o produto [PRODUTO]...',
    category: 'TikTok Shop',
    tag: 'NOVO',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Viralizer Reels / Shorts',
    description: 'Transforma ideias simples em ganchos virais para vídeos curtos.',
    prompt: 'Analise o seguinte assunto: [ASSUNTO]. Crie 5 opções de ganchos (hooks) que prendam a atenção nos primeiros 3 segundos...',
    category: 'IA para Conteúdo',
    tag: 'PREMIUM',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Copywriter para Facebook',
    description: 'Especialista em criar copies que não dão bloqueio e vendem muito.',
    prompt: 'Escreva uma copy para um anúncio de Facebook seguindo a estrutura AIDA...',
    category: 'Facebook Monetização',
    tag: 'EXCLUSIVO',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

