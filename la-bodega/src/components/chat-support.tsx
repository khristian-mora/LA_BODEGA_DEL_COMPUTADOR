'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  role: 'user' | 'support';
  content: string;
  timestamp: Date;
}

const FAQ = [
  { question: '¿Cómo realizo un pedido?', answer: 'Selecciona los productos, agrégalos al carrito y proceed al checkout.' },
  { question: '¿Cuál es el tiempo de entrega?', answer: '3-7 días hábiles dentro de Colombia.' },
  { question: '¿Tienen garantía?', answer: 'Todos los productos incluyen garantía del fabricante (1 año).' },
  { question: '¿Cómo contacto soporte técnico?', answer: 'Puedes usar este chat o llamar al (1) 123-4567.' },
  { question: '¿Aceptan devoluciones?', answer: 'Sí, dentro de 30 días con empaque original.' },
];

export function ChatSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'support',
      content: '¡Hola! Soy el asistente de La Bodega del Computador. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAutoResponse(input);
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'support',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, supportMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getAutoResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    for (const faq of FAQ) {
      if (lowerQuestion.includes(faq.question.toLowerCase().split(' ')[0])) {
        return faq.answer;
      }
    }

    if (lowerQuestion.includes('pedido') || lowerQuestion.includes('comprar')) {
      return FAQ[0].answer;
    }
    if (lowerQuestion.includes('entrega') || lowerQuestion.includes('tiempo')) {
      return FAQ[1].answer;
    }
    if (lowerQuestion.includes('garantía') || lowerQuestion.includes('garantia')) {
      return FAQ[2].answer;
    }
    if (lowerQuestion.includes('contacto') || lowerQuestion.includes('soporte')) {
      return FAQ[3].answer;
    }
    if (lowerQuestion.includes('devolución') || lowerQuestion.includes('devolver')) {
      return FAQ[4].answer;
    }

    return 'Gracias por tu mensaje. Un agente de soporte te responderá en breve. ¿Hay algo más en lo que pueda ayudarte?';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50 flex items-center justify-center"
          aria-label="Abrir chat de soporte"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-200">
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Soporte La Bodega</h3>
                <p className="text-xs text-blue-100">En línea ahora</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'support' && (
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1"
              />
              <Button onClick={handleSend} size="icon" className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
