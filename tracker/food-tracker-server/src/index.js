"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const api_1 = __importDefault(require("./routes/api"));
const marathon_1 = __importDefault(require("./routes/marathon")); // <-- Импорт
const setup_1 = require("./bot/setup");
const notifications_1 = require("./utils/notifications");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Приводим к any, чтобы избежать ошибки несовместимости типов Express RequestHandler в строгом режиме
app.use(express_1.default.json({ limit: '50mb' }));
// 1. Подключаем API
app.use('/api', api_1.default);
app.use('/api/marathon', marathon_1.default); // <-- Подключение
// 2. НАСТРОЙКА ПУТИ К САЙТУ
const publicPath = path_1.default.join(process.cwd(), 'public');
console.log("📂 Пытаюсь найти сайт здесь:", publicPath);
if (fs_1.default.existsSync(publicPath)) {
    console.log("✅ Папка public найдена! Раздаю сайт.");
    // Приводим к any для совместимости типов
    app.use(express_1.default.static(publicPath));
    app.get(/.*/, (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path_1.default.join(publicPath, 'index.html'));
    });
}
else {
    console.error("❌ ОШИБКА: Папка 'public' не найдена!");
    console.error("👉 Убедись, что ты скопировал папку 'dist' из клиента, переименовал в 'public' и положил в корень сервера.");
}
// Запуск бота и уведомлений
(0, setup_1.setupBot)();
(0, notifications_1.setupCronJobs)();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
//# sourceMappingURL=index.js.map