
import { useState, useEffect } from 'react';
import api from '../api';

export const useHomeData = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [water, setWater] = useState(0);
    const [weight, setWeight] = useState(0);
    const [lastWeightDate, setLastWeightDate] = useState<string | null>(null);

    const loadData = async () => {
        try {
            if (!data) setLoading(true); 
            
            // 1. Загружаем статистику с сервера (ID из токена)
            const res = await api.get('/daily-stats');

            const serverData = res.data;
            
            if (!serverData || !serverData.user) {
                console.warn("User not found on server");
                setData(null); 
                return;
            }

            setData({
                user: serverData.user,
                goals: serverData.goals,
                current: serverData.current,
                streak: serverData.streak,
                logs: serverData.logs || []
            });

            setWater(serverData.water || 0);
            setWeight(serverData.user.weight || 0);
            setLastWeightDate(serverData.lastWeightDate || null);

        } catch (e) {
            console.error("Error loading home data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log("App visible, refreshing data...");
                loadData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const updateWater = async (amount: number) => {
        const newValue = Math.max(0, water + amount);
        setWater(newValue);
        try {
            await api.post('/water', { amount: amount });
        } catch (e) {
            console.error("Water sync error", e);
            setWater(water);
        }
    };

    const updateWeight = async (amount: number) => {
        const newValue = Number((weight + amount).toFixed(1));
        setWeight(newValue);
        try {
            await api.post('/weight', { amount: amount });
        } catch (e) {
            console.error("Weight sync error", e);
            setWeight(weight);
        }
    };

    return { 
        data, 
        loading, 
        water, 
        weight,
        lastWeightDate, 
        updateWater, 
        updateWeight, 
        refresh: loadData 
    };
};
