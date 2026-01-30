
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/admin/login', { password });
            if (res.data.success) {
                localStorage.setItem('admin_token', res.data.token);
                navigate('/admin/dashboard');
            } else {
                setError(true);
            }
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <span className="text-3xl">🛡️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wider uppercase">Система Управления</h1>
                    <p className="text-gray-500 text-xs mt-2">Ограниченный доступ. Только для персонала.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input 
                            type="password" 
                            autoFocus
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(false); }}
                            placeholder="Введите ключ доступа..."
                            className={`
                                w-full bg-white/5 border rounded-xl px-5 py-4 text-center text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors font-mono text-lg
                                ${error ? 'border-red-900/50 bg-red-900/10' : 'border-white/10'}
                            `}
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={loading || !password}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                        {loading ? "Аутентификация..." : "Войти"}
                    </button>
                </form>

                {error && (
                    <p className="text-red-500 text-xs text-center mt-6 font-mono animate-pulse">
                        [ОШИБКА] ДОСТУП ЗАПРЕЩЕН. НЕВЕРНЫЙ ПАРОЛЬ.
                    </p>
                )}
            </div>
        </div>
    );
}