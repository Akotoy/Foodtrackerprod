
import React from 'react';

const MacroBar = ({ label, current, goal, color }: { label: string, current: number, goal: number, color: string }) => {
  const percent = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-[var(--ios-hint)]">{label}</span>
        <div>
            <span className="text-[var(--ios-text)]">{Math.round(current)}</span>
            <span className="text-[var(--ios-hint)] opacity-60"> / {Math.round(goal)}г</span>
        </div>
      </div>
      <div className="h-2 w-full bg-[var(--tg-theme-secondary-bg-color)] rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default function MacrosCard({ current, goals }: { current: any, goals: any }) {
  return (
    <div className="px-4 mt-6 animate-slide-up">
      <div className="ios-card p-5 border border-white/50 dark:border-white/5">
        <h2 className="text-sm font-bold text-[var(--ios-text)] mb-4 uppercase tracking-wide opacity-80">Макронутриенты</h2>
        <div className="space-y-4">
          <MacroBar label="Белки" current={current.protein} goal={goals.protein} color="#34C759" />
          <MacroBar label="Жиры" current={current.fats} goal={goals.fats} color="#FF9500" />
          <MacroBar label="Углеводы" current={current.carbs} goal={goals.carbs} color="#007AFF" />
        </div>
      </div>
    </div>
  );
}
