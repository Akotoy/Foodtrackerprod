
import { useState, useEffect, useRef } from "react";
import PageHeader from "../components/PageHeader";
import api from "../api";

export default function AiCoach() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const load = async () => {
          try {
              const res = await api.get('/chat-history');
              if (res.data && res.data.length > 0) setHistory(res.data);
              else setHistory([{ role: 'assistant', content: 'Привет! Я твой нутрициолог. Чем помочь?' }]);
          } catch (e) {}
      };
      load();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, loading]);

  const send = async () => {
      if (!message.trim() || loading) return;
      const txt = message.trim();
      setMessage("");
      setHistory(p => [...p, { role: 'user', content: txt }]);
      setLoading(true);
      try {
          const res = await api.post('/ai-chat', { message: txt, history: history.slice(-10) });
          setHistory(p => [...p, { role: 'assistant', content: res.data.reply }]);
      } catch (e) { setHistory(p => [...p, { role: 'assistant', content: 'Ошибка связи.' }]); }
      finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--ios-bg)]">
      <PageHeader title="AI Coach" showBack={false} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
         {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs mr-2 shrink-0">🤖</div>}
                <div className={`px-4 py-3 rounded-[20px] text-[15px] leading-snug max-w-[80%] shadow-sm ${
                    msg.role === 'user' 
                        ? 'bg-[var(--ios-blue)] text-white rounded-br-sm' 
                        : 'bg-[var(--ios-card)] text-[var(--ios-text)] rounded-bl-sm border border-[var(--ios-separator)]'
                }`}>
                    {msg.content}
                </div>
            </div>
         ))}
         {loading && <div className="text-[var(--ios-hint)] text-xs ml-12 animate-pulse">Печатает...</div>}
         <div ref={bottomRef} className="h-4" />
      </div>

      <div className="p-2 pb-safe bg-[var(--ios-card)] border-t border-[var(--ios-separator)] flex items-end gap-2">
         <textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Сообщение..." 
            className="flex-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-[20px] px-4 py-3 text-[var(--ios-text)] outline-none resize-none max-h-32 focus:ring-2 focus:ring-[var(--ios-blue)] transition-all"
            rows={1}
         />
         <button onClick={send} disabled={!message.trim()} className="w-10 h-10 rounded-full bg-[var(--ios-blue)] flex items-center justify-center text-white shrink-0 mb-1 active:scale-90 transition-transform disabled:opacity-50 shadow-md">
             ↑
         </button>
      </div>
    </div>
  );
}
