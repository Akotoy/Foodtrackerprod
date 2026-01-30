
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import api from "../api";

export default function MarathonEntry() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // Состояние первичной проверки
  const [shake, setShake] = useState(false);

  // Проверка статуса участника при загрузке
  useEffect(() => {
      const checkParticipation = async () => {
          try {
              // Пытаемся получить данные дашборда. Если токен есть, сервер отдаст 200 OK.
              await api.get('/marathon/dashboard');
              // Если успешно — сразу в марафон
              navigate('/marathon/dashboard', { replace: true });
          } catch (e) {
              // Если 404 или ошибка — значит не участник, показываем форму
              setCheckingAuth(false);
          }
      };
      checkParticipation();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!token.trim()) return;

    setLoading(true);
    try {
        // Отправляем запрос на сервер
        await api.post('/marathon/enter', {
            token: token.trim()
        });

        // Если успех, отправляем на тесты (первичный онбординг марафона)
        navigate("/marathon/tests"); 
    } catch (e) {
        console.error(e);
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
    } finally {
        setLoading(false);
    }
  };

  // Пока проверяем статус — показываем лоадер
  if (checkingAuth) {
      return (
          <div className="bg-tg-bg min-h-screen flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-tg-button border-t-transparent rounded-full animate-spin" />
          </div>
      );
  }

  return (
    <div className="bg-tg-bg min-h-screen flex flex-col">
      <PageHeader title="Закрытый клуб" showBack={true} />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
         
         {/* Иконка замка */}
         <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-tg-card to-tg-bg border border-tg-border flex items-center justify-center text-6xl shadow-xl mb-6 relative">
            🔒
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-tg-button rounded-full flex items-center justify-center border-4 border-tg-bg text-xl shadow-sm">
                🔑
            </div>
         </div>
         
         <div className="text-center space-y-3 mb-8 max-w-xs">
             <h1 className="text-2xl font-bold text-tg-text">Доступ к марафону</h1>
             <p className="text-tg-hint text-sm leading-relaxed">
                 Введите персональный токен доступа, полученный при регистрации в потоке.
             </p>
         </div>

         <div className="w-full max-w-sm space-y-6">
             <div className={`transition-transform duration-100 ${shake ? 'translate-x-[-10px] translate-x-[10px]' : ''}`}>
                 <label className="text-xs font-bold text-tg-hint uppercase ml-4 mb-1 block">Токен доступа</label>
                 <input 
                    type="text" 
                    value={token}
                    onChange={(e) => { 
                        setToken(e.target.value); 
                        setError(false); 
                    }}
                    placeholder="XyZ_#123..."
                    className={`
                        w-full bg-tg-card border-2 rounded-2xl px-4 py-4 text-center text-lg font-mono text-tg-text focus:outline-none transition-colors
                        ${error ? 'border-red-500 bg-red-500/5' : 'border-tg-border focus:border-tg-button'}
                    `}
                 />
                 {error && (
                    <p className="text-red-500 text-xs text-center mt-2 font-medium animate-pulse">
                        Неверный токен или ошибка сервера.
                    </p>
                 )}
             </div>
             
             <button 
                onClick={handleSubmit}
                disabled={!token || loading}
                className="w-full bg-tg-button text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
             >
                {loading ? <span className="animate-spin text-2xl mr-2">⏳</span> : "Открыть доступ"}
             </button>
         </div>

         <p className="mt-auto text-xs text-tg-hint/40 text-center pb-4 pt-10">
             Если у вас нет токена, обратитесь к куратору.
         </p>
      </div>
    </div>
  );
}
