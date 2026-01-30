
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

const OnboardingInput = ({ label, value, onChange, placeholder, type = "text", inputMode, autoFocus = false }: any) => (
    <div className="mb-5">
        <label className="block text-xs font-bold text-[var(--ios-hint)] uppercase mb-2 ml-1 tracking-wide">{label} <span className="text-red-500">*</span></label>
        <input 
            type={type}
            inputMode={inputMode} 
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full bg-[var(--ios-card)] border border-[var(--ios-separator)] rounded-2xl px-4 py-4 text-[var(--ios-text)] text-lg outline-none focus:border-[var(--ios-blue)] transition-colors placeholder:text-[var(--ios-hint)] shadow-sm"
        />
    </div>
);

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);

  // FORM STATE
  const [formData, setFormData] = useState({
    // Step 1
    firstName: "", 
    lastName: "", 
    
    // Step 2 (Point A)
    weight: "", 
    height: "", 
    age: "",
    gender: "female", // Hidden but required for BMR
    og: "", // Chest
    ot: "", // Waist
    ob: "", // Hips
    
    // New Measurements
    lArm: "",
    rArm: "",
    lLeg: "",
    rLeg: "",

    // Step 3 (Goals)
    goals: [] as string[],
    targetWeight: "",
    otherGoal: "",
    
    // Consent
    consent: false
  });

  useEffect(() => {
    // @ts-ignore
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) setFormData(p => ({ ...p, firstName: tgUser.first_name || "", lastName: tgUser.last_name || "" }));
  }, []);

  const handleChange = (f: string, v: any) => setFormData(p => ({ ...p, [f]: v }));

  const handleGoalToggle = (goalKey: string) => {
      setFormData(prev => {
          const exists = prev.goals.includes(goalKey);
          let newGoals = exists 
              ? prev.goals.filter(g => g !== goalKey) 
              : [...prev.goals, goalKey];
          return { ...prev, goals: newGoals };
      });
  };

  // VALIDATION LOGIC
  const isStepValid = () => {
      switch(step) {
          case 1: // Личность
              return formData.firstName.trim() !== "" && formData.lastName.trim() !== "";
          case 2: // Точка А (ВСЕ поля обязательны)
              return (
                  formData.weight !== "" && 
                  formData.height !== "" && 
                  formData.age !== "" &&
                  formData.og !== "" && 
                  formData.ot !== "" && 
                  formData.ob !== "" &&
                  formData.lArm !== "" &&
                  formData.rArm !== "" &&
                  formData.lLeg !== "" &&
                  formData.rLeg !== ""
              );
          case 3: // Цель
              const hasWeightGoal = formData.goals.includes('Сбросить вес') || formData.goals.includes('Набрать вес');
              const weightGoalValid = hasWeightGoal ? formData.targetWeight !== "" : true;
              const hasAnyGoal = formData.goals.length > 0 || formData.otherGoal.trim() !== "";
              
              return hasAnyGoal && weightGoalValid && formData.consent;
          default:
              return false;
      }
  };

  const finish = async () => {
    if (!isStepValid()) return;
    setLoading(true);
    try {
        const toNum = (v: any) => Number(v?.toString().replace(',', '.') || 0);
        
        // Формируем финальный список целей текстом
        const finalGoals = [...formData.goals];
        if (formData.otherGoal) finalGoals.push(`Другое: ${formData.otherGoal}`);
        
        // Добавляем цели с весом в текст
        if (formData.goals.includes('Сбросить вес')) {
            const idx = finalGoals.indexOf('Сбросить вес');
            if (idx !== -1) finalGoals[idx] = `Сбросить вес до ${formData.targetWeight} кг`;
        }
        if (formData.goals.includes('Набрать вес')) {
            const idx = finalGoals.indexOf('Набрать вес');
            if (idx !== -1) finalGoals[idx] = `Набрать вес до ${formData.targetWeight} кг`;
        }

        const payload = {
            ...formData,
            age: toNum(formData.age), 
            weight: toNum(formData.weight), 
            height: toNum(formData.height),
            target_weight: toNum(formData.targetWeight),
            
            // Замеры
            og: toNum(formData.og), 
            ot: toNum(formData.ot), 
            ob: toNum(formData.ob),
            lArm: toNum(formData.lArm),
            rArm: toNum(formData.rArm),
            lLeg: toNum(formData.lLeg),
            rLeg: toNum(formData.rLeg),
            
            goals: finalGoals,
            
            // Gender (implicit)
            gender: formData.gender
        };

        await api.post('/sync-user', { userData: payload });
        navigate('/home', { replace: true });
    } catch (e) { 
        alert("Ошибка сохранения данных"); 
        console.error(e);
    } finally { 
        setLoading(false); 
    }
  };

  const next = () => { 
      if (!isStepValid()) return;
      setDirection(1); 
      setStep(s => s + 1); 
  };
  
  const prev = () => { setDirection(-1); setStep(s => s - 1); };

  const variants = {
      enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 })
  };

  // Goal Options
  const goalsOptions = [
      { id: 'Сбросить вес', label: 'Сбросить вес' },
      { id: 'Набрать вес', label: 'Набрать вес' },
      { id: 'Снизить симптомы аллергии', label: 'Снизить симптомы аллергии' },
      { id: 'Больше энергии', label: 'Больше энергии' },
      { id: 'Научится правильно питаться', label: 'Научиться правильно питаться' },
      { id: 'Набрать мышечную массу', label: 'Набрать мышечную массу' },
      { id: 'Очистить кожу', label: 'Очистить кожу (акне, дерматит)' },
  ];

  return (
    <div className="min-h-screen bg-[var(--ios-bg)] flex flex-col overflow-hidden">
        {/* Progress Bar */}
        <div className="pt-8 px-6 mb-4">
            <div className="h-1.5 w-full bg-[var(--ios-separator)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--ios-blue)] transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
        </div>

        <div className="flex-1 relative">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div 
                    key={step}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-0 px-6 overflow-y-auto no-scrollbar pb-32"
                >
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-black text-[var(--ios-text)] mb-2">Знакомство</h1>
                                <p className="text-[var(--ios-hint)]">Заполните основные данные</p>
                            </div>

                            <OnboardingInput label="Фамилия" value={formData.lastName} onChange={(e: any) => handleChange("lastName", e.target.value)} placeholder="Иванов" />
                            <OnboardingInput label="Имя" value={formData.firstName} onChange={(e: any) => handleChange("firstName", e.target.value)} placeholder="Иван" />
                            
                            {/* Gender Switcher (Hidden visually but functional logic) */}
                            <div className="bg-[var(--ios-card)] p-1 rounded-xl flex border border-[var(--ios-separator)]">
                                {['female', 'male'].map(g => (
                                    <button 
                                        key={g} 
                                        onClick={() => handleChange('gender', g)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.gender === g ? 'bg-[var(--ios-blue)] text-white shadow' : 'text-[var(--ios-hint)]'}`}
                                    >
                                        {g === 'female' ? 'Женский' : 'Мужской'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h1 className="text-3xl font-black text-[var(--ios-text)] mb-2">Точка А</h1>
                            <p className="text-[var(--ios-hint)] mb-8">Ваши текущие параметры (обязательно)</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <OnboardingInput label="Вес (кг)" value={formData.weight} onChange={(e: any) => handleChange("weight", e.target.value)} placeholder="0" type="number" inputMode="decimal" />
                                <OnboardingInput label="Рост (см)" value={formData.height} onChange={(e: any) => handleChange("height", e.target.value)} placeholder="0" type="number" inputMode="numeric" />
                            </div>
                            
                            <OnboardingInput label="Возраст" value={formData.age} onChange={(e: any) => handleChange("age", e.target.value)} placeholder="25" type="number" inputMode="numeric" />

                            <div className="mt-6 mb-2">
                                <h3 className="font-bold text-[var(--ios-text)] text-lg mb-4">Замеры тела (см)</h3>
                                <OnboardingInput label="ОГ (Обхват груди)" value={formData.og} onChange={(e: any) => handleChange("og", e.target.value)} placeholder="0" type="number" inputMode="decimal" />
                                <OnboardingInput label="ОТ (Обхват талии)" value={formData.ot} onChange={(e: any) => handleChange("ot", e.target.value)} placeholder="0" type="number" inputMode="decimal" />
                                <OnboardingInput label="ОБ (Обхват бедер)" value={formData.ob} onChange={(e: any) => handleChange("ob", e.target.value)} placeholder="0" type="number" inputMode="decimal" />
                                
                                <h3 className="font-bold text-[var(--ios-text)] text-sm mb-4 mt-6 uppercase opacity-60">Руки и Ноги</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <OnboardingInput label="Лев. рука" value={formData.lArm} onChange={(e: any) => handleChange("lArm", e.target.value)} placeholder="0" type="number" inputMode="decimal" />
                                    <OnboardingInput label="Прав. рука" value={formData.rArm} onChange={(e: any) => handleChange("rArm", e.target.value)} placeholder="0" type="number" inputMode="decimal" />
                                    <OnboardingInput label="Лев. нога" value={formData.lLeg} onChange={(e: any) => handleChange("lLeg", e.target.value)} placeholder="0" type="number" inputMode="decimal" />
                                    <OnboardingInput label="Прав. нога" value={formData.rLeg} onChange={(e: any) => handleChange("rLeg", e.target.value)} placeholder="0" type="number" inputMode="decimal" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <h1 className="text-3xl font-black text-[var(--ios-text)] mb-2">Цель</h1>
                            <p className="text-[var(--ios-hint)] mb-6">Чего вы хотите достичь?</p>
                            
                            <div className="space-y-3 mb-6">
                                {goalsOptions.map(g => {
                                    const isSelected = formData.goals.includes(g.id);
                                    return (
                                        <div key={g.id} className={`transition-all ${isSelected ? 'bg-[var(--ios-blue)]/5 border-[var(--ios-blue)]' : 'border-[var(--ios-separator)]'} border rounded-2xl overflow-hidden`}>
                                            <button 
                                                onClick={() => handleGoalToggle(g.id)} 
                                                className={`w-full p-4 flex items-center justify-between text-left`}
                                            >
                                                <span className={`font-bold ${isSelected ? 'text-[var(--ios-blue)]' : 'text-[var(--ios-text)]'}`}>{g.label}</span>
                                                {isSelected && <span className="text-[var(--ios-blue)] font-bold">✓</span>}
                                            </button>
                                            
                                            {/* Extra input for weight goals */}
                                            {isSelected && (g.id === 'Сбросить вес' || g.id === 'Набрать вес') && (
                                                <div className="px-4 pb-4 pt-0 animate-fade-in">
                                                    <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 p-2 rounded-xl border border-[var(--ios-separator)]">
                                                        <span className="text-sm font-bold pl-2 text-[var(--ios-hint)]">До:</span>
                                                        <input 
                                                            type="number"
                                                            inputMode="decimal"
                                                            value={formData.targetWeight}
                                                            onChange={(e) => handleChange('targetWeight', e.target.value)}
                                                            placeholder="00.0"
                                                            className="bg-transparent outline-none w-20 font-bold text-[var(--ios-text)]"
                                                        />
                                                        <span className="text-sm font-bold text-[var(--ios-hint)]">кг</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {/* Custom Goal */}
                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-[var(--ios-hint)] uppercase mb-2 ml-1">Другое</label>
                                    <input 
                                        type="text"
                                        value={formData.otherGoal}
                                        onChange={(e) => handleChange("otherGoal", e.target.value)}
                                        placeholder="Напишите свой вариант..."
                                        className="w-full bg-[var(--ios-card)] border border-[var(--ios-separator)] rounded-2xl px-4 py-3 text-[var(--ios-text)] outline-none focus:border-[var(--ios-blue)]"
                                    />
                                </div>
                            </div>

                            {/* Consent */}
                            <div className="bg-[var(--ios-card)] p-4 rounded-2xl border border-[var(--ios-separator)] flex gap-4 items-start mb-4">
                                <input 
                                    type="checkbox" 
                                    id="consent"
                                    checked={formData.consent}
                                    onChange={(e) => handleChange('consent', e.target.checked)}
                                    className="mt-1 w-5 h-5 accent-[var(--ios-blue)] cursor-pointer"
                                />
                                <label htmlFor="consent" className="text-xs text-[var(--ios-hint)] leading-relaxed cursor-pointer">
                                    Я даю согласие на обработку моих персональных данных в соответствии с политикой конфиденциальности. <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 pb-safe bg-[var(--ios-bg)] flex gap-4 z-20 absolute bottom-0 left-0 right-0 glass-dock border-t-0">
            {step > 1 && <button onClick={prev} className="px-6 py-4 rounded-2xl bg-[var(--ios-card)] font-bold text-[var(--ios-text)] shadow-sm active:scale-95 transition-transform">Назад</button>}
            <button 
                onClick={step === 3 ? finish : next} 
                disabled={loading || !isStepValid()} 
                className={`flex-1 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 
                    ${isStepValid() ? 'bg-[var(--ios-blue)] text-white' : 'bg-[var(--ios-separator)] text-[var(--ios-hint)] cursor-not-allowed opacity-50'}
                `}
            >
                {loading ? '...' : (step === 3 ? 'Готово' : 'Далее')}
            </button>
        </div>
    </div>
  );
}
