-- ================================================
-- Travel Brochure - 團隊共享 RLS 政策
-- 請在 Supabase Dashboard > SQL Editor 中執行
-- ================================================

-- 確保表格存在且有 RLS
ALTER TABLE public.brochures ENABLE ROW LEVEL SECURITY;

-- ================================================
-- brochures 表格的 RLS 政策（團隊共享）
-- ================================================

-- 允許所有已登入使用者讀取（團隊共享）
DROP POLICY IF EXISTS "Allow authenticated read brochures" ON public.brochures;
CREATE POLICY "Allow authenticated read brochures" ON public.brochures
    FOR SELECT TO authenticated
    USING (true);

-- 允許匿名使用者讀取（可選，讓分享連結也能看）
DROP POLICY IF EXISTS "Allow anon read brochures" ON public.brochures;
CREATE POLICY "Allow anon read brochures" ON public.brochures
    FOR SELECT TO anon
    USING (true);

-- 允許已登入使用者新增
DROP POLICY IF EXISTS "Allow authenticated insert brochures" ON public.brochures;
CREATE POLICY "Allow authenticated insert brochures" ON public.brochures
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 允許已登入使用者更新
DROP POLICY IF EXISTS "Allow authenticated update brochures" ON public.brochures;
CREATE POLICY "Allow authenticated update brochures" ON public.brochures
    FOR UPDATE TO authenticated
    USING (true);

-- 允許已登入使用者刪除
DROP POLICY IF EXISTS "Allow authenticated delete brochures" ON public.brochures;
CREATE POLICY "Allow authenticated delete brochures" ON public.brochures
    FOR DELETE TO authenticated
    USING (true);

-- ================================================
-- 驗證設定
-- ================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('brochures', 'countries', 'attractions');
