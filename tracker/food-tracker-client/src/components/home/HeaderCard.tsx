
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Gradient SVG Ring
const ActivityRing = ({ percentage }: { percentage: number }) => {
    const radius = 58;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-[120px] h-[120px] flex items-center justify-center">
            {/* Shadow for the ring */}
            <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 transform scale-90"></div>
            
            <svg height="120" width="120" className="rotate-[-90deg] relative z-10">
                <defs>
                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#007AFF" />
                        <stop offset="100%" stopColor="#5AC8FA" />
                    </linearGradient>
                </defs>
                <circle 
                    stroke="rgba(142, 142, 147, 0.1)" 
                    strokeWidth={stroke} 
                    fill="transparent" 
                    r={normalizedRadius} cx="60" cy="60" 
                />
                <circle 
                    stroke="url(#ringGradient)" 
                    fill="transparent" 
                    strokeWidth={stroke} 
                    strokeDasharray={circumference + ' ' + circumference} 
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }} 
                    strokeLinecap="round" 
                    r={normalizedRadius} cx="60" cy="60" 
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center z-20">
                <span className="text-3xl font-bold tracking-tighter text-[var(--ios-text)]">{percentage}%</span>
            </div>
        </div>
    );
};

export default function HeaderCard({ data }: { data: any }) {
  const navigate = useNavigate();
  
  const goal = data.goals?.calories || 2000;
  const current = data.current?.calories || 0;
  const caloriesPercent = Math.min(Math.round((current / goal) * 100), 100);
  const remaining = goal - current;

  return (
    <div className="px-4 pt-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-3 touch-scale cursor-pointer" onClick={() => navigate('/profile')}>
           <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-inner flex items-center justify-center overflow-hidden border border-white/10">
               {data.user?.first_name ? (
                   <span className="text-xl font-bold text-[var(--ios-text)]">{data.user.first_name[0]}</span>
               ) : (
                   <span className="text-2xl">👤</span>
               )}
           </div>
           <div>
              <p className="text-xs text-[var(--ios-hint)] font-semibold uppercase tracking-wide">Добро пожаловать</p>
              <h1 className="text-xl font-bold text-[var(--ios-text)] leading-tight">{data.user?.first_name || 'Гость'}</h1>
           </div>
        </div>
      </div>

      {/* Main Widget */}
      <div className="ios-card p-6 flex items-center justify-between relative overflow-hidden">
        {/* Background Blur Blob */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col gap-1 z-10">
            <span className="text-sm font-semibold text-[var(--ios-hint)]">Осталось сегодня</span>
            <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-extrabold tracking-tight ${remaining < 0 ? 'text-[var(--ios-red)]' : 'text-[var(--ios-text)]'}`}>
                    {Math.abs(remaining)}
                </span>
                <span className="text-base font-medium text-[var(--ios-hint)]">ккал</span>
            </div>
            <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-lg bg-[var(--tg-theme-secondary-bg-color)] w-fit">
                <span className="text-xs font-semibold text-[var(--ios-hint)]">Цель: {goal}</span>
            </div>
        </div>
        
        <div className="z-10">
            <ActivityRing percentage={caloriesPercent} />
        </div>
      </div>
    </div>
  );
}
