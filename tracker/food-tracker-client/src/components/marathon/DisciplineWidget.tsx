
import React, { useState } from 'react';

const getDisciplineColor = (score: number) => {
    if (score >= 9) return '#34D399'; // Green
    if (score >= 7) return '#3B82F6'; // Blue
    if (score >= 5) return '#FBBF24'; // Yellow
    return '#EF4444'; // Red
};

const getStatus = (score: number) => {
    if (score >= 9) return 'Элита';
    if (score >= 7) return 'Профи';
    if (score >= 5) return 'Норма';
    return 'Риск';
};

export default function DisciplineWidget({ score }: { score: number }) {
    const [showInfo, setShowInfo] = useState(false);
    const color = getDisciplineColor(score);
    const radius = 36;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 10) * circumference;

    return (
        <>
            <div className="bg-tg-card border border-tg-border rounded-[24px] p-4 flex items-center justify-between shadow-sm relative">
                <div className="mr-4 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xs font-bold text-tg-hint uppercase">Индекс Дисциплины</h3>
                        <button 
                            onClick={() => setShowInfo(true)}
                            className="w-4 h-4 rounded-full border border-tg-hint/30 text-tg-hint flex items-center justify-center text-[10px] active:scale-90 transition-transform"
                        >
                            i
                        </button>
                    </div>
                    <p className="text-[10px] text-tg-hint opacity-70 leading-tight">Ваша эффективность за 7 дней</p>
                    <div className="mt-2 inline-block px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm transition-colors duration-500" style={{ backgroundColor: color }}>
                        {getStatus(score)}
                    </div>
                </div>

                <div className="relative w-[80px] h-[80px] flex items-center justify-center shrink-0">
                    <svg height="80" width="80" className="-rotate-90">
                        <circle stroke="var(--border-color)" strokeWidth={stroke} fill="transparent" r={normalizedRadius} cx="40" cy="40" />
                        <circle 
                            stroke={color} 
                            fill="transparent" 
                            strokeWidth={stroke} 
                            strokeDasharray={circumference + ' ' + circumference} 
                            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease' }} 
                            strokeLinecap="round" 
                            r={normalizedRadius} cx="40" cy="40" 
                        />
                    </svg>
                    <div className="absolute text-center">
                        <span className="block text-xl font-black text-tg-text leading-none">{score}</span>
                    </div>
                </div>
            </div>

            {/* Info Modal / Sheet */}
            {showInfo && (
                <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowInfo(false)} />
                    
                    <div className="relative w-full max-w-md bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] p-6 animate-slide-up shadow-2xl border-t border-white/10 max-h-[85vh] overflow-y-auto no-scrollbar">
                        <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6" />
                        
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-white leading-tight">Что такое<br/>Индекс Дисциплины?</h2>
                            <button onClick={() => setShowInfo(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 font-bold">✕</button>
                        </div>

                        <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 mb-6">
                            <p className="text-sm text-blue-200 leading-relaxed">
                                Это показатель вашей <b>системности</b>. Мы анализируем выполнение ежедневных задач (вода, отчеты, активность) за последние 7 дней.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Легенда уровней</h3>
                            
                            <LevelItem 
                                color="#34D399" 
                                label="Элита" 
                                range="9 — 10" 
                                desc="Безупречно! Вы — пример для подражания. Максимальная эффективность."
                            />
                            <LevelItem 
                                color="#3B82F6" 
                                label="Профи" 
                                range="7 — 8.9" 
                                desc="Отличная работа! Вы соблюдаете режим почти идеально."
                            />
                            <LevelItem 
                                color="#FBBF24" 
                                label="Норма" 
                                range="5 — 6.9" 
                                desc="Неплохое начало. Вы стараетесь, но есть пропуски."
                            />
                            <LevelItem 
                                color="#EF4444" 
                                label="Риск" 
                                range="0 — 4.9" 
                                desc="Низкая активность. Чтобы увидеть результат, нужно больше системности!"
                            />
                        </div>

                        <button 
                            onClick={() => setShowInfo(false)}
                            className="w-full h-14 bg-white text-black rounded-2xl font-bold text-lg active:scale-95 transition-transform"
                        >
                            Всё понятно
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

const LevelItem = ({ color, label, range, desc }: { color: string, label: string, range: string, desc: string }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full shadow-sm mt-1.5" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
            <div className="w-0.5 flex-1 bg-white/5 my-1 rounded-full" />
        </div>
        <div className="pb-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-bold text-white">{label}</span>
                <span className="text-xs font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{range}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
        </div>
    </div>
);
