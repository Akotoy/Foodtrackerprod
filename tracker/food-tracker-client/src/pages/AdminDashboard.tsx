
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'users' | 'marathon' | 'tasks'>('users');
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [tokens, setTokens] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterMarathon, setFilterMarathon] = useState(false);

    // Modals & Editing
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    
    // Token Editing
    const [editingToken, setEditingToken] = useState<any>(null);
    const [newToken, setNewToken] = useState({ code: "", role: "user", description: "", start_date: "", end_date: "" });

    // Task Editing
    const [editingTask, setEditingTask] = useState<any>(null);
    const [newTask, setNewTask] = useState({ title: "", icon: "📌", task_type: "daily", sort_order: 1 });

    const getHeaders = () => ({
        'x-admin-token': localStorage.getItem('admin_token') || ''
    });

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/admin', { replace: true });
            return;
        }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                api.get('/admin/stats', { headers: getHeaders() }),
                api.get('/admin/users', { headers: getHeaders() })
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch (e) {
            if ((e as any).response?.status === 403) {
                localStorage.removeItem('admin_token');
                navigate('/admin', { replace: true });
            }
        } finally {
            setLoading(false);
        }
    };

    const loadTokens = async () => {
        try {
            const res = await api.get('/admin/tokens', { headers: getHeaders() });
            setTokens(res.data);
        } catch(e) { console.error(e); }
    };

    const loadTasks = async () => {
        try {
            const res = await api.get('/admin/tasks', { headers: getHeaders() });
            setTasks(res.data);
        } catch(e) { console.error(e); }
    };

    // --- USER ACTIONS ---
    const handleUserClick = async (user: any) => {
        setSelectedUser(user);
        setUserDetails(null);
        try {
            const res = await api.get(`/admin/users/${user.telegram_id}/details`, { headers: getHeaders() });
            setUserDetails(res.data);
        } catch (e) { console.error("Error loading details", e); }
    };

    const toggleBan = async (id: number, currentStatus: boolean, e: any) => {
        e.stopPropagation();
        if(!confirm(`Вы уверены, что хотите ${currentStatus ? 'РАЗБАНИТЬ' : 'ЗАБАНИТЬ'} пользователя?`)) return;
        try {
            await api.post(`/admin/users/${id}/toggle-ban`, { is_blocked: !currentStatus }, { headers: getHeaders() });
            loadData();
        } catch(e) { alert('Ошибка'); }
    };

    const deleteUser = async (id: number, e: any) => {
        e.stopPropagation();
        const confirmStr = prompt("Напишите 'УДАЛИТЬ' чтобы подтвердить полное удаление пользователя и ВСЕХ данных:");
        if (confirmStr !== 'УДАЛИТЬ') return;
        try {
            await api.delete(`/admin/users/${id}`, { headers: getHeaders() });
            setUsers(prev => prev.filter(u => u.telegram_id !== id));
            setSelectedUser(null);
        } catch(e) { alert("Ошибка удаления"); }
    };

    // --- TASK ACTIONS ---
    const handleTaskSubmit = async () => {
        // If editing
        if (editingTask) {
            try {
                await api.put(`/admin/tasks/${editingTask.id}`, editingTask, { headers: getHeaders() });
                setEditingTask(null);
                loadTasks();
            } catch(e) { alert("Ошибка сохранения"); }
            return;
        }
        // If creating
        if (!newTask.title) return;
        try {
            await api.post('/admin/tasks', newTask, { headers: getHeaders() });
            setNewTask({ title: "", icon: "📌", task_type: "daily", sort_order: tasks.length + 1 });
            loadTasks();
        } catch(e) { alert("Ошибка создания"); }
    };

    const deleteTask = async (id: number) => {
        if (!confirm("Удалить задачу? История её выполнения у пользователей тоже будет удалена.")) return;
        try {
            await api.delete(`/admin/tasks/${id}`, { headers: getHeaders() });
            loadTasks();
        } catch(e) { alert("Ошибка удаления"); }
    };

    const moveTask = async (index: number, direction: 'up' | 'down', listType: 'daily' | 'weekly') => {
        const list = tasks.filter(t => t.task_type === listType);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === list.length - 1)) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Optimistic
        const newList = [...list];
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        const updates = newList.map((t, i) => ({ id: t.id, sort_order: i + 1 }));

        setTasks(prev => {
            const otherTasks = prev.filter(t => t.task_type !== listType);
            const updatedList = newList.map((t, i) => ({ ...t, sort_order: i + 1 }));
            return [...otherTasks, ...updatedList].sort((a, b) => a.sort_order - b.sort_order);
        });

        try {
            await api.post('/admin/tasks/reorder', { tasks: updates }, { headers: getHeaders() });
        } catch(e) { loadTasks(); }
    };

    // --- TOKEN ACTIONS ---
    const handleTokenSubmit = async () => {
        // Edit mode
        if (editingToken) {
            try {
                await api.put(`/admin/tokens/${editingToken.id}`, editingToken, { headers: getHeaders() });
                setEditingToken(null);
                loadTokens();
            } catch(e) { alert("Ошибка сохранения"); }
            return;
        }
        // Create mode
        if (!newToken.code) return;
        try {
            await api.post('/admin/tokens', newToken, { headers: getHeaders() });
            setNewToken({ code: "", role: "user", description: "", start_date: "", end_date: "" });
            loadTokens();
        } catch(e) { alert("Ошибка создания"); }
    };

    const deleteToken = async (id: number) => {
        if(!confirm("Отозвать этот токен?")) return;
        try {
            await api.delete(`/admin/tokens/${id}`, { headers: getHeaders() });
            loadTokens();
        } catch(e) { alert("Ошибка удаления"); }
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin', { replace: true });
    };

    useEffect(() => {
        if (tab === 'marathon') loadTokens();
        if (tab === 'tasks') loadTasks();
    }, [tab]);

    const filteredUsers = filterMarathon 
        ? users.filter(u => u.marathon_start) 
        : users;

    const currentTaskForm = editingTask || newTask;
    const currentTokenForm = editingToken || newToken;

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">ЗАГРУЗКА СИСТЕМЫ...</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            {/* Top Bar */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                    <h1 className="font-bold text-lg tracking-wide uppercase font-mono">Панель Управления <span className="text-[10px] bg-white/10 px-1 rounded ml-1">GOD MODE</span></h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500 font-mono hidden md:block uppercase">
                        Юзеры: {stats?.totalUsers} | Логи: {stats?.totalLogs} | Актив: {stats?.activeToday}
                    </div>
                    <button onClick={logout} className="text-xs font-bold text-red-500 hover:text-red-400 border border-red-900/30 px-3 py-1.5 rounded uppercase transition-colors">
                        Выход
                    </button>
                </div>
            </header>

            <div className="flex h-[calc(100vh-64px)] flex-col md:flex-row">
                {/* Sidebar */}
                <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-[#0a0a0a] p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                    <button onClick={() => setTab('users')} className={`p-3 rounded-lg text-left text-sm font-bold transition-all whitespace-nowrap ${tab === 'users' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5'}`}>👥 Пользователи</button>
                    <button onClick={() => setTab('tasks')} className={`p-3 rounded-lg text-left text-sm font-bold transition-all whitespace-nowrap ${tab === 'tasks' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5'}`}>📝 Задачи марафона</button>
                    <button onClick={() => setTab('marathon')} className={`p-3 rounded-lg text-left text-sm font-bold transition-all whitespace-nowrap ${tab === 'marathon' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5'}`}>🎫 Токены доступа</button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-black relative">
                    {tab === 'users' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold font-mono text-gray-400 uppercase">/ Реестр</h2>
                                <button onClick={() => setFilterMarathon(!filterMarathon)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${filterMarathon ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-white/20 text-gray-400 hover:bg-white/5'}`}>{filterMarathon ? '● Только марафонцы' : '○ Все пользователи'}</button>
                            </div>
                            
                            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0F0F0F]">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white/5 text-gray-400 font-mono uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-4">Пользователь</th>
                                            <th className="px-4 py-4">Цель / Статы</th>
                                            <th className="px-4 py-4">Марафон</th>
                                            <th className="px-4 py-4 text-right">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.map((u) => (
                                            <tr key={u.telegram_id} onClick={() => handleUserClick(u)} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-[10px]">{u.first_name?.[0]}</div>
                                                        <div>
                                                            <div className="font-bold flex items-center gap-2">{u.first_name} {u.last_name} {u.is_blocked && <span className="text-[9px] bg-red-500 text-black px-1 rounded font-bold">БАН</span>}</div>
                                                            <div className="text-xs text-gray-500 font-mono">ID: {u.telegram_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4"><div className="flex flex-col gap-1"><span className="text-gray-300 font-mono text-xs">{u.weight}кг / {u.height}см</span><span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded w-fit">{u.target_goal || 'Нет цели'}</span></div></td>
                                                <td className="px-4 py-4">{u.marathon_start ? <div className="flex flex-col"><span className="text-green-400 font-bold text-xs">АКТИВЕН</span><span className="text-[10px] text-gray-500 font-mono">Старт: {new Date(u.marathon_start).toLocaleDateString()}</span></div> : <span className="text-gray-600 text-xs">-</span>}</td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => toggleBan(u.telegram_id, u.is_blocked, e)} className={`w-8 h-8 rounded bg-white/10 flex items-center justify-center transition-colors ${u.is_blocked ? 'text-green-400 hover:bg-green-500/20' : 'text-yellow-400 hover:bg-yellow-500/20'}`}>{u.is_blocked ? '🔓' : '⛔'}</button>
                                                        <button onClick={(e) => deleteUser(u.telegram_id, e)} className="w-8 h-8 rounded bg-white/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors">🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'tasks' && (
                        <div className="space-y-8 animate-fade-in max-w-4xl">
                            <div>
                                <h2 className="text-xl font-bold mb-4 font-mono text-gray-400 uppercase">
                                    {editingTask ? "/ Редактировать задачу" : "/ Добавить задачу"}
                                </h2>
                                <div className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row gap-4 items-end">
                                    <div className="w-20 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Иконка</label>
                                        <input 
                                            type="text" 
                                            value={currentTaskForm.icon}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                editingTask ? setEditingTask({...editingTask, icon: val}) : setNewTask({...newTask, icon: val})
                                            }}
                                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white text-center text-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1 w-full space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Название</label>
                                        <input 
                                            type="text" 
                                            value={currentTaskForm.title}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                editingTask ? setEditingTask({...editingTask, title: val}) : setNewTask({...newTask, title: val})
                                            }}
                                            placeholder="Пить воду..." 
                                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white font-bold focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="w-full md:w-40 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Тип</label>
                                        <select 
                                            value={currentTaskForm.task_type}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                editingTask ? setEditingTask({...editingTask, task_type: val}) : setNewTask({...newTask, task_type: val})
                                            }}
                                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                        >
                                            <option value="daily">Ежедневно</option>
                                            <option value="weekly">Еженедельно</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        {editingTask && (
                                            <button onClick={() => setEditingTask(null)} className="px-4 py-3 bg-red-900/30 text-red-400 font-bold rounded-lg hover:bg-red-900/50 uppercase">
                                                ✕
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleTaskSubmit}
                                            className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-wider text-sm"
                                        >
                                            {editingTask ? "Сохранить" : "Добавить"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { title: "Ежедневные", type: 'daily', color: 'text-blue-400' },
                                    { title: "Еженедельные", type: 'weekly', color: 'text-purple-400' }
                                ].map(section => (
                                    <div key={section.type}>
                                        <h3 className={`text-lg font-bold mb-3 ${section.color} uppercase tracking-wide`}>{section.title}</h3>
                                        <div className="space-y-2">
                                            {tasks.filter(t => t.task_type === section.type).map((t, idx) => (
                                                <div 
                                                    key={t.id} 
                                                    onClick={() => setEditingTask(t)}
                                                    className={`
                                                        bg-[#111] border rounded-xl p-3 flex items-center justify-between group cursor-pointer transition-all
                                                        ${editingTask?.id === t.id ? 'border-blue-500 bg-blue-900/10' : 'border-white/10 hover:border-white/30'}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{t.icon}</span>
                                                        <div>
                                                            <div className="font-bold">{t.title}</div>
                                                            <div className="text-[10px] text-gray-600">Сорт: {t.sort_order}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => moveTask(idx, 'up', section.type as any)} className="text-gray-500 hover:text-white px-1">↑</button>
                                                        <button onClick={() => moveTask(idx, 'down', section.type as any)} className="text-gray-500 hover:text-white px-1">↓</button>
                                                        <button onClick={() => deleteTask(t.id)} className="text-red-500 hover:text-red-400 px-2 ml-2">✕</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'marathon' && (
                        <div className="space-y-8 animate-fade-in max-w-4xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold font-mono text-gray-400 uppercase">
                                    {editingToken ? "/ Редактировать токен" : "/ Генератор токенов"}
                                </h2>
                            </div>
                            
                            <div className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Код токена</label>
                                        <input 
                                            type="text" 
                                            value={currentTokenForm.code}
                                            onChange={(e) => editingToken ? setEditingToken({...editingToken, code: e.target.value}) : setNewToken({...newToken, code: e.target.value})}
                                            placeholder="SUMMER_2025_VIP" 
                                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white font-mono focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="w-full md:w-48 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Роль</label>
                                        <select 
                                            value={currentTokenForm.role}
                                            onChange={(e) => editingToken ? setEditingToken({...editingToken, role: e.target.value}) : setNewToken({...newToken, role: e.target.value})}
                                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                        >
                                            <option value="user">User (Обычный)</option>
                                            <option value="admin">Admin (Админ)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Дата старта</label>
                                        <input 
                                            type="date"
                                            value={currentTokenForm.start_date ? currentTokenForm.start_date.split('T')[0] : ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                editingToken ? setEditingToken({...editingToken, start_date: val}) : setNewToken({...newToken, start_date: val})
                                            }}
                                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Дата окончания</label>
                                        <input 
                                            type="date"
                                            value={currentTokenForm.end_date ? currentTokenForm.end_date.split('T')[0] : ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                editingToken ? setEditingToken({...editingToken, end_date: val}) : setNewToken({...newToken, end_date: val})
                                            }}
                                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 items-end">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Описание</label>
                                        <input 
                                            type="text" 
                                            value={currentTokenForm.description}
                                            onChange={(e) => editingToken ? setEditingToken({...editingToken, description: e.target.value}) : setNewToken({...newToken, description: e.target.value})}
                                            placeholder="Для блогеров..." 
                                            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {editingToken && (
                                            <button onClick={() => setEditingToken(null)} className="px-4 py-3 bg-red-900/30 text-red-400 font-bold rounded-lg hover:bg-red-900/50 uppercase">
                                                ✕
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleTokenSubmit}
                                            className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-wider text-sm"
                                        >
                                            {editingToken ? "Сохранить" : "Создать"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold mb-4 font-mono text-gray-400 uppercase">/ Активные ключи</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {tokens.map(t => (
                                        <div 
                                            key={t.id} 
                                            onClick={() => setEditingToken(t)}
                                            className={`
                                                bg-[#111] border rounded-xl p-4 flex justify-between items-center group cursor-pointer transition-all
                                                ${editingToken?.id === t.id ? 'border-blue-500 bg-blue-900/10' : 'border-white/10 hover:border-white/30'}
                                            `}
                                        >
                                            <div>
                                                <div className="font-mono text-blue-400 font-bold text-lg mb-1">{t.code}</div>
                                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">{t.role}</div>
                                                <div className="text-sm text-gray-400">{t.description || 'Нет описания'}</div>
                                                <div className="text-[10px] text-gray-600 mt-2 font-mono flex gap-2">
                                                    <span>Старт: {t.start_date ? new Date(t.start_date).toLocaleDateString() : '-'}</span>
                                                    <span>Конец: {t.end_date ? new Date(t.end_date).toLocaleDateString() : '-'}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteToken(t.id); }}
                                                className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* USER DETAILS MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex justify-end">
                    <div className="w-full md:w-[600px] h-full bg-[#0F0F0F] border-l border-white/10 p-6 overflow-y-auto animate-slide-up shadow-2xl">
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="mb-6 text-gray-500 hover:text-white flex items-center gap-2"
                        >
                            ← Назад
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                                {selectedUser.first_name?.[0]}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{selectedUser.first_name} {selectedUser.last_name}</h2>
                                <p className="text-gray-500 font-mono text-sm">ID: {selectedUser.telegram_id}</p>
                                <p className="text-blue-400 text-sm mt-1">{selectedUser.phone || 'Нет телефона'}</p>
                            </div>
                        </div>

                        {!userDetails ? (
                            <div className="text-center py-20 text-gray-500 animate-pulse">Загрузка досье...</div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#1A1A1A] p-4 rounded-xl">
                                        <div className="text-xs text-gray-500 uppercase font-bold">Вес</div>
                                        <div className="text-2xl font-bold">{selectedUser.weight} кг</div>
                                    </div>
                                    <div className="bg-[#1A1A1A] p-4 rounded-xl">
                                        <div className="text-xs text-gray-500 uppercase font-bold">Рост</div>
                                        <div className="text-2xl font-bold">{selectedUser.height} см</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold mb-4 text-purple-400 uppercase tracking-wide">История Замеров</h3>
                                    <div className="overflow-x-auto rounded-xl border border-white/10">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-white/5 text-gray-400">
                                                <tr>
                                                    <th className="p-3">Дата</th>
                                                    <th className="p-3">Вес</th>
                                                    <th className="p-3">Грудь</th>
                                                    <th className="p-3">Талия</th>
                                                    <th className="p-3">Бедра</th>
                                                    <th className="p-3">Л.Рука</th>
                                                    <th className="p-3">П.Рука</th>
                                                    <th className="p-3">Л.Нога</th>
                                                    <th className="p-3">П.Нога</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {userDetails.measurements.map((m: any) => (
                                                    <tr key={m.id} className="hover:bg-white/5">
                                                        <td className="p-3 text-gray-300">{new Date(m.created_at).toLocaleDateString()}</td>
                                                        <td className="p-3 font-bold text-white">{m.weight}</td>
                                                        <td className="p-3">{m.chest_cm}</td>
                                                        <td className="p-3">{m.waist_cm}</td>
                                                        <td className="p-3">{m.hips_cm}</td>
                                                        <td className="p-3">{m.l_arm}</td>
                                                        <td className="p-3">{m.r_arm}</td>
                                                        <td className="p-3">{m.l_leg}</td>
                                                        <td className="p-3">{m.r_leg}</td>
                                                    </tr>
                                                ))}
                                                {userDetails.measurements.length === 0 && (
                                                    <tr><td colSpan={9} className="p-4 text-center text-gray-600">Нет записей</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold mb-4 text-blue-400 uppercase tracking-wide">Марафон</h3>
                                    <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-400">Статус</span>
                                            <span className={selectedUser.is_marathon_active ? "text-green-400 font-bold" : "text-gray-500"}>
                                                {selectedUser.is_marathon_active ? "АКТИВЕН" : "НЕАКТИВЕН"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Токен</span>
                                            <span className="font-mono text-sm">{selectedUser.marathon_token || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-gray-400">Начало</span>
                                            <span className="font-mono text-sm">{selectedUser.marathon_start ? new Date(selectedUser.marathon_start).toLocaleDateString() : '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
