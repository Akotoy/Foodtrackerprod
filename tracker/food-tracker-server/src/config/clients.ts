
import 'dotenv/config';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { Telegraf } from 'telegraf';

// Проверка переменных
if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_URL || !process.env.TELEGRAM_BOT_TOKEN) {
    console.error("❌ ОШИБКА: Не заполнен файл .env");
    // Fix: Cast process to any to avoid TypeScript errors regarding missing 'exit' method
    (process as any).exit(1);
}

// Экспортируем готовые инстансы
// Настраиваем клиент для работы через OpenRouter
export const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
