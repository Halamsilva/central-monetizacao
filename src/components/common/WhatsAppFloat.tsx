import React from 'react';
import { MessageCircle } from 'lucide-react';
import { whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from '../../lib/support';

const WhatsAppFloat: React.FC = () => (
  <a
    href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE)}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Falar no WhatsApp"
    title="Falar no WhatsApp"
    className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 transition hover:scale-105"
  >
    <MessageCircle size={26} />
  </a>
);

export default WhatsAppFloat;
