-- ================================================
-- Travel Brochure - Supabase 資料庫初始化腳本
-- 請在 Supabase Dashboard > SQL Editor 中執行
-- ================================================

-- 1. 建立 brochures 表格（如尚未存在）
CREATE TABLE IF NOT EXISTS public.brochures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立 countries 表格
CREATE TABLE IF NOT EXISTS public.countries (
    code VARCHAR(10) PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_zh VARCHAR(255) NOT NULL
);

-- 3. 建立 attractions 表格
CREATE TABLE IF NOT EXISTS public.attractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code VARCHAR(10) NOT NULL REFERENCES public.countries(code),
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    layout VARCHAR(50) DEFAULT 'default',
    images JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 追加：建立管理使用者表格
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 預設插入初始管理員：kenkenadmin / root7916 (使用 bcrypt hash: $2a$10$tZ8Q7S/0890qEw4vE/Ifm.n4o8c3zW2bF6iL.X.e4gR/V848m6kRK)
INSERT INTO public.admin_users (username, password_hash)
VALUES ('kenkenadmin', '$2a$10$tZ8Q7S/0890qEw4vE/Ifm.n4o8c3zW2bF6iL.X.e4gR/V848m6kRK')
ON CONFLICT (username) DO NOTHING;

-- 4. 開啟 Row Level Security (RLS) 並設定公開存取策略
ALTER TABLE public.brochures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- brochures: 允許匿名讀寫（因為使用 anon key）
DROP POLICY IF EXISTS "Allow anon read brochures" ON public.brochures;
CREATE POLICY "Allow anon read brochures" ON public.brochures
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert brochures" ON public.brochures;
CREATE POLICY "Allow anon insert brochures" ON public.brochures
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update brochures" ON public.brochures;
CREATE POLICY "Allow anon update brochures" ON public.brochures
    FOR UPDATE USING (true);

-- countries: 允許所有人讀取與寫入
DROP POLICY IF EXISTS "Allow public read countries" ON public.countries;
CREATE POLICY "Allow public read countries" ON public.countries
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon upsert countries" ON public.countries;
CREATE POLICY "Allow anon upsert countries" ON public.countries
    FOR ALL USING (true);

-- attractions: 允許所有人讀寫
DROP POLICY IF EXISTS "Allow public read attractions" ON public.attractions;
CREATE POLICY "Allow public read attractions" ON public.attractions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon write attractions" ON public.attractions;
CREATE POLICY "Allow anon write attractions" ON public.attractions
    FOR ALL USING (true);

-- admin_users: 為了方便前端登入與管理，允許所有人讀寫 (實務上應加強安全性)
DROP POLICY IF EXISTS "Allow anon read admin_users" ON public.admin_users;
CREATE POLICY "Allow anon read admin_users" ON public.admin_users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon write admin_users" ON public.admin_users;
CREATE POLICY "Allow anon write admin_users" ON public.admin_users
    FOR ALL USING (true);


-- 5. 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_attractions_country_code ON public.attractions(country_code);
CREATE INDEX IF NOT EXISTS idx_attractions_created_at ON public.attractions(created_at DESC);
