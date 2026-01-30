
import { useState } from "react";

interface Props {
    title: string;
    value: number;
    unit: string;
    icon: string;
    color: string; // hex color e.g. #007AFF
    onAdd?: () => void;
    onSubtract?: () => void;
    onChangeDelta?: (delta: number) => void;
    mode: 'stepper' | 'input' | 'readonly';
    max?: number;
    subtitle?: string;
}

export default function TrackerWidget({ 
    title, value, unit, icon, color, 
    onAdd, onSubtract, onChangeDelta, 
    mode, max, subtitle 
}: Props) {
    const [weightInput, setWeightInput] = useState("");

    const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
        // @ts-ignore
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    };

    const handleWeightSubmit = () => {
        if (!weightInput || !onChangeDelta) return;
        const delta = parseInt(weightInput, 10);
        if (!isNaN(delta)) {
            onChangeDelta(delta);
            setWeightInput(""); 
            haptic('heavy');
        }
    };

    // Calculate progress for bar
    const progress = max ? Math.min((value / max) * 100, 100) : 0;

    return (
        <div className="ios-card p-4 flex flex-col justify-between h-44 relative overflow-hidden group touch-scale">
            {/* Header */}
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xl" style={{ color: color }}>{icon}</span>
                        <span className="text-xs font-bold text-[var(--ios-hint)] uppercase tracking-wide">{title}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-[var(--ios-text)] tracking-tight">{value}</span>
                        <span className="text-xs font-semibold text-[var(--ios-hint)]">{unit}</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar (if max exists) */}
            {max && (
                <div className="w-full bg-[var(--tg-theme-secondary-bg-color)] h-1.5 rounded-full overflow-hidden mb-auto mt-2">
                    <div 
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%`, backgroundColor: color }}
                    />
                </div>
            )}

            {/* Controls */}
            <div className="mt-auto relative z-10 w-full">
                {mode === 'stepper' ? (
                    <div className="flex gap-2 items-center">
                        <button 
                            onClick={() => { onSubtract && onSubtract(); haptic('medium'); }}
                            className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center text-[var(--ios-text)] font-medium active:bg-opacity-80 transition-colors"
                        >
                            −
                        </button>
                        <button 
                            onClick={() => { onAdd && onAdd(); haptic('medium'); }}
                            className="flex-1 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md active:scale-95 transition-transform"
                            style={{ backgroundColor: color }}
                        >
                            +
                        </button>
                    </div>
                ) : mode === 'input' ? (
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            placeholder="± г" 
                            value={weightInput}
                            onChange={(e) => setWeightInput(e.target.value)}
                            className="flex-1 h-10 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl px-3 text-center text-sm font-bold text-[var(--ios-text)] outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                            style={{ '--tw-ring-color': color } as any}
                        />
                        <button 
                            onClick={handleWeightSubmit}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md active:scale-95 transition-transform"
                            style={{ backgroundColor: color }}
                        >
                            ✓
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 opacity-70">
                        <span className="text-[10px] font-bold text-[var(--ios-hint)] uppercase tracking-wide">Обновлено:</span>
                        <span className="text-xs font-bold text-[var(--ios-text)]">{subtitle || "—"}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
