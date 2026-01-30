
import { useState, useMemo } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

const METRIC_CONFIG = {
    weight: { label: 'Вес', unit: 'кг', color: '#3B82F6', key: 'weight', axis: 'left' },
    chest: { label: 'Грудь', unit: 'см', color: '#EC4899', key: 'chest_cm', axis: 'right' },
    waist: { label: 'Талия', unit: 'см', color: '#8B5CF6', key: 'waist_cm', axis: 'right' },
    hips: { label: 'Бедра', unit: 'см', color: '#F472B6', key: 'hips_cm', axis: 'right' },
    lArm: { label: 'Л.Рука', unit: 'см', color: '#10B981', key: 'l_arm', axis: 'right' },
    rArm: { label: 'П.Рука', unit: 'см', color: '#34D399', key: 'r_arm', axis: 'right' },
    lLeg: { label: 'Л.Нога', unit: 'см', color: '#F59E0B', key: 'l_leg', axis: 'right' },
    rLeg: { label: 'П.Нога', unit: 'см', color: '#FBBF24', key: 'r_leg', axis: 'right' },
};

type MetricKey = keyof typeof METRIC_CONFIG;

export default function MeasurementsChart({ history }: { history: any[] }) {
    // По умолчанию выбран только вес
    const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['weight']);

    const toggleMetric = (key: MetricKey) => {
        if (selectedMetrics.includes(key)) {
            // Не даем отключить всё, минимум 1 график
            if (selectedMetrics.length > 1) {
                setSelectedMetrics(prev => prev.filter(m => m !== key));
            }
        } else {
            setSelectedMetrics(prev => [...prev, key]);
        }
    };

    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];
        return history.map(item => {
            const point: any = {
                date: new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
            };
            // Добавляем только существующие значения
            Object.keys(METRIC_CONFIG).forEach((k) => {
                const key = k as MetricKey;
                const dbKey = METRIC_CONFIG[key].key;
                if (item[dbKey] !== null && item[dbKey] !== undefined) {
                    point[key] = Number(item[dbKey]);
                }
            });
            return point;
        });
    }, [history]);

    return (
        <div className="bg-tg-card border border-tg-border rounded-[24px] p-5 mb-4 shadow-sm">
            <h3 className="font-bold text-tg-text mb-4">Динамика</h3>
            
            {/* Toggles */}
            <div className="flex flex-wrap gap-2 mb-6">
                {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => toggleMetric(key)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all border ${
                            selectedMetrics.includes(key) 
                                ? 'bg-tg-button/10 border-tg-button/30' 
                                : 'bg-tg-bg border-transparent text-tg-hint'
                        }`}
                        style={{ 
                            color: selectedMetrics.includes(key) ? METRIC_CONFIG[key].color : undefined 
                        }}
                    >
                        {selectedMetrics.includes(key) && <span className="mr-1">●</span>}
                        {METRIC_CONFIG[key].label}
                    </button>
                ))}
            </div>

            <div className="h-64 w-full -ml-2">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ios-separator)" opacity={0.3} />
                            
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 10, fill: 'var(--ios-hint)' }} 
                                axisLine={false} 
                                tickLine={false}
                                dy={10}
                            />
                            
                            {/* Left Axis (Weight) */}
                            <YAxis 
                                yAxisId="left" 
                                domain={['auto', 'auto']} 
                                tick={{ fontSize: 10, fill: '#3B82F6' }} 
                                axisLine={false} 
                                tickLine={false}
                                width={35}
                                unit="kg"
                            />
                            
                            {/* Right Axis (CM) */}
                            <YAxis 
                                yAxisId="right" 
                                orientation="right"
                                domain={['auto', 'auto']} 
                                tick={{ fontSize: 10, fill: '#8B5CF6' }} 
                                axisLine={false} 
                                tickLine={false}
                                width={35}
                                unit="cm"
                            />

                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'var(--tg-card)', 
                                    borderRadius: '12px', 
                                    border: '1px solid var(--tg-border)', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                                }}
                                labelStyle={{ color: 'var(--tg-hint)', marginBottom: '5px' }}
                            />

                            {selectedMetrics.map(key => (
                                <Line
                                    key={key}
                                    yAxisId={METRIC_CONFIG[key].axis}
                                    type="monotone"
                                    dataKey={key}
                                    name={METRIC_CONFIG[key].label}
                                    stroke={METRIC_CONFIG[key].color}
                                    strokeWidth={3}
                                    dot={{ r: 3, strokeWidth: 0, fill: METRIC_CONFIG[key].color }}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-tg-hint text-xs">
                        Нет данных для графика
                    </div>
                )}
            </div>
        </div>
    );
}
