import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export default function AIChat({ role }: { role: UserRole }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      text: 'مرحباً بك في المساعد الذكي لسيستم POS. كيف يمكنني مساعدتك اليوم؟'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text, role, history: [...messages, userMessage] })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Network response was not ok');

      const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: data.reply };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error(error);
      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: `عذراً، حدث خطأ أثناء الاتصال بالخادم: ${error.message}` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden flex-1 animate-fade-in-up transition-shadow duration-300">
      <div className="p-4 border-b border-slate-100 flex items-center justify-center shrink-0 bg-white">
        <h2 className="font-semibold text-slate-700 text-lg">المساعد الذكي</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 bg-white max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 transition-transform ${
              msg.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-teal-600 text-white shadow-sm'
            }`}>
              {msg.role === 'user' ? (
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>robot_2</span>
              )}
            </div>
            
            <div className={`flex-1 transition-all duration-300 ${msg.role === 'user' ? 'rtl flex justify-end text-right' : 'rtl'}`}>
              <div className={`inline-block ${
                msg.role === 'user' 
                  ? 'bg-slate-100 text-slate-800 rounded-2xl px-5 py-3 text-sm leading-relaxed max-w-[85%]' 
                  : 'text-slate-700 rounded-2xl text-sm leading-relaxed max-w-[95%]'
              }`}>
                {msg.role === 'user' ? (
                  <p>{msg.text}</p>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-6 animate-fade-in-up rtl">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-teal-600 text-white shadow-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>robot_2</span>
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 h-10 px-2 text-slate-400">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white shrink-0 max-w-4xl mx-auto w-full">
        <form onSubmit={handleSend} className="relative flex items-center group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="أرسل رسالة إلى المساعد..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-3.5 pr-6 pl-14 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:opacity-50 text-slate-800 shadow-sm"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute left-2 w-9 h-9 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white rounded-full transition-all flex items-center justify-center hover:scale-105 active:scale-95 disabled:transform-none"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', transform: 'scaleX(-1)' }}>arrow_upward</span>
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          يمكن للمساعد الذكي ارتكاب أخطاء. يرجى التحقق من المعلومات المهمة.
        </p>
      </div>
    </div>
  );
}
