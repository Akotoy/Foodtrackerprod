"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clients_1 = require("../config/clients");
const router = (0, express_1.Router)();
// 1. ВХОД В МАРАФОН (Проверка токена)
router.post('/enter', async (req, res) => {
    const { telegram_id, token } = req.body;
    // Список валидных токенов (в продакшене лучше вынести в .env или БД)
    const VALID_TOKENS = ["Alpha_#9Xv!m2_Z", "Beta_@7Qp$L4_Y"];
    if (!VALID_TOKENS.includes(token)) {
        return res.status(403).json({ error: "Invalid token" });
    }
    // Регистрируем или обновляем статус участника
    const { error } = await clients_1.supabase
        .from('marathon_participants')
        .upsert({
        user_id: telegram_id,
        access_token: token,
        is_active: true,
        start_date: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ success: true });
});
// 2. ДАШБОРД МАРАФОНА (Сбор данных)
router.get('/dashboard', async (req, res) => {
    try {
        const telegram_id = Number(req.query.telegram_id);
        const today = new Date().toISOString().split('T')[0];
        // А. Данные участника
        const { data: participant } = await clients_1.supabase
            .from('marathon_participants')
            .select('start_date')
            .eq('user_id', telegram_id)
            .single();
        if (!participant) {
            return res.status(404).json({ error: "Not a participant" });
        }
        // Б. Вычисление текущего дня марафона
        const start = new Date(participant.start_date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentDay = dayNumber === 0 ? 1 : dayNumber;
        // В. Выполненные задачи за СЕГОДНЯ (daily)
        const { data: dailyDone } = await clients_1.supabase
            .from('marathon_checklist_completions')
            .select('task_id')
            .eq('user_id', telegram_id)
            .eq('task_type', 'daily')
            .eq('date_ref', today);
        // Г. Выполненные задачи ОБЩИЕ/НЕДЕЛЬНЫЕ (weekly)
        // (Используем is null для date_ref, так как они не привязаны к конкретному дню в этой версии)
        const { data: weeklyDone } = await clients_1.supabase
            .from('marathon_checklist_completions')
            .select('task_id')
            .eq('user_id', telegram_id)
            .eq('task_type', 'weekly')
            .is('date_ref', null);
        // Д. История веса для графика (последние 10 записей)
        const { data: weightHistory } = await clients_1.supabase
            .from('weight_logs')
            .select('weight, created_at')
            .eq('user_id', telegram_id)
            .order('created_at', { ascending: false })
            .limit(10);
        res.json({
            currentDay,
            dailyDone: dailyDone?.map(d => d.task_id) || [],
            weeklyDone: weeklyDone?.map(d => d.task_id) || [],
            weightHistory: weightHistory?.reverse() || []
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// 3. ПЕРЕКЛЮЧЕНИЕ ЗАДАЧИ (Check/Uncheck)
router.post('/task', async (req, res) => {
    const { telegram_id, task_id, task_type } = req.body;
    const today = new Date().toISOString().split('T')[0];
    try {
        // Формируем запрос на поиск существующей записи
        let query = clients_1.supabase
            .from('marathon_checklist_completions')
            .select('id')
            .eq('user_id', telegram_id)
            .eq('task_id', task_id)
            .eq('task_type', task_type);
        // Для ежедневных задач ищем запись за сегодня
        if (task_type === 'daily') {
            query = query.eq('date_ref', today);
        }
        else {
            // Для еженедельных ищем "без даты" (или можно добавить логику недель)
            query = query.is('date_ref', null);
        }
        const { data: existing } = await query.single();
        if (existing) {
            // Если галочка уже стоит — убираем её (удаляем запись)
            await clients_1.supabase.from('marathon_checklist_completions').delete().eq('id', existing.id);
            res.json({ status: 'removed' });
        }
        else {
            // Если галочки нет — ставим (создаем запись)
            await clients_1.supabase.from('marathon_checklist_completions').insert({
                user_id: telegram_id,
                task_id,
                task_type,
                date_ref: task_type === 'daily' ? today : null
            });
            res.json({ status: 'added' });
        }
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// 4. СОХРАНЕНИЕ РЕЗУЛЬТАТОВ ТЕСТА (+ AI Анализ)
router.post('/test-result', async (req, res) => {
    const { telegram_id, test_id, answers, score } = req.body;
    try {
        // 1. Генерируем совет от AI
        let aiAdvice = "Спасибо за прохождение теста. Результаты сохранены.";
        try {
            const prompt = `
                Ты профессиональный нутрициолог. Пользователь прошел тест ${test_id === 1 ? '"Оценка рациона"' : '"Симптомы дефицитов"'}.
                Набрано баллов: ${score}.
                Ответы пользователя (в формате JSON): ${JSON.stringify(answers)}.
                
                Твоя задача:
                1. Проанализировать ответы и общий балл.
                2. Дать короткую, емкую и персонализированную рекомендацию (максимум 3 предложения) на русском языке.
                3. Если баллы указывают на проблемы — будь тактичен, но дай конкретный совет (например, "сдать ферритин" или "добавить клетчатку").
                4. Если всё хорошо — похвали.
            `;
            const completion = await clients_1.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Ты помощник-нутрициолог." },
                    { role: "user", content: prompt }
                ],
            });
            aiAdvice = completion.choices[0].message.content || aiAdvice;
        }
        catch (aiError) {
            console.error("AI Error in tests:", aiError);
            // Не падаем, если AI недоступен, просто сохраняем результаты
        }
        // 2. Сохраняем результаты и совет в БД
        const { error } = await clients_1.supabase.from('health_test_results').insert({
            user_id: telegram_id,
            test_type: test_id,
            score: score,
            answers: answers, // Supabase сам преобразует JS object в JSONB
            ai_recommendation: aiAdvice
        });
        if (error)
            throw error;
        res.json({ success: true, advice: aiAdvice });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=marathon.js.map