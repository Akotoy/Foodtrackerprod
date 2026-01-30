"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBot = void 0;
const filters_1 = require("telegraf/filters");
const telegraf_1 = require("telegraf"); // <-- Добавили Markup для кнопок
const clients_1 = require("../config/clients");
const common_1 = require("../utils/common");
const notifications_1 = require("../utils/notifications");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const axios_1 = __importDefault(require("axios"));
const AI_MODEL = "gpt-4o";
// --- ФУНКЦИЯ АНАЛИЗА (Без изменений) ---
const handleTextAnalysis = async (userId, text, ctx) => {
    try {
        ctx.reply(`🤔 Анализирую: "${text}"...`);
        const completion = await clients_1.openai.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: "system", content: common_1.SYSTEM_PROMPT }, { role: "user", content: text }],
            response_format: { type: "json_object" }
        });
        const result = JSON.parse(completion.choices[0].message.content || '{}');
        if (!result.calories && result.calories !== 0) {
            ctx.reply("❌ Не смог определить еду.");
            return;
        }
        const { error } = await clients_1.supabase.from('food_logs').insert({
            user_id: userId, name: result.name, calories: result.calories, protein: result.protein, fats: result.fats, carbs: result.carbs, grade: result.grade, is_image_recognized: false
        });
        if (error) {
            if (error.code === '23503')
                ctx.reply("⚠️ Нажми /start");
            else
                throw error;
            return;
        }
        (0, notifications_1.checkOverlimit)(userId, result.calories);
        ctx.reply(`✅ [${result.grade}] ${result.name}\n⚖️ ~${result.weight_g} г\n🔥 ${result.calories} ккал\n💡 ${result.advice}`);
    }
    catch (e) {
        console.error(e);
        ctx.reply("❌ Ошибка анализа.");
    }
};
const setupBot = () => {
    // 1. КОМАНДА /START С ЗАПРОСОМ ТЕЛЕФОНА
    clients_1.bot.command('start', async (ctx) => {
        const userId = ctx.from.id;
        // Регистрируем юзера (если его еще нет)
        await clients_1.supabase.from('users').upsert({
            telegram_id: userId,
            first_name: ctx.from.first_name,
            username: ctx.from.username,
            daily_calories_goal: 2000
        });
        // Отправляем приветствие с КНОПКОЙ
        ctx.reply(`👋 Привет, ${ctx.from.first_name}!\nДля полной авторизации нажми кнопку ниже, чтобы отправить свой номер телефона.`, telegraf_1.Markup.keyboard([
            telegraf_1.Markup.button.contactRequest('📱 Отправить номер телефона')
        ]).resize().oneTime());
    });
    // 2. ОБРАБОТКА ПОЛУЧЕНИЯ КОНТАКТА
    clients_1.bot.on((0, filters_1.message)('contact'), async (ctx) => {
        const userId = ctx.from.id;
        const phone = ctx.message.contact.phone_number;
        // Проверяем, что номер принадлежит именно этому пользователю (защита от пересылки чужих контактов)
        if (ctx.message.contact.user_id !== userId) {
            ctx.reply("❌ Пожалуйста, отправьте СВОЙ номер телефона через кнопку меню.");
            return;
        }
        // Сохраняем номер в базу
        const { error } = await clients_1.supabase
            .from('users')
            .update({ phone: phone })
            .eq('telegram_id', userId);
        if (error) {
            console.error(error);
            ctx.reply("Ошибка сохранения номера.");
        }
        else {
            ctx.reply("✅ Авторизация успешна! Номер сохранен.\nТеперь ты можешь пользоваться всеми функциями: скидывать фото еды, голосовые или текст.", telegraf_1.Markup.removeKeyboard() // Убираем кнопку
            );
        }
    });
    // 3. ГОЛОС
    clients_1.bot.on((0, filters_1.message)('voice'), async (ctx) => {
        try {
            const fileLink = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
            const response = await (0, axios_1.default)({ url: fileLink.href, method: 'GET', responseType: 'stream' });
            const tempFilePath = path_1.default.join(os_1.default.tmpdir(), `voice_${ctx.message.voice.file_id}.ogg`);
            const writer = fs_1.default.createWriteStream(tempFilePath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });
            const transcription = await clients_1.openai.audio.transcriptions.create({ file: fs_1.default.createReadStream(tempFilePath), model: "whisper-1", language: "ru" });
            fs_1.default.unlinkSync(tempFilePath);
            if (transcription.text)
                await handleTextAnalysis(ctx.from.id, transcription.text, ctx);
            else
                ctx.reply("🤷‍♂️ Пусто.");
        }
        catch (e) {
            ctx.reply("❌ Ошибка голоса.");
        }
    });
    // 4. ТЕКСТ
    clients_1.bot.on((0, filters_1.message)('text'), async (ctx) => {
        if (ctx.message.text.startsWith('/'))
            return;
        await handleTextAnalysis(ctx.from.id, ctx.message.text, ctx);
    });
    // 5. ФОТО
    // ... внутри setup.ts
    // ФОТО
    clients_1.bot.on((0, filters_1.message)('photo'), async (ctx) => {
        try {
            ctx.reply("🔎 Анализирую фото...");
            // Берем фото лучшего качества
            const photo = ctx.message.photo.pop();
            if (!photo)
                return;
            // Получаем прямую ссылку на файл
            const fileLink = await ctx.telegram.getFileLink(photo.file_id);
            // Отправляем ссылку прямо в GPT-4o (не скачивая файл на сервер)
            const completion = await clients_1.openai.chat.completions.create({
                model: "gpt-4o", // Обязательно gpt-4o или gpt-4o-mini
                messages: [
                    { role: "system", content: common_1.SYSTEM_PROMPT },
                    { role: "user", content: [
                            { type: "text", text: "Analyze this food image" },
                            { type: "image_url", image_url: { url: fileLink.href } }
                        ] }
                ],
                response_format: { type: "json_object" }
            });
            const result = JSON.parse(completion.choices[0].message.content || '{}');
            const { error } = await clients_1.supabase.from('food_logs').insert({
                user_id: ctx.from.id,
                name: result.name,
                calories: result.calories,
                protein: result.protein,
                fats: result.fats,
                carbs: result.carbs,
                grade: result.grade,
                is_image_recognized: true
            });
            if (error)
                throw error;
            // (Если у тебя настроены уведомления - раскомментируй)
            // checkOverlimit(ctx.from.id, result.calories);
            ctx.reply(`✅ [${result.grade}] ${result.name}\n🔥 ${result.calories} ккал\n💡 ${result.advice}`);
        }
        catch (e) {
            console.error("Photo Error:", e); // Пишем ошибку в лог
            ctx.reply(`❌ Ошибка фото: ${e.message}`);
        }
    });
    clients_1.bot.launch().then(() => console.log("🤖 Telegram Bot started!"));
    process.once('SIGINT', () => clients_1.bot.stop('SIGINT'));
    process.once('SIGTERM', () => clients_1.bot.stop('SIGTERM'));
};
exports.setupBot = setupBot;
//# sourceMappingURL=setup.js.map