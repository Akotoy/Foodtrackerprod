
import axios from 'axios';

const api = axios.create({
    baseURL: '/api' 
});

// Interceptor для добавления initData в каждый запрос
api.interceptors.request.use((config) => {
    // 1. Telegram Auth
    // @ts-ignore
    const initData = window.Telegram?.WebApp?.initData;
    if (initData) {
        config.headers.Authorization = `tma ${initData}`;
    }

    // 2. Timezone (в минутах смещения от UTC, например -180 для UTC+3)
    const tzOffset = new Date().getTimezoneOffset();
    config.headers['x-client-timezone'] = tzOffset;

    return config;
});

export default api;
