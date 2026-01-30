"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = exports.supabase = exports.openai = void 0;
require("dotenv/config");
const openai_1 = require("openai");
const supabase_js_1 = require("@supabase/supabase-js");
const telegraf_1 = require("telegraf");
// Проверка переменных
if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_URL || !process.env.TELEGRAM_BOT_TOKEN) {
    console.error("❌ ОШИБКА: Не заполнен файл .env");
    process.exit(1);
}
// Экспортируем готовые инстансы
exports.openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
exports.bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
//# sourceMappingURL=clients.js.map