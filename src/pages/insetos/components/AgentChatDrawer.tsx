import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Sparkles, ArrowRight, CornerDownLeft, RefreshCw } from 'lucide-react';
import { ChatMessage, VideoScript } from '../types';
import { supabase } from '../../../lib/supabase';

interface AgentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScript: (script: VideoScript) => void;
}

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  isOpen,
  onClose,
  onApplyScript,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      text: 'Olá! Sou o AGENTE ESPECIALISTA EM RECEITAS CASEIRAS CONTRA PRAGAS E INSETOS.\n\nPosso transformar qualquer praga (baratas, ratos, formigas, mosquitos, escorpiões, etc.) em uma sequência perfeita de prompts de 8s (formato vertical 9:16, 4K ultra-realista com maquete colossal, preparo ao vivo e modo de aplicação).\n\nPara começar, diga “vamos começar?” ou envie seu tema diretamente!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData?.session?.access_token || '';
      const res = await fetch('/api/agents/insetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ action: 'chat', message: query.trim() })
      });

      const data = await res.json();

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.reply || 'Processamento concluído.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        script: data.script || undefined
      };

      setMessages((prev) => [...prev, agentMsg]);

      // If script was generated automatically in chat, offer or auto-apply
      if (data.script) {
        onApplyScript(data.script);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-err-${Date.now()}`,
          sender: 'agent',
          text: 'Qual é o tema? Pode enviar também o vídeo ou as imagens de referência.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="agent-chat-drawer" className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-emerald-900/60 bg-[#0c1410] shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-900/40 bg-[#0e1713] p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900/80 border border-emerald-600/40 text-emerald-300">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Exterminador Caseiro
            </h3>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online • Prompts Virais 8s
            </span>
          </div>
        </div>

        <button
          id="btn-close-chat"
          onClick={onClose}
          className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-900/40 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isAgent
                    ? 'rounded-tl-none border border-emerald-900/50 bg-[#121f18] text-emerald-100 shadow-sm'
                    : 'rounded-tr-none bg-emerald-600 text-white shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                {/* If a script was generated inside this message */}
                {msg.script && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-800/40 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{msg.script.theme}</span>
                    </div>
                    <span className="text-[10px] text-emerald-300/80">
                      {msg.script.prompts.length} Prompts de 8s (00:00 a 00:56) gerados com sucesso!
                    </span>
                    <button
                      onClick={() => {
                        onApplyScript(msg.script!);
                        onClose();
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors"
                    >
                      <span>Visualizar Sequência de Prompts</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-emerald-400/50 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2 text-xs text-emerald-400/80 italic p-2 bg-[#121f18] rounded-xl border border-emerald-900/40 w-fit">
            <div className="h-3 w-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <span>Agente Corpo Revelado está formulando os prompts...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Triggers from User Prompt Spec */}
      <div className="border-t border-emerald-900/30 bg-[#0d1611] px-3 py-2">
        <span className="text-[10px] font-semibold text-emerald-400/70 block mb-1">
          Gatilhos de Conversa Oficiais:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {['vamos começar?', 'novo vídeo', 'vamos fazer outro', 'Tártaro e clareamento dental', 'Gordura no fígado'].map((trigger, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(trigger)}
              className="rounded-md border border-emerald-900/60 bg-[#14231b] px-2 py-0.5 text-[10px] text-emerald-300 hover:border-emerald-600 hover:text-white transition-colors"
            >
              {trigger}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t border-emerald-900/40 bg-[#0e1713] p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="chat-input-text"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ex: vamos começar? ou envie seu tema..."
            className="flex-1 rounded-lg border border-emerald-900/70 bg-[#0a110d] px-3 py-2 text-xs text-white placeholder:text-emerald-600/40 focus:border-emerald-500 focus:outline-none"
          />
          <button
            id="btn-send-chat"
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
