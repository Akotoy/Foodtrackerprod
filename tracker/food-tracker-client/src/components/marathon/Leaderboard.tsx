
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    score: number | string;
    rank: number;
    avatar: string;
}

interface Props {
    active: User[];
    effective: User[];
    myId: number;
}

export default function Leaderboard({ active, effective, myId }: Props) {
    const [tab, setTab] = useState<'active' | 'effective'>('active');
    const list = tab === 'active' ? active : effective;
    
    // Находим себя
    const me = list.find(u => u.id === myId);
    const isMeInTop = me && me.rank <= 50; // Предположим, список полный

    return (
        <div className="flex flex-col h-full bg-tg-bg">
            {/* Tabs */}
            <div className="flex p-1 bg-tg-card mx-5 mt-4 rounded-xl border border-tg-border mb-4">
                <button 
                    onClick={() => setTab('active')} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'active' ? 'bg-tg-button text-white shadow-md' : 'text-tg-hint'}`}
                >
                    🔥 Самые активные
                </button>
                <button 
                    onClick={() => setTab('effective')} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'effective' ? 'bg-tg-button text-white shadow-md' : 'text-tg-hint'}`}
                >
                    💪 Результативные
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 pb-20 no-scrollbar space-y-2">
                {list.map((user) => (
                    <div 
                        key={user.id} 
                        className={`flex items-center p-3 rounded-2xl border ${user.id === myId ? 'bg-tg-button/10 border-tg-button/30' : 'bg-tg-card border-tg-border'}`}
                    >
                        <div className={`w-8 h-8 flex items-center justify-center font-black text-sm mr-3 ${
                            user.rank === 1 ? 'text-yellow-500 text-xl' :
                            user.rank === 2 ? 'text-gray-400 text-xl' :
                            user.rank === 3 ? 'text-orange-600 text-xl' :
                            'text-tg-hint'
                        }`}>
                            {user.rank <= 3 ? ['🥇','🥈','🥉'][user.rank-1] : user.rank}
                        </div>
                        
                        <img src={user.avatar} className="w-10 h-10 rounded-full bg-tg-bg border border-tg-border mr-3" />
                        
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${user.id === myId ? 'text-tg-button' : 'text-tg-text'}`}>
                                {user.name} {user.id === myId && '(Вы)'}
                            </p>
                        </div>

                        <div className="font-mono font-bold text-tg-text text-sm">
                            {user.score} {tab === 'active' ? 'pts' : ''}
                        </div>
                    </div>
                ))}
                
                {list.length === 0 && (
                    <div className="text-center text-tg-hint text-sm py-10">Список пока пуст</div>
                )}
            </div>

            {/* Sticky Me (если я не в списке или далеко) */}
            {me && (
                <div className="absolute bottom-6 left-5 right-5 shadow-2xl animate-slide-up">
                    <div className="flex items-center p-3 rounded-2xl bg-tg-button text-white shadow-glow border border-white/10">
                        <div className="w-8 flex justify-center font-black text-sm mr-3">{me.rank}</div>
                        <img src={me.avatar} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 mr-3" />
                        <div className="flex-1 font-bold text-sm">Вы</div>
                        <div className="font-mono font-bold text-sm">{me.score}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
