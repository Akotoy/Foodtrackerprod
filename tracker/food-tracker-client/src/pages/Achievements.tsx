
import { useState, useEffect } from 'react';
import PageHeader from "../components/PageHeader";
import api from "../api";

export default function Achievements() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const load = async () => {
          try {
              const res = await api.get('/achievements');
              setAchievements(res.data);
          } catch (e) {
              console.error("Achievements load error", e);
          } finally {
              setLoading(false);
          }
      };
      load();
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  if (loading) {
      return (
          <div className="bg-tg-bg min-h-screen pb-32">
              <PageHeader title="Достижения" />
              <div className="p-5 flex justify-center pt-20">
                  <div className="w-10 h-10 border-4 border-tg-button border-t-transparent rounded-full animate-spin" />
              </div>
          </div>
      );
  }

  return (
    <div className="bg-tg-bg min-h-screen pb-32">
      <PageHeader title="Достижения" />

      <div className="p-5 animate-fade-in">
          {/* Общий прогресс */}
          <div className="ios-card p-5 mb-6 flex items-center justify-between bg-gradient-to-br from-tg-card to-tg-bg">
             <div>
                <span className="text-3xl font-black text-tg-text">{unlockedCount}</span>
                <span className="text-lg text-tg-hint font-medium"> / {achievements.length}</span>
             </div>
             <div className="w-32 h-2.5 bg-tg-border rounded-full overflow-hidden">
                <div 
                    className="h-full bg-yellow-400 transition-all duration-1000" 
                    style={{width: `${(unlockedCount / achievements.length) * 100}%`}} 
                />
             </div>
          </div>

          {/* Сетка */}
          <div className="grid grid-cols-2 gap-3">
             {achievements.map((item) => (
               <div 
                 key={item.id} 
                 className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all duration-500
                    ${item.unlocked 
                        ? 'bg-tg-card border-yellow-500/30 shadow-sm scale-100' 
                        : 'bg-tg-card/50 border-transparent opacity-50 grayscale scale-95'
                    }
                 `}
               >
                 <div className="text-4xl mb-3 filter drop-shadow-sm">{item.icon}</div>
                 <h3 className="font-bold text-tg-text text-sm mb-1">{item.title}</h3>
                 <p className="text-[11px] text-tg-hint leading-tight">{item.desc}</p>
                 {item.unlocked && <div className="mt-2 text-[10px] text-green-500 font-bold uppercase tracking-wider">Получено</div>}
               </div>
             ))}
          </div>
      </div>
    </div>
  );
}
