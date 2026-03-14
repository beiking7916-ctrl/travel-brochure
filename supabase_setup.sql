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

-- 注意：因採用 Supabase Auth，自建的 admin_users 表格已廢棄刪除。
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- 4. 開啟 Row Level Security (RLS) 並設定公開存取策略
ALTER TABLE public.brochures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;

-- brochures: 
-- 允許完全公開讀取 (讓分享出去的手冊連結不須登入也能看)
DROP POLICY IF EXISTS "Allow anon read brochures" ON public.brochures;
CREATE POLICY "Allow anon read brochures" ON public.brochures
    FOR SELECT USING (true);

-- 限制必須是已登入的管理員才能新增/修改/刪除
DROP POLICY IF EXISTS "Allow anon insert brochures" ON public.brochures;
DROP POLICY IF EXISTS "Allow admin insert brochures" ON public.brochures;
CREATE POLICY "Allow admin insert brochures" ON public.brochures
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update brochures" ON public.brochures;
DROP POLICY IF EXISTS "Allow admin update brochures" ON public.brochures;
CREATE POLICY "Allow admin update brochures" ON public.brochures
    FOR UPDATE TO authenticated USING (true);
    
DROP POLICY IF EXISTS "Allow admin delete brochures" ON public.brochures;
CREATE POLICY "Allow admin delete brochures" ON public.brochures
    FOR DELETE TO authenticated USING (true);


-- countries: 
-- 允許所有人讀取
DROP POLICY IF EXISTS "Allow public read countries" ON public.countries;
CREATE POLICY "Allow public read countries" ON public.countries
    FOR SELECT USING (true);

-- 限制必須是已登入的管理員才能寫入
DROP POLICY IF EXISTS "Allow anon upsert countries" ON public.countries;
DROP POLICY IF EXISTS "Allow admin upsert countries" ON public.countries;
CREATE POLICY "Allow admin upsert countries" ON public.countries
    FOR ALL TO authenticated USING (true);


-- attractions: 
-- 允許所有人讀取
DROP POLICY IF EXISTS "Allow public read attractions" ON public.attractions;
CREATE POLICY "Allow public read attractions" ON public.attractions
    FOR SELECT USING (true);

-- 限制必須是已登入的管理員才能寫入
DROP POLICY IF EXISTS "Allow anon write attractions" ON public.attractions;
DROP POLICY IF EXISTS "Allow admin write attractions" ON public.attractions;
CREATE POLICY "Allow admin write attractions" ON public.attractions
    FOR ALL TO authenticated USING (true);


-- 5. 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_attractions_country_code ON public.attractions(country_code);
CREATE INDEX IF NOT EXISTS idx_attractions_created_at ON public.attractions(created_at DESC);
