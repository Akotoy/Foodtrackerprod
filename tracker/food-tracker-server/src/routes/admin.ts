
import { Router } from 'express';
import { supabase } from '../config/clients';

const router = Router();

// 🔐 CONFIG
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SHADOW_OP_2025";
const ADMIN_TOKEN_lz = "shadow_access_granted_x99";

// Middleware
const adminGuard = (req: any, res: any, next: any) => {
    const token = req.headers['x-admin-token'];
    if (token === ADMIN_TOKEN_lz) return next();
    return res.status(403).json({ error: "Access Denied" });
};

// 1. LOGIN
router.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, token: ADMIN_TOKEN_lz });
    } else {
        res.status(401).json({ error: "Wrong Password" });
    }
});

router.use(adminGuard);

// 2. USERS MANAGEMENT
router.get('/users', async (req, res) => {
    try {
        // 1. Запрашиваем всех пользователей
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (usersError) throw usersError;

        // 2. Запрашиваем всех участников марафона отдельно (Manual Join для надежности)
        const { data: participants, error: partError } = await supabase
            .from('marathon_participants')
            .select('user_id, start_date, is_active, access_token');

        if (partError) throw partError;

        // 3. Объединяем данные в памяти
        // Создаем Map для быстрого поиска: user_id -> данные участника
        const partMap = new Map();
        participants?.forEach((p: any) => {
            partMap.set(p.user_id, p);
        });
        
        const formatted = users.map((u: any) => {
            const p = partMap.get(u.telegram_id);
            return {
                ...u,
                marathon_start: p?.start_date || null,
                is_marathon_active: p?.is_active || false,
                marathon_token: p?.access_token || null
            };
        });

        res.json(formatted);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET USER DETAILS
router.get('/users/:id/details', async (req, res) => {
    const { id } = req.params;
    try {
        const [measurements, weight, marathon] = await Promise.all([
            supabase.from('measurement_logs').select('*').eq('user_id', id).order('created_at', { ascending: false }),
            supabase.from('weight_logs').select('*').eq('user_id', id).order('created_at', { ascending: false }),
            supabase.from('marathon_checklist_completions').select('*').eq('user_id', id)
        ]);

        res.json({
            measurements: measurements.data || [],
            weight_history: weight.data || [],
            marathon_progress: marathon.data || []
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/users/:id/toggle-ban', async (req, res) => {
    const { id } = req.params;
    const { is_blocked } = req.body;
    try {
        await supabase.from('users').update({ is_blocked }).eq('telegram_id', id);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Promise.all([
            supabase.from('food_logs').delete().eq('user_id', id),
            supabase.from('water_logs').delete().eq('user_id', id),
            supabase.from('weight_logs').delete().eq('user_id', id),
            supabase.from('measurement_logs').delete().eq('user_id', id),
            supabase.from('marathon_participants').delete().eq('user_id', id),
            supabase.from('marathon_checklist_completions').delete().eq('user_id', id),
            supabase.from('health_test_results').delete().eq('user_id', id),
            supabase.from('chat_messages').delete().eq('user_id', id)
        ]);
        const { error } = await supabase.from('users').delete().eq('telegram_id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/reset', async (req, res) => {
    const { id } = req.params;
    try {
        await Promise.all([
            supabase.from('food_logs').delete().eq('user_id', id),
            supabase.from('water_logs').delete().eq('user_id', id),
            supabase.from('weight_logs').delete().eq('user_id', id),
            supabase.from('measurement_logs').delete().eq('user_id', id),
            supabase.from('marathon_checklist_completions').delete().eq('user_id', id),
            supabase.from('health_test_results').delete().eq('user_id', id),
            supabase.from('chat_messages').delete().eq('user_id', id)
        ]);
        await supabase.from('users').update({ target_goal: null }).eq('telegram_id', id);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/users/:id/marathon-date', async (req, res) => {
    const { id } = req.params;
    const { start_date } = req.body;
    try {
        const { data: exists } = await supabase.from('marathon_participants').select('user_id').eq('user_id', id).single();
        if (exists) {
            await supabase.from('marathon_participants').update({ start_date }).eq('user_id', id);
        } else {
            await supabase.from('marathon_participants').insert({
                user_id: id, start_date, access_token: 'ADMIN_FORCE', is_active: true
            });
        }
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 3. TASK MANAGEMENT
router.get('/tasks', async (req, res) => {
    try {
        const { data } = await supabase.from('marathon_tasks').select('*').order('sort_order', { ascending: true });
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/tasks', async (req, res) => {
    try {
        const { title, icon, task_type, sort_order } = req.body;
        const { data, error } = await supabase.from('marathon_tasks').insert({ title, icon, task_type, sort_order }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, icon, task_type } = req.body;
        const { error } = await supabase.from('marathon_tasks').update({ title, icon, task_type }).eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/tasks/reorder', async (req, res) => {
    const { tasks } = req.body; // Expects array of { id, sort_order }
    try {
        for (const t of tasks) {
            await supabase.from('marathon_tasks').update({ sort_order: t.sort_order }).eq('id', t.id);
        }
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await supabase.from('marathon_checklist_completions').delete().eq('task_id', id);
        const { error } = await supabase.from('marathon_tasks').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 4. TOKENS & STATS
router.get('/tokens', async (req, res) => {
    try {
        const { data } = await supabase.from('marathon_tokens').select('*').order('created_at', { ascending: false });
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/tokens', async (req, res) => {
    try {
        const { code, role, description, start_date, end_date } = req.body;
        const { data, error } = await supabase.from('marathon_tokens').insert({ code, role, description, start_date, end_date }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/tokens/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, description, start_date, end_date } = req.body;
        const { error } = await supabase.from('marathon_tokens').update({ code, description, start_date, end_date }).eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/tokens/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await supabase.from('marathon_tokens').delete().eq('id', id);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', async (req, res) => {
    try {
        const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: totalLogs } = await supabase.from('food_logs').select('*', { count: 'exact', head: true });
        const today = new Date(); today.setHours(0,0,0,0);
        const { count: activeToday } = await supabase.from('food_logs').select('user_id', { count: 'exact', head: true }).gte('created_at', today.toISOString());
        res.json({ totalUsers, totalLogs, activeToday });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
