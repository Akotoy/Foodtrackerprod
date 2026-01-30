
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import api from "../api";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State for Goal Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalValue, setGoalValue] = useState(2000);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadUser = async () => {
      try {
          const res = await api.get('/daily-stats');
          setUser(res.data.user);
          setGoalValue(res.data.user.daily_calories_goal || 2000);
      } catch (e) {
          console.error("Ошибка загрузки профиля", e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      loadUser();
  }, []);

  const saveGoal = async () => {
      setSaving(true);
      try {
          await api.post('/user/goal', {
              calories: goalValue
          });
          await loadUser(); // Refresh data
          setIsGoalModalOpen(false);
      } catch (e) {
          console.error("Save goal error", e);
          alert("Не удалось сохранить цель");
      } finally {
          setSaving(false);
      }
  };

  const handleDeleteAccount = async () => {
      if(!confirm("ВЫ УВЕРЕНЫ?\nЭто действие нельзя отменить. Все ваши данные (история питания, вес, марафон) будут удалены безвозвратно.")) return;
      
      setDeleting(true);
      try {
          await api.delete('/user/delete');
          // Перенаправляем на онбординг или закрываем приложение (в зависимости от логики App.tsx)
          // App.tsx AuthCheck перекинет на onboarding, так как user check вернет false
          navigate('/onboarding', { replace: true });
      } catch (e) {
          alert("Ошибка удаления аккаунта");
          setDeleting(false);
      }
  };

  if (loading) return <div className="min-h-screen bg-tg-bg p-5 text-tg-hint text-center pt-20">Загрузка профиля...</div>;
  if (!user) return <div className="min-h-screen bg-tg-bg p-5 text-tg-hint text-center pt-20">Профиль не найден</div>;

  return (
    <div className="bg-tg-bg min-h-screen pb-32">
       <PageHeader title="Профиль" />
       
       <div className="p-5 space-y-4 animate-fade-in">
           {/* Карточка профиля */}
           <div className="ios-card p-6 flex flex-col items-center relative text-center">
              <div className="relative z-10 mb-4">
                 <div className="block relative w-24 h-24">
                     <div className="w-full h-full rounded-full p-[3px] bg-gradient-to-tr from-blue-400 to-purple-400">
                        <img 
                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${user.first_name}`} 
                            className="w-full h-full rounded-full bg-tg-bg object-cover border-4 border-tg-bg" 
                        />
                     </div>
                 </div>
              </div>
              
              {/* Восстановленные Имя и Фамилия */}
              <h2 className="text-xl font-bold text-tg-text">
                  {user.first_name} {user.last_name || ""}
              </h2>
              <p className="text-tg-hint text-sm mt-1">{user.target_goal === 'loss' ? 'Похудение' : 'Поддержание'}</p>

              <div className="grid grid-cols-3 gap-6 mt-6 w-full pt-4 border-t border-tg-border">
                 <div className="text-center"><span className="block text-lg font-black text-tg-text">{user.weight}</span><span className="text-[10px] text-tg-hint font-bold uppercase">кг</span></div>
                 <div className="text-center border-l border-r border-tg-border"><span className="block text-lg font-black text-tg-text">{user.height}</span><span className="text-[10px] text-tg-hint font-bold uppercase">см</span></div>
                 <div className="text-center"><span className="block text-lg font-black text-tg-text">{user.age}</span><span className="text-[10px] text-tg-hint font-bold uppercase">лет</span></div>
              </div>
           </div>

           {/* Меню */}
           <div className="ios-card overflow-hidden">
              <MenuItem 
                icon="🎯" 
                label="Цель по калориям" 
                value={`${user.daily_calories_goal} ккал`} 
                onClick={() => setIsGoalModalOpen(true)}
              />
           </div>
           
           <div className="text-center pt-2 select-none space-y-4">
               <p className="text-xs text-tg-hint opacity-40">
                   ID: {user.telegram_id} • v1.0.7
               </p>
               
               <button 
                   onClick={handleDeleteAccount}
                   disabled={deleting}
                   className="text-xs text-red-500 font-bold uppercase tracking-wider py-2 px-4 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
               >
                   {deleting ? "Удаление..." : "Удалить профиль"}
               </button>
           </div>
       </div>

       {/* Модальное окно изменения цели */}
       {isGoalModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
               <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsGoalModalOpen(false)}></div>
               
               <div className="relative w-full max-w-md bg-tg-card rounded-t-[32px] sm:rounded-[32px] p-6 animate-slide-up shadow-2xl border-t border-white/10">
                   <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />
                   
                   <h2 className="text-xl font-bold text-tg-text mb-6 text-center">Ваша цель</h2>
                   
                   <div className="flex flex-col items-center mb-8">
                       <span className="text-5xl font-black text-tg-button mb-2">{goalValue}</span>
                       <span className="text-sm font-bold text-tg-hint uppercase tracking-wider">ккал / день</span>
                   </div>

                   <div className="mb-10 px-2">
                       <input 
                           type="range" 
                           min="600" 
                           max="2500" 
                           step="50"
                           value={goalValue} 
                           onChange={(e) => setGoalValue(Number(e.target.value))}
                           className="w-full h-2 bg-tg-border rounded-lg appearance-none cursor-pointer accent-tg-button"
                       />
                       <div className="flex justify-between text-xs text-tg-hint mt-2 font-medium">
                           <span>600</span>
                           <span>2500</span>
                       </div>
                   </div>

                   <button 
                       onClick={saveGoal}
                       disabled={saving}
                       className="w-full bg-tg-button text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
                   >
                       {saving ? "Сохранение..." : "Готово"}
                   </button>
               </div>
           </div>
       )}
    </div>
  );
}

const MenuItem = ({ icon, label, value, color, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 border-b border-tg-border last:border-0 hover:bg-tg-hint/5 transition-colors active:scale-[0.98]"
    >
        <div className="flex items-center gap-3">
            <span className="text-lg opacity-80">{icon}</span>
            <span className={`text-[15px] font-medium ${color || 'text-tg-text'}`}>{label}</span>
        </div>
        {value && <span className="text-xs text-tg-hint font-medium flex items-center gap-1">{value} <span className="text-lg leading-3">›</span></span>}
    </button>
);
