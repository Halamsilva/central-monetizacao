import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUp,
  Bot,
  Check,
  Copy,
  Loader2,
  MessageSquarePlus,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { notifyQuotaExceeded } from '../../lib/missingApiKey';

type StoredMessage = {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

const PRESETS = [
  {
    label: 'Roteiro de novelinha',
    prompt:
      'Crie um roteiro de novelinha com 5 cenas sobre [tema]. Gancho forte nos 3 primeiros segundos, drama crescente e final com gancho para a parte 2. Formato: Cena, fala, acao e prompt de video 9:16.',
  },
  {
    label: 'Gancho viral',
    prompt: 'Crie 10 ganchos virais de 9 segundos para um video sobre [tema], no estilo novelinha.',
  },
  {
    label: 'Prompts de video',
    prompt:
      'Transforme esta ideia em 5 prompts de video 9:16 para IA de video, com camera, luz e movimento: [ideia].',
  },
  {
    label: 'Legenda + hashtags',
    prompt: 'Escreva uma legenda com CTA e 20 hashtags para um video sobre [tema].',
  },
];

const ChatIA: React.FC = () => {
  const { user } = useAuth();

  const [stored, setStored] = useState<StoredMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const loadMessages = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data, error: loadError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(400);

      if (loadError) {
        console.error('Erro ao carregar chat:', loadError);
        setError('Nao consegui carregar seu historico agora.');
        setStored([]);
        return;
      }

      setStored(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const conversations = useMemo(() => {
    const map = new Map<string, StoredMessage[]>();

    stored.forEach((message) => {
      const list = map.get(message.conversation_id) || [];
      list.push(message);
      map.set(message.conversation_id, list);
    });

    return Array.from(map.entries())
      .map(([id, list]) => {
        const ordered = [...list].sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
        const firstUser = ordered.find((item) => item.role === 'user');

        return {
          id,
          title: (firstUser?.content || 'Conversa').replace(/\s+/g, ' ').slice(0, 70),
          updatedAt: ordered[ordered.length - 1]?.created_at || '',
        };
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [stored]);

  const currentMessages = useMemo(
    () =>
      stored
        .filter((message) => message.conversation_id === conversationId)
        .sort((a, b) => (a.created_at > b.created_at ? 1 : -1)),
    [stored, conversationId]
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [currentMessages.length, streamText]);

  const startNewChat = () => {
    if (sending) return;
    setConversationId(null);
    setInput('');
    setError('');
    textareaRef.current?.focus();
  };

  const deleteConversation = async (id: string) => {
    if (!user?.id) return;
    if (!window.confirm('Apagar esta conversa?')) return;

    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id)
      .eq('conversation_id', id);

    if (deleteError) {
      setError('Nao consegui apagar a conversa.');
      return;
    }

    setStored((prev) => prev.filter((message) => message.conversation_id !== id));

    if (conversationId === id) setConversationId(null);
  };

  const persist = async (message: StoredMessage) => {
    const { error: insertError } = await supabase.from('chat_messages').insert([message]);

    if (insertError) {
      console.error('Erro ao salvar mensagem do chat:', insertError);
    }
  };

  const copyMessage = async (message: StoredMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // clipboard bloqueado
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
  };

  const sendMessage = async () => {
    if (!user?.id || sending) return;

    const text = input.trim();
    if (!text) return;

    const convId = conversationId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    const now = new Date().toISOString();

    const userMessage: StoredMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : `u-${Date.now()}`,
      user_id: user.id,
      conversation_id: convId,
      role: 'user',
      content: text,
      created_at: now,
    };

    const history = [
      ...stored.filter((message) => message.conversation_id === convId),
      userMessage,
    ].map((message) => ({ role: message.role, content: message.content }));

    setConversationId(convId);
    setStored((prev) => [...prev, userMessage]);
    setInput('');
    setError('');
    setSending(true);
    setStreamText('');
    persist(userMessage);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || '';

      const response = await fetch('/api/agents/chat-ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: history.slice(-24) }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Nao consegui falar com a IA agora.');
      }

      if (!response.body) {
        throw new Error('A IA nao devolveu resposta.');
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
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw);

            if (parsed === '[DONE]') continue;

            if (parsed?.warning === 'student-key-quota') {
              notifyQuotaExceeded();
            }

            if (parsed?.error) {
              throw new Error(String(parsed.error));
            }

            if (parsed?.text) {
              accumulated += String(parsed.text);
              setStreamText(accumulated);
            }
          } catch (parseError: any) {
            if (parseError?.message && parseError.message !== 'Unexpected end of JSON input') {
              throw parseError;
            }
          }
        }
      }

      const finalText = accumulated.trim();

      if (finalText) {
        const assistantMessage: StoredMessage = {
          id: crypto.randomUUID ? crypto.randomUUID() : `a-${Date.now()}`,
          user_id: user.id,
          conversation_id: convId,
          role: 'assistant',
          content: finalText,
          created_at: new Date().toISOString(),
        };

        setStored((prev) => [...prev, assistantMessage]);
        persist(assistantMessage);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        const partial = accumulated.trim();

        if (partial) {
          const assistantMessage: StoredMessage = {
            id: crypto.randomUUID ? crypto.randomUUID() : `a-${Date.now()}`,
            user_id: user.id,
            conversation_id: convId,
            role: 'assistant',
            content: partial,
            created_at: new Date().toISOString(),
          };

          setStored((prev) => [...prev, assistantMessage]);
          persist(assistantMessage);
        }
      } else {
        setError(err?.message || 'Erro ao conversar com a IA.');
      }
    } finally {
      abortRef.current = null;
      setSending(false);
      setStreamText('');
    }
  };

  const isEmpty = currentMessages.length === 0 && !streamText;

  return (
    <div className="flex h-[calc(100vh-150px)] min-h-[540px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950/80 lg:flex">
        <div className="p-3">
          <button
            type="button"
            onClick={startNewChat}
            disabled={sending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-xs font-black uppercase tracking-wide text-black transition hover:brightness-110 disabled:opacity-50"
          >
            <MessageSquarePlus size={15} /> Nova conversa
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          {conversations.length === 0 ? (
            <p className="px-2 py-3 text-[11px] font-semibold text-slate-600">Suas conversas aparecem aqui.</p>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-xl px-2 transition ${
                  conversation.id === conversationId ? 'bg-slate-800' : 'hover:bg-slate-800/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setConversationId(conversation.id)}
                  className="min-w-0 flex-1 py-2.5 text-left"
                >
                  <span className="block truncate text-[11px] font-bold text-slate-300">{conversation.title}</span>
                  <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                    {new Date(conversation.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => deleteConversation(conversation.id)}
                  className="rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:bg-slate-700 hover:text-red-400 group-hover:opacity-100"
                  aria-label="Apagar conversa"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
              <Bot size={18} />
            </span>
            <div>
              <h1 className="text-sm font-black tracking-tight">Chat IA</h1>
              <p className="text-[10px] font-semibold text-slate-500">Roteiros, ganchos, legendas e prompts</p>
            </div>
          </div>

          <button
            type="button"
            onClick={startNewChat}
            disabled={sending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50 lg:hidden"
          >
            <MessageSquarePlus size={14} /> Nova
          </button>
        </header>

        {error && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[11px] font-semibold text-red-200">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span className="whitespace-pre-line">
              {error}
              {/chave/i.test(error) && (
                <>
                  {' '}
                  <Link to="/settings" className="underline">
                    Abrir Configuracoes
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                <Sparkles size={26} />
              </span>
              <h2 className="mt-4 text-lg font-black">Como posso te ajudar hoje?</h2>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
                Converse como no ChatGPT: peca um roteiro, ajuste, transforme em prompts de video, crie legendas. Ele lembra do
                contexto da conversa.
              </p>

              <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setInput(preset.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-left transition hover:border-orange-500/40 hover:bg-slate-900"
                  >
                    <span className="block text-[11px] font-black text-slate-200">{preset.label}</span>
                    <span className="mt-0.5 block line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                      {preset.prompt.replace('[tema]', '...').replace('[ideia]', '...')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {currentMessages.map((message) => {
                const isUser = message.role === 'user';

                return (
                  <div key={message.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                        <Bot size={14} />
                      </span>
                    )}

                    <div
                      className={`group relative w-fit max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-orange-500 text-black'
                          : 'border border-slate-800 bg-slate-900/80 text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => copyMessage(message)}
                          className="absolute -right-8 top-1 rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:bg-slate-800 hover:text-slate-300 group-hover:opacity-100"
                          aria-label="Copiar resposta"
                        >
                          {copiedId === message.id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {streamText && (
                <div className="flex gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                    <Bot size={14} />
                  </span>
                  <div className="w-fit max-w-[85%] rounded-2xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm leading-relaxed text-slate-200">
                    <p className="whitespace-pre-wrap break-words">{streamText}</p>
                  </div>
                </div>
              )}

              {sending && !streamText && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <Loader2 size={13} className="animate-spin" /> Pensando...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 p-3">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-2 focus-within:border-orange-500">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              maxLength={8000}
              placeholder="Peca um roteiro, gancho, legenda... (Enter envia, Shift+Enter quebra linha)"
              className="max-h-40 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-sm font-medium text-slate-100 outline-none placeholder:text-slate-600"
            />

            {sending ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-slate-200 transition hover:bg-slate-600"
                aria-label="Parar"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-black transition hover:brightness-110 disabled:opacity-40"
                aria-label="Enviar"
              >
                <ArrowUp size={17} />
              </button>
            )}
          </div>

          <p className="mx-auto mt-2 max-w-3xl text-center text-[9px] font-semibold uppercase tracking-wide text-slate-600">
            Chat com IA · usa a sua chave do Google AI Studio
          </p>
        </div>
      </main>
    </div>
  );
};

export default ChatIA;
