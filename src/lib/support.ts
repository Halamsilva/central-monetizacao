export const SUPPORT_WHATSAPP = '5531982560211';

export const whatsappLink = (message: string) =>
  `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;

export const WHATSAPP_DEFAULT_MESSAGE =
  'Ola! Preciso de ajuda com meu acesso na Central Monetizacao.';

export const WHATSAPP_COMMUNITY_LINK = 'https://chat.whatsapp.com/BCXF8wwP7YWKHbObHf1Q1o';

export const WHATSAPP_COMMUNITY_MESSAGE =
  'Ola! Quero entrar na comunidade da Central Monetizacao.';
