
import React, { useState } from 'react';
import api from '../../api';
import { getGradeColor } from '../../utils/helpers';

interface ScannedFood {
    name: string;
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
    weight_g: number;
    grade: string;
    advice: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: ScannedFood | null;
    onSaveSuccess: () => void;
}

export default function ScanResultModal({ isOpen, onClose, data, onSaveSuccess }: Props) {
    if (!isOpen || !data) return null;

    // Начальные значения от AI
    const baseWeight = data.weight_g || 100;
    const baseCalories = data.calories || 0;
    const baseProtein = data.protein || 0;
    const baseFats = data.fats || 0;
    const baseCarbs = data.carbs || 0;

    const [weight, setWeight] = useState(baseWeight);
    const [loading, setLoading] = useState(false);

    // Пересчет макросов при изменении веса
    const factor = weight / (baseWeight || 1);
    const totalCals = Math.round(baseCalories * factor);
    const totalProt = Math.round(baseProtein * factor);
    const totalFats = Math.round(baseFats * factor);
    const totalCarbs = Math.round(baseCarbs * factor);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.post('/log-food', {
                food: {
                    name: data.name,
                    calories: totalCals,
                    protein: totalProt,
                    fats: totalFats,
                    carbs: totalCarbs,
                    weight_g: weight,
                    grade: data.grade
                },
                is_image: true
            });
            onSaveSuccess();
        } catch (e) {
            console.error("Save error", e);
            alert("Не удалось сохранить :(");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            
            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] p-6 animate-slide-up shadow-2xl border-t border-white/10">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />

                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-black dark:text-white leading-tight">{data.name}</h2>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${getGradeColor(data.grade)}`}>
                                {data.grade}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Белки: {totalProt} • Жиры: {totalFats} • Угл: {totalCarbs}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold">✕</button>
                </div>

                {/* Совет от AI */}
                {data.advice && (
                    <div className="mb-6 bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20">
                        <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                            💡 <b>AI Совет:</b> {data.advice}
                        </p>
                    </div>
                )}

                {/* Калькулятор веса */}
                <div className="flex items-center justify-between mb-8 bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setWeight(Math.max(0, weight - 10))} className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 shadow-sm border border-gray-200 dark:border-white/5 text-2xl font-medium text-black dark:text-white pb-1 flex items-center justify-center hover:bg-gray-100">−</button>
                        <div className="flex flex-col items-center w-20">
                             <span className="text-2xl font-black text-black dark:text-white">{weight}</span>
                             <span className="text-[10px] text-gray-400 uppercase font-bold">грамм</span>
                        </div>
                        <button onClick={() => setWeight(weight + 10)} className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 shadow-sm border border-gray-200 dark:border-white/5 text-2xl font-medium text-black dark:text-white pb-1 flex items-center justify-center hover:bg-gray-100">+</button>
                    </div>
                    
                    <div className="text-right pl-4 border-l border-gray-300 dark:border-white/10">
                        <span className="block text-3xl font-black text-blue-600 dark:text-blue-500">{totalCals}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">ккал</span>
                    </div>
                </div>

                {/* Кнопка сохранить */}
                <button 
                    onClick={handleSave} 
                    disabled={loading} 
                    className="w-full h-14 rounded-2xl font-bold text-white bg-blue-600 dark:bg-blue-600 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center text-lg"
                >
                    {loading ? "Сохраняем..." : "Добавить в дневник"}
                </button>
            </div>
        </div>
    );
}
