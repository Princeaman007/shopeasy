'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role:    'user' | 'assistant';
  content: string;
}

interface Lead {
  name:     string;
  phone:    string;
  email?:   string;
  message?: string;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function KoffiWidget() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  /**
   * Scroll automatique vers le dernier message
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Message de bienvenue quand le chat s'ouvre
   */
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role:    'assistant',
          content: 'Bonjour ! 👋 Je suis Koffi, votre assistant ShopEasy CI.\n\nJe peux vous aider à créer votre boutique en ligne et répondre à toutes vos questions. Par où voulez-vous commencer ?',
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
   * Sauvegarde le lead via l'API backend
   */
  const saveLead = async (lead: Lead) => {
    try {
      const response = await fetch(
        `/api/api/leads`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(lead),
        }
      );
      if (response.ok) {
        console.log('✅ Lead sauvegardé :', lead.name);
      } else {
        console.error('Erreur sauvegarde lead — statut :', response.status);
      }
    } catch (error) {
      console.error('Erreur sauvegarde lead :', error);
    }
  };

  /**
   * Envoie un message à Koffi
   */
  const sendMessage = async () => {
    const texte = input.trim();
    if (!texte || isLoading) return;

    const nouveauMessage: Message = { role: 'user', content: texte };
    const nouveauxMessages        = [...messages, nouveauMessage];

    setMessages(nouveauxMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages: nouveauxMessages.map((m) => ({
            role:    m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Erreur réseau');

      // Ajoute la réponse de Koffi
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message },
      ]);

      // Sauvegarde le lead si détecté (une seule fois)
      if (data.lead && !leadSaved) {
        console.log('💾 Tentative sauvegarde lead:', data.lead);
        await saveLead(data.lead);
        setLeadSaved(true);
      }
    } catch (error) {
      console.error('Erreur chat :', error);
      setMessages((prev) => [
        ...prev,
        {
          role:    'assistant',
          content: 'Désolé, une erreur est survenue. Réessayez dans quelques instants. 🙏',
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  /**
   * Envoi avec la touche Entrée
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* ── Bulle de chat ── */}
        {isOpen && (
          <div className="flex flex-col w-[360px] h-[520px] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-border">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                    <Bot size={20} className="text-black" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-black" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Koffi</p>
                  <p className="text-primary text-xs">Assistant ShopEasy CI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-white transition-colors p-1 rounded-lg hover:bg-elevated"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-primary flex-shrink-0 flex items-center justify-center mt-1">
                      <Bot size={14} className="text-black" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-primary text-black rounded-tr-sm font-medium'
                        : 'bg-elevated text-white rounded-tl-sm'
                    }`}
                  >
                    {message.content}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-elevated flex-shrink-0 flex items-center justify-center mt-1">
                      <User size={14} className="text-muted" />
                    </div>
                  )}
                </div>
              ))}

              {/* Indicateur de frappe */}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                    <Bot size={14} className="text-black" />
                  </div>
                  <div className="bg-elevated px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-black">
              <div className="flex gap-2 items-center bg-elevated rounded-xl px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrivez votre message..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-white placeholder-muted text-sm outline-none disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {isLoading
                    ? <Loader2 size={14} className="text-black animate-spin" />
                    : <Send size={14} className="text-black" />
                  }
                </button>
              </div>
              <p className="text-center text-muted text-xs mt-2">
                Propulsé par <span className="text-primary font-medium">ShopEasy CI</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Bouton flottant ── */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary-hover shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          {isOpen
            ? <X size={22} className="text-black" />
            : <MessageCircle size={22} className="text-black" />
          }
        </button>
      </div>
    </>
  );
}