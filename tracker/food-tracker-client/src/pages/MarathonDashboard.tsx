
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import api from "../api";
import MeasurementsChart from "../components/marathon/MeasurementsChart";
import DisciplineWidget from "../components/marathon/DisciplineWidget";

// --- COMPONENTS ---
const MeasureInput = ({ label, value, onChange, placeholder }: any) => (
    <div className="flex justify-between items-center bg-[var(--tg-theme-secondary-bg-color)] p-3 rounded-xl border border-[var(--ios-separator)]">
        <span className="text-sm font-semibold text-[var(--ios-text)] pl-2">{label}</span>
        <input 
            type="number" 
            placeholder={placeholder} 
            className="w-24 bg-transparent text-right font-bold outline-none text-[var(--ios-text)] placeholder:text-[var(--ios-hint)] focus:text-[var(--ios-blue)] transition-colors" 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
        />
    </div>
);

const MeasureModal = ({ isOpen, onClose, onSave }: any) => {
    const [form, setForm] = useState({ 
        weight: "", chest: "", waist: "", hips: "",
        lArm: "", rArm: "", lLeg: "", rLeg: ""
    });
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    // Функция проверки валидности формы (все поля заполнены)
    const isFormValid = () => {
        return (
            form.weight && 
            form.chest && 
            form.waist && 
            form.hips && 
            form.lArm && 
            form.rArm && 
            form.lLeg && 
            form.rLeg &&
            date
        );
    };

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!isFormValid()) return;
        setSubmitting(true);
        await onSave({ ...form, date });
        setSubmitting(false);
        onClose();
    };

    // Ограничение даты (нельзя выбрать будущее)
    const maxDate = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[var(--ios-card)] w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 relative animate-slide-up shadow-2xl border-t border-[var(--ios-separator)] max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="w-12 h-1.5 bg-[var(--ios-separator)] rounded-full mx-auto mb-6" />
                <h3 className="text-xl font-bold text-[var(--ios-text)] mb-6 text-center">Замеры</h3>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-[var(--tg-theme-secondary-bg-color)] p-3 rounded-xl mb-4">
                        <span className="text-sm font-medium text-[var(--ios-text)] pl-2">📅 Дата</span>
                        <input 
                            type="date" 
                            max={maxDate}
                            className="bg-transparent text-right font-bold outline-none text-[var(--ios-text)]" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)} 
                        />
                    </div>
                    <MeasureInput label="Вес (кг)" value={form.weight} onChange={(v: string) => setForm({...form, weight: v})} placeholder="0.0" />
                    <div className="grid grid-cols-3 gap-2">
                        <MeasureInput label="Грудь" value={form.chest} onChange={(v: string) => setForm({...form, chest: v})} placeholder="см" />
                        <MeasureInput label="Талия" value={form.waist} onChange={(v: string) => setForm({...form, waist: v})} placeholder="см" />
                        <MeasureInput label="Бедра" value={form.hips} onChange={(v: string) => setForm({...form, hips: v})} placeholder="см" />
                    </div>
                    
                    <h4 className="font-bold text-[var(--ios-text)] text-sm pt-2 uppercase opacity-60">Руки и Ноги</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <MeasureInput label="Лев. рука" value={form.lArm} onChange={(v: string) => setForm({...form, lArm: v})} placeholder="см" />
                        <MeasureInput label="Прав. рука" value={form.rArm} onChange={(v: string) => setForm({...form, rArm: v})} placeholder="см" />
                        <MeasureInput label="Лев. нога" value={form.lLeg} onChange={(v: string) => setForm({...form, lLeg: v})} placeholder="см" />
                        <MeasureInput label="Прав. нога" value={form.rLeg} onChange={(v: string) => setForm({...form, rLeg: v})} placeholder="см" />
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={submitting || !isFormValid()}
                    className={`w-full mt-8 font-bold py-4 rounded-2xl shadow-lg transition-all ${
                        !isFormValid() 
                        ? 'bg-[var(--ios-separator)] text-[var(--ios-hint)] cursor-not-allowed opacity-50' 
                        : 'bg-[var(--ios-blue)] text-white active:scale-95'
                    }`}
                >
                    {submitting ? "..." : "Сохранить"}
                </button>
            </div>
        </div>
    );
};

const TaskRow = ({ task, onToggle }: any) => (
    <div 
        onClick={onToggle}
        className="group flex items-center p-3.5 bg-[var(--ios-card)] rounded-[18px] border border-[var(--ios-separator)] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
    >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${task.done ? 'bg-[var(--ios-green)] border-[var(--ios-green)]' : 'border-[var(--ios-hint)]'}`}>
            {task.done && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-medium transition-colors ${task.done ? 'text-[var(--ios-hint)] line-through' : 'text-[var(--ios-text)]'}`}>{task.title}</h4>
        </div>
        <span className="text-xl">{task.icon}</span>
    </div>
);

export default function MarathonDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<'main' | 'analytics'>('main');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);

  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);

  useEffect(() => { loadMainData(); }, []);
  useEffect(() => {
      if (view === 'analytics' && analyticsData.length === 0) loadAnalytics();
  }, [view]);

  const loadMainData = async () => {
      try {
          const res = await api.get('/marathon/dashboard');
          setDashboardData(res.data);
          
          setDailyTasks(res.data.dailyTasks);
          setWeeklyTasks(res.data.weeklyTasks);
          
          setLoading(false);
      } catch (e) { navigate('/marathon/entry', { replace: true }); }
  };

  const loadAnalytics = async () => { try { const res = await api.get('/marathon/analytics'); setAnalyticsData(res.data); } catch(e) {} };

  const handleTaskClick = async (listType: 'daily' | 'weekly', id: number, title?: string) => {
      if (listType === 'weekly' && title?.includes('Замеры')) { setIsMeasureModalOpen(true); return; }
      
      const setList = listType === 'daily' ? setDailyTasks : setWeeklyTasks;
      setList(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)); // Optimistic
      
      try { await api.post('/marathon/task', { task_id: id, task_type: listType }); } 
      catch (e) { setList(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)); } // Revert
  };

  const handleMeasurementsSave = async (data: any) => {
      try {
          const { date, ...measurements } = data;
          await api.post('/marathon/measurements', { measurements, date });
          // Находим задачу "Замеры" и ставим галочку (ищем по слову или по ID если знаем)
          setWeeklyTasks(prev => prev.map(t => t.title.includes('Замеры') ? { ...t, done: true } : t));
          loadAnalytics();
      } catch (e) { alert("Ошибка"); }
  };

  if (loading) return <div className="min-h-screen bg-[var(--ios-bg)] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[var(--ios-blue)] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="bg-[var(--ios-bg)] min-h-screen flex flex-col">
      <PageHeader 
        title="Марафон" 
        rightContent={<button onClick={() => navigate('/marathon/tests')} className="text-xl">📊</button>}
      />

      {/* Tabs */}
      <div className="px-4 py-3">
          <div className="flex bg-[var(--tg-theme-secondary-bg-color)] p-1 rounded-xl">
              {['main', 'analytics'].map(t => (
                  <button 
                    key={t} 
                    onClick={() => setView(t as any)} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${view === t ? 'bg-[var(--ios-card)] text-[var(--ios-text)] shadow-sm' : 'text-[var(--ios-hint)]'}`}
                  >
                      {t === 'main' ? 'Задачи' : 'Инфо'}
                  </button>
              ))}
          </div>
      </div>

      <div className="flex-1 px-4 pb-24 overflow-y-auto no-scrollbar">
          {view === 'main' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="ios-card p-5 bg-gradient-to-br from-[var(--ios-blue)] to-[var(--ios-indigo)] border-none text-white shadow-lg shadow-indigo-500/30">
                      <div className="flex justify-between items-center mb-2">
                          <h2 className="text-lg font-bold">День {dashboardData?.currentDay || 1}</h2>
                          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">Активен</div>
                      </div>
                      <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white/90 rounded-full transition-all duration-1000" style={{width: `${Math.min(((dashboardData?.currentDay || 1) / 30) * 100, 100)}%`}} />
                      </div>
                  </div>

                  <DisciplineWidget score={dashboardData?.discipline || 0} />

                  <div>
                      <h3 className="text-xs font-bold text-[var(--ios-hint)] uppercase mb-3 ml-2 tracking-wider">Сегодня</h3>
                      <div className="space-y-2">
                          {dailyTasks.map(t => <TaskRow key={t.id} task={t} onToggle={() => handleTaskClick('daily', t.id, t.title)} />)}
                      </div>
                  </div>

                  <div>
                      <h3 className="text-xs font-bold text-[var(--ios-hint)] uppercase mb-3 ml-2 tracking-wider">На неделю</h3>
                      <div className="space-y-2">
                          {weeklyTasks.map(t => <TaskRow key={t.id} task={t} onToggle={() => handleTaskClick('weekly', t.id, t.title)} />)}
                      </div>
                  </div>
              </div>
          )}

          {view === 'analytics' && (
              <div className="animate-fade-in space-y-4">
                  <MeasurementsChart history={analyticsData} />
                  <div className="ios-card overflow-hidden">
                      <table className="w-full text-xs text-left">
                          <thead className="bg-[var(--tg-theme-secondary-bg-color)] text-[var(--ios-hint)] font-semibold border-b border-[var(--ios-separator)]">
                              <tr><th className="px-4 py-3">Дата</th><th className="px-2 py-3 text-center">Вес</th><th className="px-2 py-3 text-center">Талия</th></tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--ios-separator)]">
                              {[...analyticsData].reverse().map((log: any) => (
                                  <tr key={log.created_at} className="bg-[var(--ios-card)]">
                                      <td className="px-4 py-3 text-[var(--ios-text)] font-medium">{new Date(log.created_at).toLocaleDateString(undefined, {day:'2-digit', month:'2-digit'})}</td>
                                      <td className="px-2 py-3 text-center text-[var(--ios-text)]">{log.weight}</td>
                                      <td className="px-2 py-3 text-center text-[var(--ios-text)]">{log.waist_cm}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>

      <MeasureModal isOpen={isMeasureModalOpen} onClose={() => setIsMeasureModalOpen(false)} onSave={handleMeasurementsSave} />
    </div>
  );
}
