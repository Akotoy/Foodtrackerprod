
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes/api';
import marathonRoutes from './routes/marathon'; 
import adminRoutes from './routes/admin'; // <-- NEW
import { setupBot } from './bot/setup';
import { setupCronJobs } from './utils/notifications';
import { globalLimiter } from './config/limiter';

const app = express();

// Trust proxy if behind Nginx (crucial for rate limiting to work with correct IPs)
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '50mb' }) as any);

// Применяем глобальный лимитер ко всем API роутам
app.use('/api', globalLimiter);

// 1. Подключаем API (ВАЖНО: Сначала специфичные роуты, потом общий /api)
app.use('/api/admin', adminRoutes);     // Админка (своя защита)
app.use('/api/marathon', marathonRoutes); // Марафон (своя защита)
app.use('/api', apiRoutes);             // Общее API (Telegram Auth для всего)

// 2. НАСТРОЙКА ПУТИ К САЙТУ
const publicPath = path.join((process as any).cwd(), 'public');

console.log("📂 Пытаюсь найти сайт здесь:", publicPath);

if (fs.existsSync(publicPath)) {
    console.log("✅ Папка public найдена! Раздаю сайт.");
    app.use(express.static(publicPath) as any);
    
    app.get(/.*/, (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path.join(publicPath, 'index.html'));
    });
} else {
    console.error("❌ ОШИБКА: Папка 'public' не найдена!");
}

setupBot();
setupCronJobs();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
