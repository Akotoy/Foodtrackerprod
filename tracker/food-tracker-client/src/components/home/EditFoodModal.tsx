
import React, { useState } from 'react';
import api from '../../api';

export default function EditFoodModal({ isOpen, onClose, item, onRefresh }: any) {
    if (!isOpen || !item) return null;

    const initialWeight = Number(item.weight_g || item.weight) || 100;
    const initialCalories = Number(item.calories) || 0;
    
    const [weight, setWeight] = useState(initialWeight);
    const [loading, setLoading] = useState(false);

    const factor = weight / (initialWeight || 1);
    const totalCals = Math.round(initialCalories * factor);
    const totalProt = Math.round((item.protein || 0) * factor);
    const totalFats = Math.round((item.fats || 0) * factor);
    const totalCarbs = Math.round((item.carbs || 0) * factor);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put(`/log-food/${item.id}`, {
                name: item.name,
                weight_g: weight,
                calories: totalCals,
                protein: totalProt,
                fats: totalFats,
                carbs: totalCarbs
            });
            onRefresh();
            onClose(false);
        } catch (e) {
            console.error("Save error", e);
            alert("Ошибка сохранения");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if(!confirm("Удалить эту запись?")) return;
        setLoading(true);
        try {
            await api.delete(`/log-food/${item.id}`);
            onRefresh();
            onClose(false);
        } catch (e) {
            console.error("Delete error", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => onClose(false)}></div>
            
            {/* Modal Content - Explicit colors for light/dark mode */}
            <div className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] p-6 animate-slide-up shadow-2xl border-t border-white/10">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-black dark:text-white leading-tight">{item.name || "Продукт"}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Белки: {totalProt} • Жиры: {totalFats} • Угл: {totalCarbs}
                        </p>
                    </div>
                    <button onClick={() => onClose(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold">✕</button>
                </div>

                {/* Calculator Area */}
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

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleDelete} 
                        disabled={loading} 
                        className="h-14 rounded-2xl font-bold text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-500/10 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? "..." : "Удалить"}
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading} 
                        className="h-14 rounded-2xl font-bold text-white bg-blue-600 dark:bg-blue-600 shadow-lg shadow-blue-500/30 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? "..." : "Сохранить"}
                    </button>
                </div>
            </div>
        </div>
    );
}
