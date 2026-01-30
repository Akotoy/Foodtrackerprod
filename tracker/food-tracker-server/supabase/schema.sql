
-- 1. USERS
create table if not exists public.users (
    telegram_id bigint primary key,
    first_name text,
    last_name text,
    username text,
    language_code text,
    phone text,
    avatar_url text,
    
    weight numeric,
    height numeric,
    age integer,
    gender text check (gender in ('male', 'female')),
    activity_level text,
    
    target_goal text check (target_goal in ('loss', 'maintain', 'gain')),
    target_weight numeric,
    daily_calories_goal integer default 2000,
    daily_protein_goal integer,
    daily_fats_goal integer,
    daily_carbs_goal integer,
    goals text[],
    
    chest_cm numeric,
    waist_cm numeric,
    hips_cm numeric,
    l_arm numeric,
    r_arm numeric,
    l_leg numeric,
    r_leg numeric,

    is_blocked boolean default false,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. MARATHON TASKS (NEW)
create table if not exists public.marathon_tasks (
    id serial primary key,
    title text not null,
    icon text,
    task_type text check (task_type in ('daily', 'weekly')),
    sort_order int default 0,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- Заполнение дефолтными задачами (если таблица пустая)
insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Овощи', '🥦', 'daily', 1
where not exists (select 1 from public.marathon_tasks);

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Белок', '🥩', 'daily', 2
where not exists (select 1 from public.marathon_tasks where title = 'Белок');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Жиры', '🥑', 'daily', 3
where not exists (select 1 from public.marathon_tasks where title = 'Жиры');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Вода', '💧', 'daily', 4
where not exists (select 1 from public.marathon_tasks where title = 'Вода');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Активность', '🏃‍♂️', 'daily', 5
where not exists (select 1 from public.marathon_tasks where title = 'Активность');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Фото тарелки', '📸', 'daily', 6
where not exists (select 1 from public.marathon_tasks where title = 'Фото тарелки');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Пауза 12ч', '🌙', 'daily', 7
where not exists (select 1 from public.marathon_tasks where title = 'Пауза 12ч');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Сон', '😴', 'daily', 8
where not exists (select 1 from public.marathon_tasks where title = 'Сон');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Тренировка 1', '💪', 'weekly', 1
where not exists (select 1 from public.marathon_tasks where title = 'Тренировка 1');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Тренировка 2', '💪', 'weekly', 2
where not exists (select 1 from public.marathon_tasks where title = 'Тренировка 2');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Тренировка 3', '💪', 'weekly', 3
where not exists (select 1 from public.marathon_tasks where title = 'Тренировка 3');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'SPA/Массаж', '🧖‍♀️', 'weekly', 4
where not exists (select 1 from public.marathon_tasks where title = 'SPA/Массаж');

insert into public.marathon_tasks (title, icon, task_type, sort_order)
select 'Замеры', '⚖️', 'weekly', 6 -- ID 6 важно сохранить для логики замеров, но в новой системе лучше использовать спец. флаг или фиксированный ID
where not exists (select 1 from public.marathon_tasks where title = 'Замеры');

-- 3. MARATHON PARTICIPANTS
create table if not exists public.marathon_participants (
    id serial primary key,
    user_id bigint references public.users(telegram_id) on delete cascade not null,
    access_token text,
    start_date timestamptz default now(),
    is_active boolean default true,
    created_at timestamptz default now(),
    unique(user_id)
);

-- 4. UPDATE MEASUREMENT LOGS (Add limbs if missing)
alter table public.measurement_logs add column if not exists l_arm numeric;
alter table public.measurement_logs add column if not exists r_arm numeric;
alter table public.measurement_logs add column if not exists l_leg numeric;
alter table public.measurement_logs add column if not exists r_leg numeric;

-- 5. UPDATE TOKENS (Add dates)
alter table public.marathon_tokens add column if not exists start_date timestamptz;
alter table public.marathon_tokens add column if not exists end_date timestamptz;
