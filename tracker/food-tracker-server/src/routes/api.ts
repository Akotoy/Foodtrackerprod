
import { Router } from 'express';
import { supabase, openai } from '../config/clients';
import { authMiddleware } from '../middleware/auth';
import { calculateStreak, calculateAge, SYSTEM_PROMPT } from '../utils/common';
import { checkOverlimit } from '../utils/notifications';

const router = Router();
const AI_MODEL = "gpt-4o";

// Helper for date range
const getClientDateRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
};

// Apply auth to all routes
router.use(authMiddleware);

// --- ROUTES ---

// 0. AUTH CHECK (Used in App.tsx)
router.get('/check-user', async (req: any, res) => {
    try {
        const { data } = await supabase.from('users').select('id').eq('telegram_id', req.user.id).single();
        res.json({ isOnboarded: !!data });
    } catch (e) {
        res.json({ isOnboarded: false });
    }
});

// 1. SYNC USER (Onboarding)
router.post('/sync-user', async (req: any, res) => {
    try {
        const { userData } = req.body;
        // Ensure we use the ID from auth token for security
        const telegramId = req.user.id; 

        let age = userData.age || 25;
        if (userData.birth_date) age = calculateAge(userData.birth_date);

        // BMR Calculation
        let bmr = userData.gender === 'male' 
            ? 88.36 + (13.4 * userData.weight) + (4.8 * userData.height) - (5.7 * age)
            : 447.6 + (9.2 * userData.weight) + (3.1 * userData.height) - (4.3 * age);

        let goalMultiplier = 1.0;
        if (userData.target_goal === 'loss') goalMultiplier = 0.85;
        if (userData.target_goal === 'gain') goalMultiplier = 1.15;

        // Default to sedentary if unknown
        const activityFactor = 1.2; 
        const dailyCalories = Math.round(Math.round(bmr * activityFactor) * goalMultiplier);

        const upsertData = {
            telegram_id: telegramId,
            first_name: userData.first_name,
            last_name: userData.last_name,
            username: req.user.username,
            weight: userData.weight,
            height: userData.height,
            age: age,
            gender: userData.gender,
            activity_level: userData.activity_level || 'sedentary',
            target_goal: userData.target_goal || 'maintain',
            target_weight: userData.target_weight,
            
            // Body measurements
            chest_cm: userData.og || userData.chest_cm,
            waist_cm: userData.ot || userData.waist_cm,
            hips_cm: userData.ob || userData.hips_cm,
            l_arm: userData.lArm,
            r_arm: userData.rArm,
            l_leg: userData.lLeg,
            r_leg: userData.rLeg,
            
            goals: userData.goals,

            // Macros
            daily_calories_goal: dailyCalories,
            daily_protein_goal: Math.round((dailyCalories * 0.3) / 4),
            daily_fats_goal: Math.round((dailyCalories * 0.3) / 9),
            daily_carbs_goal: Math.round((dailyCalories * 0.4) / 4),
        };

        const { data, error } = await supabase.from('users').upsert(upsertData, { onConflict: 'telegram_id' }).select();
        if (error) throw error;

        // --- NEW: Save Initial Measurement Log ---
        // Check if logs exist to avoid duplicating if user re-syncs profile
        const { count } = await supabase.from('measurement_logs').select('*', { count: 'exact', head: true }).eq('user_id', telegramId);
        
        if (count === 0) {
            await supabase.from('measurement_logs').insert({
                user_id: telegramId,
                weight: userData.weight,
                chest_cm: userData.og || userData.chest_cm,
                waist_cm: userData.ot || userData.waist_cm,
                hips_cm: userData.ob || userData.hips_cm,
                l_arm: userData.lArm,
                r_arm: userData.rArm,
                l_leg: userData.lLeg,
                r_leg: userData.rLeg,
                created_at: new Date().toISOString() // "Start point"
            });
        }

        res.json({ success: true, user: data[0] });
    } catch (e: any) {
        console.error("Sync Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 2. DAILY STATS
router.get('/daily-stats', async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { data: user } = await supabase.from('users').select('*').eq('telegram_id', userId).single();
        if (!user) return res.status(404).json({ error: "User not found" });

        const { start, end } = getClientDateRange();

        const { data: foodLogs } = await supabase.from('food_logs').select('*').eq('user_id', userId).gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false });
        const { data: waterLogs } = await supabase.from('water_logs').select('amount_ml').eq('user_id', userId).gte('created_at', start).lte('created_at', end);

        const waterTotal = waterLogs?.reduce((sum, item) => sum + item.amount_ml, 0) || 0;
        const current = foodLogs?.reduce((acc: any, item: any) => ({
            calories: acc.calories + (item.calories || 0), 
            protein: acc.protein + (item.protein || 0), 
            fats: acc.fats + (item.fats || 0), 
            carbs: acc.carbs + (item.carbs || 0),
        }), { calories: 0, protein: 0, fats: 0, carbs: 0 });

        const streak = await calculateStreak(userId);

        // Last weight date
        const { data: lastWeightLog } = await supabase
            .from('weight_logs')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        res.json({
            user,
            goals: { calories: user.daily_calories_goal, protein: user.daily_protein_goal, fats: user.daily_fats_goal, carbs: user.daily_carbs_goal },
            current, 
            water: Math.max(0, waterTotal), 
            streak, 
            logs: foodLogs,
            lastWeightDate: lastWeightLog?.created_at || null
        });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 3. WATER
router.post('/water', async (req: any, res) => {
    const { amount } = req.body;
    await supabase.from('water_logs').insert({ user_id: req.user.id, amount_ml: amount });
    res.json({ success: true });
});

// 4. WEIGHT
router.post('/weight', async (req: any, res) => {
    const { amount } = req.body;
    const userId = req.user.id;
    try {
        const { data: user } = await supabase.from('users').select('weight').eq('telegram_id', userId).single();
        const newWeight = Math.round((user.weight + amount) * 10) / 10;
        
        await supabase.from('users').update({ weight: newWeight }).eq('telegram_id', userId);
        
        const { start } = getClientDateRange();
        const { data: existingLog } = await supabase.from('weight_logs').select('id').eq('user_id', userId).gte('created_at', start).limit(1).maybeSingle();
        
        if (existingLog) await supabase.from('weight_logs').update({ weight: newWeight }).eq('id', existingLog.id);
        else await supabase.from('weight_logs').insert({ user_id: userId, weight: newWeight });

        res.json({ success: true, newWeight });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 5. FOOD LOGGING
router.post('/log-food', async (req: any, res) => {
    try {
        const { food } = req.body;
        const { data, error } = await supabase.from('food_logs').insert({ 
            user_id: req.user.id, 
            name: food.name, 
            calories: food.calories, 
            protein: food.protein, 
            fats: food.fats, 
            carbs: food.carbs, 
            grade: food.grade, 
            is_image_recognized: req.body.is_image || false 
        }).select();
        
        if (error) throw error;
        checkOverlimit(req.user.id, food.calories);
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/log-food/:id', async (req, res) => {
    await supabase.from('food_logs').delete().eq('id', req.params.id);
    res.json({ success: true });
});

router.put('/log-food/:id', async (req, res) => {
    const { name, calories, protein, fats, carbs, weight_g } = req.body;
    await supabase.from('food_logs').update({ name, calories, protein, fats, carbs, weight_g }).eq('id', req.params.id);
    res.json({ success: true });
});

// 6. AI ANALYSIS
router.post('/analyze-food', async (req, res) => {
    const { imageBase64, textDescription } = req.body;
    try {
        const messages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
        if (imageBase64) {
            messages.push({ role: "user", content: [{ type: "text", text: "Analyze image" }, { type: "image_url", image_url: { url: imageBase64 } }] });
        } else {
            messages.push({ role: "user", content: textDescription });
        }
        
        const completion = await openai.chat.completions.create({ model: AI_MODEL, messages, response_format: { type: "json_object" } });
        res.json(JSON.parse(completion.choices[0].message.content || '{}'));
    } catch (e) { res.status(500).json({ error: "AI Error" }); }
});

// 7. AI CHAT
router.post('/ai-chat', async (req: any, res) => {
    const { message, history } = req.body;
    const userId = req.user.id;
    try {
        // Save user message
        await supabase.from('chat_messages').insert({ user_id: userId, role: 'user', content: message });

        const { data: user } = await supabase.from('users').select('*').eq('telegram_id', userId).single();
        
        // Context
        const { data: recentLogs } = await supabase.from('food_logs').select('name, calories, grade').eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
        const foodContext = recentLogs?.map((l: any) => `- ${l.name} (${l.calories}kcal)`).join('\n');
        
        const systemPrompt = `You are a friendly AI Nutritionist. User: ${user.first_name}. Context: ${foodContext}. Answer in Russian.`;
        
        const completion = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: "system", content: systemPrompt }, ...(history || []), { role: "user", content: message }]
        });
        
        const reply = completion.choices[0].message.content;
        
        // Save bot reply
        await supabase.from('chat_messages').insert({ user_id: userId, role: 'assistant', content: reply });

        res.json({ reply });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/chat-history', async (req: any, res) => {
    try {
        const { data } = await supabase.from('chat_messages').select('role, content').eq('user_id', req.user.id).order('created_at', { ascending: true }).limit(50);
        res.json(data || []);
    } catch (e) { res.json([]); }
});

// 8. USER PROFILE SETTINGS
router.post('/user/goal', async (req: any, res) => {
    try {
        const { calories } = req.body;
        await supabase.from('users').update({ 
            daily_calories_goal: calories,
            daily_protein_goal: Math.round((calories * 0.3) / 4),
            daily_fats_goal: Math.round((calories * 0.3) / 9),
            daily_carbs_goal: Math.round((calories * 0.4) / 4),
        }).eq('telegram_id', req.user.id);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/user/delete', async (req: any, res) => {
    const userId = req.user.id;
    try {
        await Promise.all([
            supabase.from('food_logs').delete().eq('user_id', userId),
            supabase.from('water_logs').delete().eq('user_id', userId),
            supabase.from('weight_logs').delete().eq('user_id', userId),
            supabase.from('measurement_logs').delete().eq('user_id', userId),
            supabase.from('marathon_participants').delete().eq('user_id', userId),
            supabase.from('marathon_checklist_completions').delete().eq('user_id', userId),
            supabase.from('health_test_results').delete().eq('user_id', userId),
            supabase.from('chat_messages').delete().eq('user_id', userId)
        ]);
        await supabase.from('users').delete().eq('telegram_id', userId);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 9. ACHIEVEMENTS
router.get('/achievements', async (req: any, res) => {
    try {
        // Stub: In real app, calculate based on logs
        const list = [
            { id: 1, title: "Первый шаг", desc: "Записать первый прием пищи", icon: "🍏", unlocked: true },
            { id: 2, title: "Водолей", desc: "Выпить 2л воды за день", icon: "💧", unlocked: false },
            { id: 3, title: "Страйк 7 дней", desc: "Вести дневник неделю подряд", icon: "🔥", unlocked: false },
            { id: 4, title: "Марафонец", desc: "Вступить в марафон", icon: "🏃", unlocked: false },
        ];
        res.json(list);
    } catch (e) { res.json([]); }
});

export default router;
