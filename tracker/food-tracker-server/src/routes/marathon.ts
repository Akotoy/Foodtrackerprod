
import { Router } from 'express';
import { supabase, openai } from '../config/clients';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// 1. ВХОД В МАРАФОН
router.post('/enter', async (req, res) => {
    const { token } = req.body;
    const telegram_id = req.user.id;

    try {
        const cleanToken = token ? token.trim() : "";
        
        const { data: tokenRecord } = await supabase
            .from('marathon_tokens').select('*').eq('code', cleanToken).single();

        if (!tokenRecord) return res.status(403).json({ error: "Неверный токен доступа" });

        const { data: userExists } = await supabase
            .from('users').select('telegram_id').eq('telegram_id', telegram_id).maybeSingle();

        if (!userExists) return res.status(404).json({ error: "User not found" });

        const { error: participantError } = await supabase
            .from('marathon_participants')
            .upsert({ 
                user_id: telegram_id, 
                access_token: cleanToken,
                is_active: true,
                start_date: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (participantError) throw participantError;
        res.json({ success: true, role: tokenRecord.role });

    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 2. ДАШБОРД МАРАФОНА (DYNAMIC TASKS)
router.get('/dashboard', async (req, res) => {
    try {
        const telegram_id = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const { data: participant } = await supabase
            .from('marathon_participants')
            .select('start_date')
            .eq('user_id', telegram_id)
            .single();

        if (!participant) return res.status(404).json({ error: "Not a participant" });

        const start = new Date(participant.start_date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const currentDay = dayNumber === 0 ? 1 : dayNumber;

        // 1. Получаем список всех активных задач
        const { data: allTasks } = await supabase
            .from('marathon_tasks')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        // 2. Получаем список выполненных задач (для daily - за сегодня, для weekly - вообще)
        const { data: dailyDone } = await supabase.from('marathon_checklist_completions').select('task_id').eq('user_id', telegram_id).eq('task_type', 'daily').eq('date_ref', today);
        const { data: weeklyDone } = await supabase.from('marathon_checklist_completions').select('task_id').eq('user_id', telegram_id).eq('task_type', 'weekly').is('date_ref', null);
        
        const discipline = await calculateDiscipline(telegram_id, participant.start_date);

        // 3. Формируем списки для фронта
        const dailyTasks = allTasks?.filter(t => t.task_type === 'daily').map(t => ({
            id: t.id,
            title: t.title,
            icon: t.icon,
            done: dailyDone?.some(d => d.task_id === t.id) || false
        })) || [];

        const weeklyTasks = allTasks?.filter(t => t.task_type === 'weekly').map(t => ({
            id: t.id,
            title: t.title,
            icon: t.icon,
            done: weeklyDone?.some(d => d.task_id === t.id) || false
        })) || [];

        res.json({
            currentDay,
            dailyTasks,
            weeklyTasks,
            discipline
        });

    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 3. ПЕРЕКЛЮЧЕНИЕ ЗАДАЧИ
router.post('/task', async (req, res) => {
    const { task_id, task_type } = req.body;
    const telegram_id = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    try {
        let query = supabase.from('marathon_checklist_completions').select('id').eq('user_id', telegram_id).eq('task_id', task_id).eq('task_type', task_type);
        if (task_type === 'daily') query = query.eq('date_ref', today);
        else query = query.is('date_ref', null);

        const { data: existing } = await query.single();

        if (existing) {
            await supabase.from('marathon_checklist_completions').delete().eq('id', existing.id);
            res.json({ status: 'removed' });
        } else {
            await supabase.from('marathon_checklist_completions').insert({ user_id: telegram_id, task_id, task_type, date_ref: task_type === 'daily' ? today : null });
            res.json({ status: 'added' });
        }
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 4. ТЕСТЫ
router.post('/test-result', async (req, res) => {
    const { test_id, answers, score } = req.body;
    const telegram_id = req.user.id;

    try {
        let aiAdvice = "Результаты сохранены.";
        try {
            const readableAnswers = Object.entries(answers).map(([qid, val]) => `Q${qid}: ${val}`).join('\n');
            const prompt = `Ты нутрициолог. Тест ${test_id}. Баллы: ${score}. Ответы: ${readableAnswers}. Дай короткий совет.`;
            
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
            });
            aiAdvice = completion.choices[0].message.content || aiAdvice;
        } catch (aiError) { console.error(aiError); }

        const { error } = await supabase.from('health_test_results').insert({
            user_id: telegram_id,
            test_type: test_id,
            score: score,
            answers: answers,
            ai_recommendation: aiAdvice
        });

        if (error) throw error;
        res.json({ success: true, advice: aiAdvice });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 5. ВНЕСЕНИЕ ЗАМЕРОВ (Для ID 6 по старому стилю, но лучше искать по названию или типу)
router.post('/measurements', async (req, res) => {
    const { measurements, date } = req.body; 
    const telegram_id = req.user.id;
    
    // Ищем ID задачи "Замеры" в базе
    const { data: measureTask } = await supabase.from('marathon_tasks').select('id').ilike('title', '%Замеры%').single();
    const taskId = measureTask?.id || 6; // Fallback

    try {
        const logDate = date ? new Date(date).toISOString() : new Date().toISOString();

        const updateData: any = {};
        if (measurements.weight) updateData.weight = Number(measurements.weight);
        if (measurements.chest) updateData.chest_cm = Number(measurements.chest);
        if (measurements.waist) updateData.waist_cm = Number(measurements.waist);
        if (measurements.hips) updateData.hips_cm = Number(measurements.hips);
        if (measurements.lArm) updateData.l_arm = Number(measurements.lArm);
        if (measurements.rArm) updateData.r_arm = Number(measurements.rArm);
        if (measurements.lLeg) updateData.l_leg = Number(measurements.lLeg);
        if (measurements.rLeg) updateData.r_leg = Number(measurements.rLeg);

        await supabase.from('users').update(updateData).eq('telegram_id', telegram_id);

        await supabase.from('measurement_logs').insert({
            user_id: telegram_id,
            weight: measurements.weight ? Number(measurements.weight) : null,
            chest_cm: measurements.chest ? Number(measurements.chest) : null,
            waist_cm: measurements.waist ? Number(measurements.waist) : null,
            hips_cm: measurements.hips ? Number(measurements.hips) : null,
            l_arm: measurements.lArm ? Number(measurements.lArm) : null,
            r_arm: measurements.rArm ? Number(measurements.rArm) : null,
            l_leg: measurements.lLeg ? Number(measurements.lLeg) : null,
            r_leg: measurements.rLeg ? Number(measurements.rLeg) : null,
            created_at: logDate
        });

        // Отмечаем выполнение
        const { data: existing } = await supabase.from('marathon_checklist_completions').select('id').eq('user_id', telegram_id).eq('task_id', taskId).eq('task_type', 'weekly').is('date_ref', null).maybeSingle();
        if (!existing) {
            await supabase.from('marathon_checklist_completions').insert({ user_id: telegram_id, task_id: taskId, task_type: 'weekly', date_ref: null });
        }

        // Пересчет калорий
        if (measurements.weight) {
            const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
            if (user) {
                const age = user.age || 25;
                const weight = Number(measurements.weight);
                const height = user.height || 170;
                
                let bmr = user.gender === 'male' 
                    ? 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age)
                    : 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age);
                
                let goalMultiplier = 1.0;
                if (user.target_goal === 'loss') goalMultiplier = 0.85;
                if (user.target_goal === 'gain') goalMultiplier = 1.15;
                
                const activityFactor = 1.375; 
                const dailyCalories = Math.round(Math.round(bmr * activityFactor) * goalMultiplier);

                await supabase.from('users').update({
                    daily_calories_goal: dailyCalories,
                    daily_protein_goal: Math.round((dailyCalories * 0.3) / 4),
                    daily_fats_goal: Math.round((dailyCalories * 0.3) / 9),
                    daily_carbs_goal: Math.round((dailyCalories * 0.4) / 4),
                }).eq('telegram_id', telegram_id);
            }
        }

        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 6. АНАЛИТИКА
router.get('/analytics', async (req, res) => {
    try {
        const telegram_id = req.user.id;
        const { data: user } = await supabase
            .from('users')
            .select('created_at, weight, chest_cm, waist_cm, hips_cm, l_arm, r_arm, l_leg, r_leg')
            .eq('telegram_id', telegram_id)
            .single();

        const { data: logs } = await supabase
            .from('measurement_logs')
            .select('*')
            .eq('user_id', telegram_id)
            .order('created_at', { ascending: true });
        
        const pointA = user ? {
            created_at: user.created_at || new Date().toISOString(),
            weight: user.weight,
            chest_cm: user.chest_cm,
            waist_cm: user.waist_cm,
            hips_cm: user.hips_cm,
            l_arm: user.l_arm,
            r_arm: user.r_arm,
            l_leg: user.l_leg,
            r_leg: user.r_leg,
            is_start: true
        } : null;

        let combinedData = [];
        if (pointA) combinedData.push(pointA);
        if (logs) combinedData.push(...logs);

        combinedData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        res.json(combinedData);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// РАСЧЕТ ДИСЦИПЛИНЫ
async function calculateDiscipline(userId: number, startDateStr: string): Promise<number> {
    const today = new Date();
    const startDate = new Date(startDateStr);
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const daysSinceStart = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    if (daysSinceStart <= 1) return 10.0;

    const daysToCheck = Math.min(daysSinceStart, 7);
    const checkStartDate = new Date();
    checkStartDate.setDate(today.getDate() - daysToCheck + 1); 
    checkStartDate.setHours(0,0,0,0);

    const { count } = await supabase
        .from('marathon_checklist_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('task_type', 'daily')
        .gte('created_at', checkStartDate.toISOString());

    // Получаем количество активных ежедневных задач из базы
    const { count: dailyTasksCount } = await supabase.from('marathon_tasks').select('*', {count: 'exact', head: true}).eq('task_type', 'daily').eq('is_active', true);
    const TASKS_PER_DAY = dailyTasksCount || 8; 

    const maxPossibleTasks = daysToCheck * TASKS_PER_DAY;
    const score = Math.min(( (count || 0) / maxPossibleTasks ) * 10, 10);
    
    return Number(score.toFixed(1));
}

export default router;
