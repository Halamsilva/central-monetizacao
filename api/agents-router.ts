import meninaDaRocaHandler from '../server-agents/menina-da-roca.js';
import narracaoHandler from '../server-agents/narracao.js';
import novelinhasHandler from '../server-agents/novelinhas.js';
import povHandler from '../server-agents/pov.js';
import remixVideoHandler from '../server-agents/remix-video.js';
import revisorVeo3Handler from '../server-agents/revisor-veo-3.js';
import tiktokShopPersuasivoHandler from '../server-agents/tiktok-shop-persuasivo.js';
import transformacaoVideosHandler from '../server-agents/transformacao-videos.js';
import geradorImagensHandler from '../server-agents/gerador-imagens.js';

const handlers: Record<string, (req: any, res: any) => Promise<any> | any> = {
  'menina-da-roca': meninaDaRocaHandler,
  narracao: narracaoHandler,
  novelinhas: novelinhasHandler,
  pov: povHandler,
  'remix-video': remixVideoHandler,
  'revisor-veo-3': revisorVeo3Handler,
  'tiktok-shop-persuasivo': tiktokShopPersuasivoHandler,
  'transformacao-videos': transformacaoVideosHandler,
  'gerador-imagens': geradorImagensHandler,
};

export default function handler(req: any, res: any) {
  const agentParam = req.query?.agent;
  const agent = Array.isArray(agentParam) ? agentParam[0] : agentParam;
  const selectedHandler = typeof agent === 'string' ? handlers[agent] : null;

  if (!selectedHandler) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  return selectedHandler(req, res);
}
