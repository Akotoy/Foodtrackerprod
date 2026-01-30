
import React from 'react';
import { getGradeColor } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";

const LoadingSkeleton = () => (
    <div className="h-16 bg-[var(--ios-card)] rounded-xl animate-pulse" />
);

export default function FoodList({ logs, onItemClick }: { logs: any[] | null, onItemClick: (item: any) => void }) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (!logs) {
      return (
          <div className="px-4 mt-8 space-y-2">
              <LoadingSkeleton /><LoadingSkeleton />
          </div>
      )
  }

  return (
    <div className="px-4 mt-8 mb-4">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-bold text-[var(--ios-text)] text-lg tracking-tight">История</h3>
        {logs.length > 0 && (
             <span className="text-xs font-semibold text-[var(--ios-hint)] bg-[var(--tg-theme-secondary-bg-color)] px-2.5 py-1 rounded-lg">
               Всего: {logs.reduce((acc, i) => acc + i.calories, 0)} ккал
             </span>
        )}
      </div>

      <div className="space-y-0.5 rounded-[20px] overflow-hidden shadow-sm border border-[var(--ios-separator)]">
          {logs.length === 0 ? (
              <div className="bg-[var(--ios-card)] p-8 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl mb-3 opacity-50">🍽️</span>
                  <p className="text-[var(--ios-text)] font-medium">Пока ничего нет</p>
                  <button onClick={() => navigate('/scanner')} className="mt-3 text-[var(--ios-blue)] text-sm font-semibold">Добавить первый прием</button>
              </div>
          ) : (
              logs.map((item, index) => (
                  <div 
                    key={item.id} 
                    onClick={() => onItemClick(item)} 
                    className={`
                        bg-[var(--ios-card)] p-4 flex items-center gap-3 cursor-pointer active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors
                        ${index !== logs.length - 1 ? 'border-b border-[var(--ios-separator)]' : ''}
                    `}
                  >
                      {/* Grade Badge */}
                      <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center shrink-0
                          font-bold text-sm shadow-sm border-2 border-[var(--ios-card)]
                          ${getGradeColor(item.grade)}
                      `}>
                          {item.grade || "A"}
                      </div>

                      <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--ios-text)] truncate text-[15px]">{item.name}</p>
                          <p className="text-xs text-[var(--ios-hint)] flex items-center gap-1">
                              <span>{formatDate(item.created_at)}</span>
                              <span>•</span>
                              <span>{item.weight_g || 100}г</span>
                          </p>
                      </div>

                      <div className="text-right">
                          <span className="block font-bold text-[var(--ios-text)] text-[15px]">{item.calories}</span>
                          <span className="text-[10px] text-[var(--ios-hint)] font-medium">ккал</span>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
}
